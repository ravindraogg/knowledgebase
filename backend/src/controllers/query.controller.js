import { processNaturalLanguageQuery, ragQuery } from '../services/query.service.js';
import { QueryLog } from '../models/QueryLog.js';
import { Repo } from '../models/Repo.js';
import { getAccessScope, canAccessRepo } from '../services/scope.service.js';

export async function submitQuery(req, res, next) {
  const startTime = Date.now();
  try {
    const { question, repoIds } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'ValidationError', message: 'question is required' });
    }
    const scope = await getAccessScope(req.user.userId);
    if ((repoIds || []).some((repoId) => !canAccessRepo(scope, repoId))) return res.status(403).json({ error: 'Forbidden', message: 'One or more selected repositories are outside your access scope' });

    console.log(`Processing user question: "${question}"`);
    const result = await processNaturalLanguageQuery(question, repoIds || []);

    const latencyMs = Date.now() - startTime;

    const log = new QueryLog({
      question,
      title: question.length > 60 ? question.substring(0, 60) + '...' : question,
      generatedCypher: result.generatedCypher,
      answer: result.answer,
      workspaceResponse: result.workspaceResponse,
      sourceNodeIds: result.sources.map(s => s.id),
      repoIds: repoIds || [],
      latencyMs,
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    await log.save();

    res.json({
      answer: result.answer,
      workspaceResponse: result.workspaceResponse,
      sources: result.sources,
      graphSnippet: result.graphSnippet,
      validationTests: result.validationTests,
      reasoning: result.reasoning,
      latencyMs,
    });
  } catch (error) {
    next(error);
  }
}

export async function ragSubmit(req, res, next) {
  const startTime = Date.now();
  try {
    const { question, repoIds } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'ValidationError', message: 'question is required' });
    }
    if (!repoIds || repoIds.length === 0) {
      return res.status(400).json({ error: 'ValidationError', message: 'At least one repoId is required for RAG query' });
    }
    const scope = await getAccessScope(req.user.userId);
    if (repoIds.some((repoId) => !canAccessRepo(scope, repoId))) return res.status(403).json({ error: 'Forbidden', message: 'One or more selected repositories are outside your access scope' });

    const result = await ragQuery(question, repoIds);

    const log = new QueryLog({
      question,
      title: question.length > 60 ? question.substring(0, 60) + '...' : question,
      answer: result.answer,
      workspaceResponse: result.workspaceResponse,
      sourceNodeIds: result.source.map(s => s.id),
      repoIds,
      latencyMs: result.latencyMs,
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    await log.save();

    res.json({
      query: result.query,
      source: result.source,
      answer: result.answer,
      workspaceResponse: result.workspaceResponse,
      reasoning: result.reasoning,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getQueryHistory(req, res, next) {
  try {
    const filter = { orgId: req.user.orgId };
    const roleLevel = { viewer: 1, member: 2, admin: 3, owner: 4, super_admin: 5 };
    if (roleLevel[req.user.role] < 3) {
      filter.userId = req.user.userId;
    }
    const history = await QueryLog.find(filter).sort({ createdAt: -1 }).limit(50).populate('repoIds', 'name');
    res.json(history);
  } catch (error) {
    next(error);
  }
}

export async function updateQuery(req, res, next) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'title is required' });
    }
    const query = await QueryLog.findOneAndUpdate(
      { _id: req.params.queryId, orgId: req.user.orgId },
      { title: title.trim() },
      { new: true }
    );
    if (!query) return res.status(404).json({ error: 'NotFoundError', message: 'Query not found' });
    res.json(query);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuery(req, res, next) {
  try {
    const query = await QueryLog.findOneAndDelete({ _id: req.params.queryId, orgId: req.user.orgId });
    if (!query) return res.status(404).json({ error: 'NotFoundError', message: 'Query not found' });
    res.json({ message: 'Query deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getQuery(req, res, next) {
  try {
    const query = await QueryLog.findOne({ _id: req.params.queryId, orgId: req.user.orgId });
    if (!query) return res.status(404).json({ error: 'NotFoundError', message: 'Query not found' });
    res.json(query);
  } catch (error) {
    next(error);
  }
}

export async function executeRawCypher(req, res, next) {
  try {
    const { cypher, params } = req.body;
    if (!cypher) {
      return res.status(400).json({ error: 'ValidationError', message: 'cypher is required' });
    }
    const { getNeo4jDriver } = await import('../config/neo4j.js');
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(cypher, params || {});
      const records = result.records.map(record => {
        const obj = {};
        record.keys.forEach(key => {
          const val = record.get(key);
          obj[key] = val ? (val.properties || val) : null;
        });
        return obj;
      });
      res.json({ records });
    } finally {
      await session.close();
    }
  } catch (error) {
    next(error);
  }
}
