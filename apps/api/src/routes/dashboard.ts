import { FastifyInstance } from 'fastify';
import { leadService } from '../services/leadService';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard/stats', async (_request, reply) => {
    const stats = await leadService.getDashboardStats();
    return reply.send(stats);
  });
}
