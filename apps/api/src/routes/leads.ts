import { FastifyInstance } from 'fastify';
import { leadService } from '../services/leadService';
import { messageService } from '../services/messageService';
import { LeadFilters, LeadStatus, WebsiteStatus, RawLeadInput, validateAndNormalizeLeadRow, Business } from '@client-finder/shared';
import { db } from '../db';
import { businesses } from '../db/schema';

export async function leadsRoutes(fastify: FastifyInstance) {
  // Get paginated leads with filters
  fastify.get<{
    Querystring: {
      search?: string;
      city?: string;
      category?: string;
      status?: LeadStatus;
      websiteStatus?: WebsiteStatus;
      doNotContact?: string;
      minScore?: string;
      sortBy?: 'score' | 'created_at' | 'name';
      sortOrder?: 'asc' | 'desc';
      page?: string;
      limit?: string;
    };
  }>('/api/leads', async (request, reply) => {
    const {
      search,
      city,
      category,
      status,
      websiteStatus,
      doNotContact,
      minScore,
      sortBy,
      sortOrder,
      page,
      limit,
    } = request.query;

    const filters: LeadFilters = {
      search,
      city,
      category,
      status,
      websiteStatus,
      doNotContact: doNotContact !== undefined ? doNotContact === 'true' : undefined,
      minScore: minScore ? Number(minScore) : undefined,
      sortBy,
      sortOrder,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await leadService.getLeads(filters);
    return reply.send(result);
  });

  // Get single lead details
  fastify.get<{ Params: { id: string } }>('/api/leads/:id', async (request, reply) => {
    const lead = await leadService.getLeadById(request.params.id);
    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }
    return reply.send(lead);
  });

  // Create single lead manually
  fastify.post<{ Body: RawLeadInput }>('/api/leads', async (request, reply) => {
    const existing = await db.select().from(businesses) as Business[];
    const validation = validateAndNormalizeLeadRow(request.body, 1, existing);

    if (!validation.isValid || !validation.normalized) {
      return reply.status(400).send({ error: validation.errors.join(', ') });
    }

    if (validation.isDuplicate) {
      return reply.status(409).send({
        error: `Duplicate lead detected: ${validation.duplicateReason}`,
        matchedExistingId: validation.matchedExistingId,
      });
    }

    const created = await leadService.createLead(validation.normalized, true);
    return reply.status(201).send(created);
  });

  // Update lead
  fastify.patch<{ Params: { id: string }; Body: Partial<Business> }>('/api/leads/:id', async (request, reply) => {
    try {
      const updated = await leadService.updateLead(request.params.id, request.body);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Delete lead
  fastify.delete<{ Params: { id: string } }>('/api/leads/:id', async (request, reply) => {
    const success = await leadService.deleteLead(request.params.id);
    if (!success) {
      return reply.status(404).send({ error: 'Lead not found' });
    }
    return reply.send({ success: true, message: 'Lead deleted successfully.' });
  });

  // Run website audit and opportunity score
  fastify.post<{ Params: { id: string } }>('/api/leads/:id/audit', async (request, reply) => {
    try {
      const result = await leadService.runWebsiteAuditAndScore(request.params.id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Generate outreach messages for lead
  fastify.post<{ Params: { id: string } }>('/api/leads/:id/messages/generate', async (request, reply) => {
    try {
      const msgs = await messageService.generateMessagesForBusiness(request.params.id);
      return reply.send(msgs);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Prepare contact action
  fastify.post<{
    Params: { id: string };
    Body: { messageId: string; channel: 'WHATSAPP' | 'EMAIL' | 'GENERIC_DM' };
  }>('/api/leads/:id/contact-action', async (request, reply) => {
    const { messageId, channel } = request.body;
    try {
      const result = await messageService.prepareContactAction(request.params.id, messageId, channel);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
