import { FastifyInstance } from 'fastify';
import { messageService } from '../services/messageService';
import { MessageChannel, MessageStatus } from '@client-finder/shared';

export async function messagesRoutes(fastify: FastifyInstance) {
  // Get all generated messages with business info
  fastify.get<{
    Querystring: {
      status?: MessageStatus;
      channel?: MessageChannel;
    };
  }>('/api/messages', async (request, reply) => {
    const { status, channel } = request.query;
    const items = await messageService.getAllMessages(status, channel);
    return reply.send(items);
  });

  // Update a message (content, subject, or status: APPROVED, SKIPPED, DRAFT)
  fastify.patch<{
    Params: { id: string };
    Body: {
      content?: string;
      subject?: string;
      status?: MessageStatus;
    };
  }>('/api/messages/:id', async (request, reply) => {
    try {
      const updated = await messageService.updateMessage(request.params.id, request.body);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
