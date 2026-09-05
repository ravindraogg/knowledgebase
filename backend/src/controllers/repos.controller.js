import { Repo } from '../models/Repo.js';
import { getNeo4jDriver } from '../config/neo4j.js';
import { getAccessScope, canAccessRepo } from '../services/scope.service.js';

export async function listRepos(req, res, next) {
  try {
    const scope = await getAccessScope(req.user.userId);
    const filter = { orgId: req.user.orgId };
    if (scope?.repoIds?.length) filter._id = { $in: scope.repoIds };
    const repos = await Repo.find(filter).sort({ createdAt: -1 });
    res.json(repos);
  } catch (error) {
    next(error);
  }
}

export async function getRepo(req, res, next) {
  try {
    const scope = await getAccessScope(req.user.userId);
    if (!canAccessRepo(scope, req.params.id)) return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this repository' });
    const repo = await Repo.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!repo) return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });
    res.json(repo);
  } catch (error) {
    next(error);
  }
}

export async function listRepoEntities(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (n:CodeEntity {repoId: $repoId})
       RETURN n
       ORDER BY n.type, n.name
       LIMIT 200`,
      { repoId: req.params.id }
    );
    const entities = result.records.map(record => {
      const n = record.get('n').properties;
      return { id: n.id, label: n.name, type: n.type, path: n.path, signature: n.signature, language: n.language };
    });
    res.json({ entities, total: entities.length });
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}

export async function listRepoCommits(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (n:Commit {repoId: $repoId})
       RETURN n
       ORDER BY n.date DESC
       LIMIT 5`,
      { repoId: req.params.id }
    );
    const commits = result.records.map(record => {
      const n = record.get('n').properties;
      let date = n.date;
      if (date && typeof date === 'object' && date.toString) {
        const str = date.toString();
        date = isNaN(Date.parse(str)) ? null : str;
      }
      return { sha: n.sha, message: n.message, author: n.author, date };
    });
    res.json({ commits, total: commits.length });
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}

export async function createRepo(req, res, next) {
  try {
    const { name, repoUrl, branch } = req.body;
    if (!name || !repoUrl) {
      return res.status(400).json({ error: 'ValidationError', message: 'Name and repoUrl are required' });
    }
    const repo = new Repo({ name, repoUrl, branch: branch || 'main', orgId: req.user.orgId });
    await repo.save();
    res.status(201).json(repo);
  } catch (error) {
    next(error);
  }
}

export async function deleteRepo(req, res, next) {
  try {
    const repo = await Repo.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!repo) return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });

    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      await session.run(
        `MATCH (n:CodeEntity {repoId: $repoId}) DETACH DELETE n`,
        { repoId: req.params.id }
      );
    } catch (neoError) {
      console.error('Warning deleting Neo4j nodes:', neoError);
    } finally {
      await session.close();
    }

    res.json({ success: true, message: 'Repository and linked graph data deleted successfully' });
  } catch (error) {
    next(error);
  }
}
