import { FastifyInstance } from 'fastify';
import { CsvLeadSource } from '../sources/CsvLeadSource';
import { PublicUrlLeadSource } from '../sources/PublicUrlLeadSource';
import { leadService } from '../services/leadService';
import { db } from '../db';
import { businesses } from '../db/schema';
import { RawLeadInput, ImportPreviewResult, ImportRowValidation, Business } from '@client-finder/shared';

const csvSource = new CsvLeadSource();
const urlSource = new PublicUrlLeadSource();

export async function sourcesRoutes(fastify: FastifyInstance) {
  // 1. Preview CSV upload / text
  fastify.post('/api/leads/import/preview', async (request, reply) => {
    let csvContent = '';

    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded.' });
      }
      const buffer = await data.toBuffer();
      csvContent = buffer.toString('utf-8');
    } else {
      const body = request.body as { csv?: string };
      csvContent = body?.csv || '';
    }

    if (!csvContent.trim()) {
      return reply.status(400).send({ error: 'CSV data is empty.' });
    }

    try {
      const rawRows = csvSource.parseCsvContent(csvContent);
      const existing = (await db.select().from(businesses)) as Business[];

      const validRows: ImportRowValidation[] = [];
      const invalidRows: ImportRowValidation[] = [];
      const duplicateRows: ImportRowValidation[] = [];

      rawRows.forEach((row, idx) => {
        const validation = csvSource.validate(row, idx + 1, existing);

        if (!validation.isValid) {
          invalidRows.push(validation);
        } else if (validation.isDuplicate) {
          duplicateRows.push(validation);
        } else {
          validRows.push(validation);
        }
      });

      const result: ImportPreviewResult = {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        duplicateCount: duplicateRows.length,
        validRows,
        invalidRows,
        duplicateRows,
      };

      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: `CSV parse error: ${err.message}` });
    }
  });

  // 2. Commit valid leads from preview
  fastify.post<{
    Body: {
      leads: RawLeadInput[];
      runAudits?: boolean;
    };
  }>('/api/leads/import/commit', async (request, reply) => {
    const { leads, runAudits = true } = request.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return reply.status(400).send({ error: 'No valid leads provided to import.' });
    }

    const existing = (await db.select().from(businesses)) as Business[];
    const importedLeads = [];
    let skippedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const raw = leads[i];
      const validation = csvSource.validate(raw, i + 1, existing);

      if (validation.isValid && validation.normalized && !validation.isDuplicate) {
        const created = await leadService.createLead(validation.normalized, runAudits);
        importedLeads.push(created);
        existing.push(created); // prevent intra-batch duplicates
      } else {
        skippedCount++;
      }
    }

    return reply.send({
      importedCount: importedLeads.length,
      skippedCount,
      leads: importedLeads,
    });
  });

  // 3. Ingest from Permitted Source URL
  fastify.post<{
    Body: {
      url: string;
      category?: string;
      city?: string;
    };
  }>('/api/leads/source-url', async (request, reply) => {
    const { url, category, city } = request.body;
    if (!url) {
      return reply.status(400).send({ error: 'Source URL is required.' });
    }

    try {
      const rawRows = await urlSource.ingestFromUrl(url, category, city);
      const existing = (await db.select().from(businesses)) as Business[];

      const validRows: ImportRowValidation[] = [];
      const invalidRows: ImportRowValidation[] = [];
      const duplicateRows: ImportRowValidation[] = [];

      rawRows.forEach((row, idx) => {
        const validation = urlSource.validate(row, idx + 1, existing);
        if (!validation.isValid) {
          invalidRows.push(validation);
        } else if (validation.isDuplicate) {
          duplicateRows.push(validation);
        } else {
          validRows.push(validation);
        }
      });

      const preview: ImportPreviewResult = {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        duplicateCount: duplicateRows.length,
        validRows,
        invalidRows,
        duplicateRows,
      };

      return reply.send({
        url,
        preview,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
