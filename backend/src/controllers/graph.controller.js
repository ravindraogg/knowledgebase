import { getNeo4jDriver } from '../config/neo4j.js';
import { int } from 'neo4j-driver';

export async function exploreGraph(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const { entityId, repoId, limit = 120 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 120, 1), 300);

    let cypher;
    let params = {};

    if (entityId) {
      cypher = `
        MATCH (n:CodeEntity {id: $entityId, orgId: $orgId})
        OPTIONAL MATCH (n)-[r]-(m)
        WHERE (m:CodeEntity OR m:Commit)
        RETURN n, r, m
        LIMIT $limit
      `;
      params = { entityId, orgId: req.user.orgId, limit: int(safeLimit) };
    } else {
      cypher = `
        MATCH (n)
        WHERE (n:CodeEntity OR n:Commit)
          AND n.orgId = $orgId
          AND ($repoId IS NULL OR n.repoId = $repoId)
        OPTIONAL MATCH (n)-[r]->(m)
        WHERE (m:CodeEntity OR m:Commit)
          AND m.orgId = $orgId
          AND ($repoId IS NULL OR m.repoId = $repoId)
        RETURN n, r, m
        LIMIT $limit
      `;
      params = { orgId: req.user.orgId, repoId: repoId || null, limit: int(safeLimit) };
    }

    const result = await session.run(cypher, params);
    const nodesMap = new Map();
    const edgesList = [];

    result.records.forEach(record => {
      const n = record.get('n');
      const r = record.has('r') ? record.get('r') : null;
      const m = record.has('m') ? record.get('m') : null;

      if (n) {
        const props = n.properties;
        const nodeType = n.labels.includes('Commit') ? 'commit' : (props.type || 'unknown');
        nodesMap.set(props.id || props.sha, {
          id: props.id || props.sha,
          label: nodeType === 'commit' ? (props.message || '').split('\n')[0].substring(0, 40) : props.name,
          type: nodeType,
          path: nodeType === 'commit' ? `by ${props.author || 'unknown'}` : props.path,
        });
      }

      if (m) {
        const props = m.properties;
        const nodeType = m.labels.includes('Commit') ? 'commit' : (props.type || 'unknown');
        nodesMap.set(props.id || props.sha, {
          id: props.id || props.sha,
          label: nodeType === 'commit' ? (props.message || '').split('\n')[0].substring(0, 40) : props.name,
          type: nodeType,
          path: nodeType === 'commit' ? `by ${props.author || 'unknown'}` : props.path,
        });
      }

      if (r && n && m) {
        edgesList.push({
          from: n.properties.id || n.properties.sha,
          to: m.properties.id || m.properties.sha,
          type: r.type,
        });
      }
    });

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(new Map(edgesList.map(e => [`${e.from}-${e.to}`, e])).values());

    res.json({ nodes, edges });
  } catch (error) {
    console.warn('⚠️ Neo4j exploreGraph query failed (returning empty graph fallback):', error.message || error);
    res.json({ nodes: [], edges: [] });
  } finally {
    await session.close();
  }
}

export async function getGraphStats(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const repoId = req.query.repoId || null;
    const params = { orgId: req.user.orgId, repoId };
    const codeNodeCount = await session.run('MATCH (n:CodeEntity) WHERE n.orgId = $orgId AND ($repoId IS NULL OR n.repoId = $repoId) RETURN count(n) AS count', params);
    const commitCount = await session.run('MATCH (n:Commit) WHERE n.orgId = $orgId AND ($repoId IS NULL OR n.repoId = $repoId) RETURN count(n) AS count', params);
    const edgeCountResult = await session.run('MATCH (n)-[r]->(m) WHERE n.orgId = $orgId AND m.orgId = $orgId AND ($repoId IS NULL OR (n.repoId = $repoId AND m.repoId = $repoId)) RETURN count(r) AS count', params);
    const byTypeResult = await session.run(
      `MATCH (n:CodeEntity) WHERE n.orgId = $orgId AND ($repoId IS NULL OR n.repoId = $repoId) RETURN n.type AS type, count(n) AS count ORDER BY count DESC`, params
    );

    const codeNodes = codeNodeCount.records[0]?.get('count').toNumber() || 0;
    const commits = commitCount.records[0]?.get('count').toNumber() || 0;
    const edgeCount = edgeCountResult.records[0]?.get('count').toNumber() || 0;
    const byType = {};
    byTypeResult.records.forEach(rec => {
      byType[rec.get('type')] = rec.get('count').toNumber();
    });
    if (commits > 0) byType.commit = commits;

    res.json({ nodeCount: codeNodes + commits, edgeCount, byType, codeNodes, commits });
  } catch (error) {
    console.warn('⚠️ Neo4j stats query failed (returning zero stats fallback):', error.message || error);
    res.json({ nodeCount: 0, edgeCount: 0, byType: {}, codeNodes: 0, commits: 0 });
  } finally {
    await session.close();
  }
}

export async function searchGraph(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ error: 'ValidationError', message: 'Search query (q) is required' });

    let cypher = `
      MATCH (n:CodeEntity)
      WHERE toLower(n.name) CONTAINS toLower($query)
        OR toLower(n.path) CONTAINS toLower($query)
        OR toLower(n.signature) CONTAINS toLower($query)
    `;
    const params = { query: q };

    if (type) {
      cypher += ` AND n.type = $type`;
      params.type = type;
    }

    cypher += ` RETURN n LIMIT 50`;

    const result = await session.run(cypher, params);
    const results = result.records.map(record => {
      const n = record.get('n').properties;
      return { id: n.id, label: n.name, type: n.type, path: n.path, signature: n.signature };
    });

    res.json({ results });
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}

export async function getEntity(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (n:CodeEntity {id: $entityId})
       OPTIONAL MATCH (n)-[r]-(connected)
       RETURN n, collect(DISTINCT {rel: type(r), node: connected}) AS relationships`,
      { entityId: req.params.entityId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Entity not found' });
    }

    const record = result.records[0];
    const entity = record.get('n').properties;
    const relationships = record.get('relationships')
      .filter(r => r.node)
      .map(r => ({
        type: r.rel,
        node: r.node.properties,
      }));

    res.json({ entity, relationships });
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}

export async function getEntityHistory(req, res, next) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (n:CodeEntity {id: $entityId})
       OPTIONAL MATCH (n)<-[:MODIFIES]-(c:Commit)
       OPTIONAL MATCH (c)-[:REFERENCES]->(t:Ticket)
       RETURN collect(DISTINCT c) AS commits, collect(DISTINCT t) AS tickets`,
      { entityId: req.params.entityId }
    );

    const record = result.records[0];
    const commits = (record?.get('commits') || [])
      .filter(c => c)
      .map(c => c.properties);
    const tickets = (record?.get('tickets') || [])
      .filter(t => t)
      .map(t => t.properties);

    res.json({ entityId: req.params.entityId, commits, tickets });
  } catch (error) {
    next(error);
  } finally {
    await session.close();
  }
}
