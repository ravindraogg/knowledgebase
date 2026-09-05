import neo4j from 'neo4j-driver';
import { env } from './env.js';

let driver = null;

export function getNeo4jDriver() {
  if (!driver) {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
    );
  }
  return driver;
}

export async function connectNeo4j() {
  const d = getNeo4jDriver();
  try {
    const session = d.session();
    await session.run('RETURN 1');
    await session.close();
    console.log('✅ Neo4j Connected successfully');
  } catch (error) {
    console.warn('⚠️ Neo4j connection failed (graph database will be unavailable):', error.message || error);
  }
}

export async function disconnectNeo4j() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
