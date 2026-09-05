import { Repo } from '../models/Repo.js';
import { IngestionRun } from '../models/IngestionRun.js';
import { parseDirectory } from '../parsers/typescript.parser.js';
import { loadParsedData } from '../services/neo4j.service.js';
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

export async function listIngestionRuns(req, res, next) {
  try {
    const runs = await IngestionRun.find({ orgId: req.user.orgId })
      .populate('repoId', 'name repoUrl')
      .sort({ createdAt: -1 });
    res.json(runs);
  } catch (error) {
    next(error);
  }
}

export async function getIngestionRun(req, res, next) {
  try {
    const run = await IngestionRun.findOne({ _id: req.params.runId, orgId: req.user.orgId })
      .populate('repoId', 'name repoUrl');
    if (!run) return res.status(404).json({ error: 'NotFoundError', message: 'Ingestion run not found' });
    res.json(run);
  } catch (error) {
    next(error);
  }
}

export async function cancelIngestionRun(req, res, next) {
  try {
    const run = await IngestionRun.findOneAndUpdate(
      { _id: req.params.runId, orgId: req.user.orgId, status: { $in: ['queued', 'running'] } },
      { status: 'cancelled', completedAt: new Date() },
      { new: true }
    );
    if (!run) return res.status(404).json({ error: 'NotFoundError', message: 'Active ingestion run not found' });
    res.json({ success: true, message: 'Ingestion cancelled', run });
  } catch (error) {
    next(error);
  }
}

export async function getIngestionStatus(req, res, next) {
  try {
    const latest = await IngestionRun.findOne({ repoId: req.params.repoId, orgId: req.user.orgId })
      .sort({ createdAt: -1 });
    res.json({
      status: latest?.status || 'never_run',
      progress: latest?.stats || {},
      lastSync: latest?.completedAt || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerIngestion(req, res, next) {
  try {
    const { repoId } = req.body;
    if (!repoId) {
      return res.status(400).json({ error: 'ValidationError', message: 'repoId is required' });
    }

    const repo = await Repo.findOne({ _id: repoId, orgId: req.user.orgId });
    if (!repo) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Repository not found' });
    }

    const run = new IngestionRun({
      repoId,
      orgId: req.user.orgId,
      status: 'running',
      startedAt: new Date(),
    });
    await run.save();

    res.status(202).json({
      message: 'Ingestion started in background',
      runId: run._id,
      status: 'running',
    });

    processIngestionInBackground(repo, run, req.user.orgId).catch(async (err) => {
      console.error('Background ingestion failed:', err);
      run.status = 'failed';
      run.errorLog = err.message;
      run.completedAt = new Date();
      await run.save();
    });
  } catch (error) {
    next(error);
  }
}

async function processIngestionInBackground(repo, run, orgId) {
  const isLocalPath = fs.existsSync(repo.repoUrl);
  let targetPath = repo.repoUrl;
  let isTemp = false;
  const tempDir = path.resolve(`./temp_ingest/${repo._id}`);

  try {
    if (!isLocalPath) {
      console.log(`Cloning repository ${repo.repoUrl} to ${tempDir}`);
      isTemp = true;
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });

      const git = simpleGit();
      await git.clone(repo.repoUrl, tempDir, ['--depth', '1', '-b', repo.branch || 'main']);
      targetPath = tempDir;
    }

    console.log(`Parsing directory: ${targetPath}`);
    const parseResult = parseDirectory(targetPath, orgId, repo._id.toString());

    console.log(`Loading ${parseResult.nodes.length} nodes to Neo4j...`);
    const loadResult = await loadParsedData(orgId, repo._id.toString(), parseResult);

    run.status = 'completed';
    run.stats = {
      entitiesCreated: loadResult.nodesLoaded,
      entitiesUpdated: 0,
      edgesCreated: loadResult.relationshipsLoaded,
      commitsProcessed: 0,
      errorsCount: 0,
    };
    run.completedAt = new Date();
    await run.save();
    console.log(`Ingestion run ${run._id} completed successfully!`);
  } catch (err) {
    console.error(`Ingestion failed for run ${run._id}:`, err);
    run.status = 'failed';
    run.errorLog = err.message || 'Unknown ingestion error';
    run.completedAt = new Date();
    await run.save();
  } finally {
    if (isTemp && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`Failed to remove temp directory:`, rmErr);
      }
    }
  }
}
