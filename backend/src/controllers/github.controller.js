import { Repo } from '../models/Repo.js';
import { getNeo4jDriver } from '../config/neo4j.js';
import * as githubService from '../services/github.service.js';

export async function listGithubRepos(req, res, next) {
  try {
    const repos = await githubService.listUserRepos(req.user.orgId);
    res.json(repos);
  } catch (error) {
    if (error.message.includes('No active GitHub integration')) {
      return res.status(400).json({ error: 'IntegrationRequired', message: error.message });
    }
    next(error);
  }
}

export async function importGithubRepo(req, res, next) {
  try {
    const { owner, name } = req.params;
    const fullName = `${owner}/${name}`;
    const details = await githubService.getRepoDetails(req.user.orgId, owner, name);

    const existing = await Repo.findOne({ orgId: req.user.orgId, name: fullName });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: `Repository ${fullName} is already imported.` });
    }

    const repo = new Repo({
      name: fullName,
      repoUrl: details.clone_url,
      branch: details.default_branch,
      status: 'active',
      orgId: req.user.orgId,
    });
    await repo.save();

    res.status(201).json(repo);
  } catch (error) {
    if (error.message.includes('No active GitHub integration')) {
      return res.status(400).json({ error: 'IntegrationRequired', message: error.message });
    }
    next(error);
  }
}

export async function syncCommits(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const repo = await Repo.findOne({ _id: req.params.repoId, orgId: req.user.orgId });
    if (!repo) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });
    }

    const parts = repo.name.split('/');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'ValidationError', message: 'Repo name must be owner/name format. Only GitHub repos are supported.' });
    }
    const [owner, name] = parts;

    const commits = await githubService.listCommits(req.user.orgId, owner, name, 50);
    let synced = 0;
    let skipped = 0;

    for (const c of commits) {
      const sha = c.sha;
      const existing = await session.run(
        'MATCH (n:Commit {sha: $sha}) RETURN n LIMIT 1',
        { sha }
      );
      if (existing.records.length > 0) {
        skipped++;
        continue;
      }

      const author = c.commit.author?.name || 'unknown';
      const message = c.commit.message || '';
      const date = c.commit.author?.date || new Date().toISOString();

      await session.run(
        `CREATE (n:Commit {
          sha: $sha,
          message: $message,
          author: $author,
          date: datetime($date),
          repoId: $repoId,
          orgId: $orgId
        })`,
        { sha, message, author, date, repoId: repo._id.toString(), orgId: req.user.orgId }
      );

      for (const file of c.files || []) {
        const filePath = file.filename;
        const match = await session.run(
          'MATCH (e:CodeEntity {repoId: $repoId, path: $path}) RETURN e LIMIT 1',
          { repoId: repo._id.toString(), path: filePath }
        );
        if (match.records.length > 0) {
          await session.run(
            `MATCH (c:Commit {sha: $sha}), (e:CodeEntity {repoId: $repoId, path: $path})
             MERGE (c)-[:CHANGES {type: $changeType}]->(e)`,
            { sha, repoId: repo._id.toString(), path: filePath, changeType: file.status || 'modified' }
          );
        }
      }
      synced++;
    }

    res.json({ synced, skipped, total: commits.length });
  } catch (error) {
    if (error.message.includes('No active GitHub integration')) {
      return res.status(400).json({ error: 'IntegrationRequired', message: error.message });
    }
    next(error);
  } finally {
    await session.close();
  }
}

export async function buildKnowledgeBase(req, res, next) {
  try {
    const repo = await Repo.findOne({ _id: req.params.repoId, orgId: req.user.orgId });
    if (!repo) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });
    }

    const parts = repo.name.split('/');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'ValidationError', message: 'Only GitHub repos (owner/name) support knowledge base building.' });
    }
    const [owner, name] = parts;

    const { IngestionRun } = await import('../models/IngestionRun.js');
    const { parseDirectory } = await import('../parsers/typescript.parser.js');
    const { loadParsedData } = await import('../services/neo4j.service.js');
    const simpleGit = (await import('simple-git')).default;
    const fs = await import('fs');
    const path = await import('path');

    const run = new IngestionRun({ repoId: repo._id, orgId: req.user.orgId, status: 'running', startedAt: new Date() });
    await run.save();

    res.status(202).json({ message: 'Building knowledge base...', runId: run._id });

    const tempDir = path.default.resolve(`./temp_ingest/${repo._id}`);
    const results = { codeEntities: 0, commits: 0, errors: [] };

    try {
      if (fs.default.existsSync(tempDir)) {
        fs.default.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.default.mkdirSync(tempDir, { recursive: true });

      const git = simpleGit();
      await git.clone(repo.repoUrl, tempDir, ['--depth', '1', '-b', repo.branch || 'main']);

      const parseResult = parseDirectory(tempDir, req.user.orgId, repo._id.toString());
      const loadResult = await loadParsedData(req.user.orgId, repo._id.toString(), parseResult);
      results.codeEntities = loadResult.nodesLoaded;

      try {
        const commits = await githubService.listCommits(req.user.orgId, owner, name, 50);
        const driver = getNeo4jDriver();
        const session = driver.session();

        for (const c of commits) {
          const sha = c.sha;
          const existing = await session.run('MATCH (n:Commit {sha: $sha}) RETURN n LIMIT 1', { sha });
          if (existing.records.length > 0) continue;

          const author = c.commit.author?.name || 'unknown';
          const message = c.commit.message || '';
          const date = c.commit.author?.date || new Date().toISOString();

          await session.run(
            `CREATE (n:Commit {sha: $sha, message: $message, author: $author, date: datetime($date), repoId: $repoId, orgId: $orgId})`,
            { sha, message, author, date, repoId: repo._id.toString(), orgId: req.user.orgId }
          );

          for (const file of c.files || []) {
            const match = await session.run(
              'MATCH (e:CodeEntity {repoId: $repoId, path: $path}) RETURN e LIMIT 1',
              { repoId: repo._id.toString(), path: file.filename }
            );
            if (match.records.length > 0) {
              await session.run(
                `MATCH (c:Commit {sha: $sha}), (e:CodeEntity {repoId: $repoId, path: $path})
                 MERGE (c)-[:CHANGES {type: $changeType}]->(e)`,
                { sha, repoId: repo._id.toString(), path: file.filename, changeType: file.status || 'modified' }
              );
            }
          }
          results.commits++;
        }
        await session.close();
      } catch (err) {
        results.errors.push('Commit sync: ' + err.message);
      }

      run.status = 'completed';
      run.stats = {
        entitiesCreated: loadResult.nodesLoaded,
        entitiesUpdated: 0,
        edgesCreated: loadResult.relationshipsLoaded,
        commitsProcessed: results.commits,
        errorsCount: results.errors.length,
      };
      run.completedAt = new Date();
      await run.save();
    } catch (err) {
      run.status = 'failed';
      run.errorLog = err.message;
      run.completedAt = new Date();
      await run.save();
    } finally {
      if (fs.default.existsSync(tempDir)) {
        try { fs.default.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    }
  } catch (error) {
    if (!res.headersSent) next(error);
  }
}

export async function getCommits(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const repo = await Repo.findOne({ _id: req.params.repoId, orgId: req.user.orgId });
    if (!repo) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });
    }

    const result = await session.run(
      `MATCH (c:Commit {repoId: $repoId})
       RETURN c
       ORDER BY c.date DESC
       LIMIT 100`,
      { repoId: repo._id.toString() }
    );

    const commits = result.records.map((r) => {
      const props = r.get('c').properties;
      return {
        sha: props.sha,
        message: props.message,
        author: props.author,
        date: props.date ? new Date(props.date.toString()).toISOString() : null,
      };
    });

    res.json(commits);
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}
