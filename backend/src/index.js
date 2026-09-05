import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectMongoDB } from './config/db.js';
import { connectNeo4j, getNeo4jDriver } from './config/neo4j.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.routes.js';
import reposRouter from './routes/repos.routes.js';
import ingestionRouter from './routes/ingestion.routes.js';
import queryRouter from './routes/query.routes.js';
import graphRouter from './routes/graph.routes.js';
import integrationsRouter from './routes/integrations.routes.js';
import orgRouter from './routes/org.routes.js';
import githubRouter from './routes/github.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/ingestion', ingestionRouter);
app.use('/api/query', queryRouter);
app.use('/api/graph', graphRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/org', orgRouter);
app.use('/api/github', githubRouter);

app.get('/api/health', async (req, res) => {
  let mongoStatus = 'disconnected';
  let neo4jStatus = 'disconnected';

  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus = 'connected';
    }
  } catch (err) {
    mongoStatus = `error: ${err.message}`;
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    neo4jStatus = 'connected';
  } catch (err) {
    neo4jStatus = `error: ${err.message}`;
  }

  const isHealthy = mongoStatus === 'connected' && neo4jStatus === 'connected';

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      neo4j: neo4jStatus,
    },
  });
});

app.use(errorHandler);

async function startServer() {
  console.log('Initializing databases...');
  await connectMongoDB();
  await connectNeo4j();

  app.listen(env.PORT, () => {
    console.log(`Recalix backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

startServer().catch((err) => {
  console.error('Failed to start Recalix server:', err);
  process.exit(1);
});
