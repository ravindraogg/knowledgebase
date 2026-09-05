import { getNeo4jDriver } from '../config/neo4j.js';

/**
 * Initializes indexes and constraints in Neo4j
 */
export async function initNeo4jSchema() {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    console.log('🔄 Initializing Neo4j indexes and constraints...');

    try {
      await session.run(`
        CREATE CONSTRAINT code_entity_id_unique IF NOT EXISTS
        FOR (n:CodeEntity)
        REQUIRE n.id IS UNIQUE
      `);
      console.log('✅ CodeEntity uniqueness constraint verified/created');
    } catch (e) {
      console.warn('⚠️ Warning creating CodeEntity uniqueness constraint:', e.message);
    }

    try {
      await session.run(`
        CREATE INDEX code_entity_repoId IF NOT EXISTS
        FOR (n:CodeEntity)
        ON (n.repoId)
      `);
      console.log('✅ CodeEntity repoId index verified/created');
    } catch (e) {
      console.warn('⚠️ Warning creating CodeEntity repoId index:', e.message);
    }

    try {
      await session.run(`
        CREATE INDEX code_entity_path IF NOT EXISTS
        FOR (n:CodeEntity)
        ON (n.path)
      `);
      console.log('✅ CodeEntity path index verified/created');
    } catch (e) {
      console.warn('⚠️ Warning creating CodeEntity path index:', e.message);
    }

    try {
      await session.run(`
        CREATE INDEX commit_sha IF NOT EXISTS
        FOR (n:Commit)
        ON (n.sha)
      `);
      console.log('✅ Commit sha index verified/created');
    } catch (e) {
      console.warn('⚠️ Warning creating Commit sha index:', e.message);
    }

    try {
      await session.run(`
        CREATE INDEX commit_repoId IF NOT EXISTS
        FOR (n:Commit)
        ON (n.repoId)
      `);
      console.log('✅ Commit repoId index verified/created');
    } catch (e) {
      console.warn('⚠️ Warning creating Commit repoId index:', e.message);
    }
  } finally {
    await session.close();
  }
}

/**
 * Loads parsed code nodes and relationships into Neo4j in batch transactions
 */
export async function loadParsedData(orgId, repoId, data) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    await initNeo4jSchema();

    console.log(`🔄 Writing ${data.nodes.length} nodes to Neo4j...`);
    const nodeQuery = `
      UNWIND $nodes AS node
      MERGE (n:CodeEntity {id: node.id})
      ON CREATE SET
        n.orgId = $orgId,
        n.repoId = $repoId,
        n.path = node.path,
        n.name = node.name,
        n.type = node.type,
        n.language = node.language,
        n.signature = node.signature,
        n.severity = node.severity,
        n.description = node.description,
        n.evidence = node.evidence,
        n.startLine = toInteger(node.startLine),
        n.endLine = toInteger(node.endLine),
        n.createdAt = datetime()
      ON MATCH SET
        n.path = node.path,
        n.name = node.name,
        n.signature = node.signature,
        n.severity = node.severity,
        n.description = node.description,
        n.evidence = node.evidence,
        n.startLine = toInteger(node.startLine),
        n.endLine = toInteger(node.endLine),
        n.updatedAt = datetime()
    `;

    await session.executeWrite(async (tx) => {
      await tx.run(nodeQuery, {
        nodes: data.nodes,
        orgId,
        repoId,
      });
    });

    const containsRels = data.relationships.filter(r => r.type === 'CONTAINS');
    const dependsOnRels = data.relationships.filter(r => r.type === 'DEPENDS_ON');

    console.log(`🔄 Writing ${containsRels.length} CONTAINS relationships to Neo4j...`);
    if (containsRels.length > 0) {
      const containsQuery = `
        UNWIND $relationships AS rel
        MATCH (from:CodeEntity {id: rel.fromId})
        MATCH (to:CodeEntity {id: rel.toId})
        MERGE (from)-[:CONTAINS]->(to)
      `;
      await session.executeWrite(async (tx) => {
        await tx.run(containsQuery, { relationships: containsRels });
      });
    }

    console.log(`🔄 Writing ${dependsOnRels.length} DEPENDS_ON relationships to Neo4j...`);
    if (dependsOnRels.length > 0) {
      const dependsOnQuery = `
        UNWIND $relationships AS rel
        MATCH (from:CodeEntity {id: rel.fromId})
        MATCH (to:CodeEntity {id: rel.toId})
        MERGE (from)-[r:DEPENDS_ON]->(to)
        SET r.type = coalesce(rel.metadata.type, 'import')
      `;
      await session.executeWrite(async (tx) => {
        await tx.run(dependsOnQuery, { relationships: dependsOnRels });
      });
    }

    console.log('✅ Code nodes and relationships loaded successfully');
    return {
      nodesLoaded: data.nodes.length,
      relationshipsLoaded: data.relationships.length,
    };
  } catch (error) {
    console.error('❌ Failed to load parsed data into Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
}
