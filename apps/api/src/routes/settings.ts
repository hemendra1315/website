import { FastifyInstance } from 'fastify';
import { leadService } from '../services/leadService';
import { db } from '../db';
import { businesses, opportunities, website_audits } from '../db/schema';
import { eq } from 'drizzle-orm';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { CsvLeadSource } from '../sources/CsvLeadSource';
import { Business, escapeCsvFormulaInjection } from '@client-finder/shared';

const csvSource = new CsvLeadSource();

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get settings
  fastify.get('/api/settings', async (_request, reply) => {
    const s = await leadService.getSettings();
    return reply.send(s);
  });

  // Update settings
  fastify.put('/api/settings', async (request, reply) => {
    const updated = await leadService.updateSettings(request.body as any);
    return reply.send(updated);
  });

  // Export CSV of all leads
  fastify.get('/api/data/export', async (_request, reply) => {
    const leads = await db
      .select({
        business: businesses,
        opportunity: opportunities,
        audit: website_audits,
      })
      .from(businesses)
      .leftJoin(opportunities, eq(businesses.id, opportunities.business_id))
      .leftJoin(website_audits, eq(businesses.id, website_audits.business_id));

    const csvData = leads.map(l => ({
      id: escapeCsvFormulaInjection(l.business.id),
      name: escapeCsvFormulaInjection(l.business.name),
      category: escapeCsvFormulaInjection(l.business.category),
      city: escapeCsvFormulaInjection(l.business.city),
      address: escapeCsvFormulaInjection(l.business.address || ''),
      phone: escapeCsvFormulaInjection(l.business.public_phone || ''),
      email: escapeCsvFormulaInjection(l.business.public_email || ''),
      website: escapeCsvFormulaInjection(l.business.website || ''),
      social_url: escapeCsvFormulaInjection(l.business.social_url || ''),
      source_url: escapeCsvFormulaInjection(l.business.source_url || ''),
      source_type: escapeCsvFormulaInjection(l.business.source_type),
      status: escapeCsvFormulaInjection(l.business.status),
      do_not_contact: l.business.do_not_contact ? 'true' : 'false',
      opportunity_score: l.opportunity?.score ?? '',
      website_status: l.audit?.website_status ?? '',
      created_at: escapeCsvFormulaInjection(l.business.created_at),
    }));

    const csvOutput = stringify(csvData, { header: true });

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="client-finder-leads.csv"');
    return reply.send(csvOutput);
  });

  // Clear database
  fastify.post<{ Body: { confirmation: string } }>('/api/data/clear', async (request, reply) => {
    const { confirmation } = request.body || {};
    if (confirmation !== 'CLEAR_ALL_DATA') {
      return reply.status(400).send({
        error: 'Confirmation string mismatch. Please confirm with CLEAR_ALL_DATA.'
      });
    }

    await leadService.clearAllData();
    return reply.send({ success: true, message: 'Database successfully cleared.' });
  });

  // Seed demo data
  fastify.post('/api/demo/seed', async (_request, reply) => {
    try {
      const demoCsvPath = path.resolve(process.cwd(), 'data', 'demo-leads.csv');
      let csvContent = '';
      if (fs.existsSync(demoCsvPath)) {
        csvContent = fs.readFileSync(demoCsvPath, 'utf-8');
      } else {
        return reply.status(404).send({ error: 'Demo CSV file not found at data/demo-leads.csv' });
      }

      const rawRows = csvSource.parseCsvContent(csvContent);
      const existing = (await db.select().from(businesses)) as Business[];

      let importedCount = 0;
      for (let i = 0; i < rawRows.length; i++) {
        const raw = rawRows[i];
        raw.is_demo = true;
        const validation = csvSource.validate(raw, i + 1, existing);

        if (validation.isValid && validation.normalized && !validation.isDuplicate) {
          const created = await leadService.createLead(validation.normalized, true);
          existing.push(created);
          importedCount++;
        }
      }

      return reply.send({
        success: true,
        importedCount,
        message: `Successfully seeded ${importedCount} demo businesses.`
      });
    } catch (err: any) {
      return reply.status(500).send({ error: `Failed to seed demo data: ${err.message}` });
    }
  });
}
