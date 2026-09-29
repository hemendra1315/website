import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { initDatabase } from './db';
import { leadsRoutes } from './routes/leads';
import { messagesRoutes } from './routes/messages';
import { sourcesRoutes } from './routes/sources';
import { dashboardRoutes } from './routes/dashboard';
import { settingsRoutes } from './routes/settings';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function main() {
  // Initialize SQLite database schema
  await initDatabase();

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Register Multipart for CSV uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Health check endpoint
  fastify.get('/api/health', async () => {
    return { status: 'ok', time: new Date().toISOString() };
  });

  // Register API Routes
  await fastify.register(leadsRoutes);
  await fastify.register(messagesRoutes);
  await fastify.register(sourcesRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(settingsRoutes);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = process.env.HOST || '127.0.0.1';

  try {
    await fastify.listen({ port, host });
    console.log(`[Client Finder API] Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
