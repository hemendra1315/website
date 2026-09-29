import { db, sqliteClient } from '../db';
import { businesses, website_audits, opportunities, messages, outreach, activity_log, settings } from '../db/schema';
import { eq, desc, asc, and, or, like, gte, sql } from 'drizzle-orm';
import {
  Business,
  WebsiteAudit,
  Opportunity,
  NormalizedLead,
  LeadFilters,
  DashboardStats,
  calculateOpportunityScore,
  AppSettings,
} from '@client-finder/shared';
import crypto from 'crypto';
import { websiteAuditService } from './websiteAuditService';

export class LeadService {
  /**
   * Fetches all leads with their latest opportunity score and website audit
   */
  async getLeads(filters: LeadFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const offset = (page - 1) * limit;

    let query = db
      .select({
        business: businesses,
        opportunity: opportunities,
        audit: website_audits,
      })
      .from(businesses)
      .leftJoin(opportunities, eq(businesses.id, opportunities.business_id))
      .leftJoin(website_audits, eq(businesses.id, website_audits.business_id));

    const conditions = [];

    if (filters.search) {
      const searchPattern = `%${filters.search.toLowerCase().trim()}%`;
      conditions.push(
        or(
          like(sql`lower(${businesses.name})`, searchPattern),
          like(sql`lower(${businesses.category})`, searchPattern),
          like(sql`lower(${businesses.city})`, searchPattern),
          like(sql`lower(${businesses.address})`, searchPattern),
          like(sql`lower(${businesses.public_email})`, searchPattern),
          like(sql`lower(${businesses.public_phone})`, searchPattern)
        )
      );
    }

    if (filters.city) {
      conditions.push(like(sql`lower(${businesses.city})`, `%${filters.city.toLowerCase().trim()}%`));
    }

    if (filters.category) {
      conditions.push(like(sql`lower(${businesses.category})`, `%${filters.category.toLowerCase().trim()}%`));
    }

    if (filters.status) {
      conditions.push(eq(businesses.status, filters.status));
    }

    if (typeof filters.doNotContact === 'boolean') {
      conditions.push(eq(businesses.do_not_contact, filters.doNotContact));
    }

    if (filters.websiteStatus) {
      conditions.push(eq(website_audits.website_status, filters.websiteStatus));
    }

    if (typeof filters.minScore === 'number') {
      conditions.push(gte(opportunities.score, filters.minScore));
    }

    let finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;

    // Sorting
    if (filters.sortBy === 'name') {
      finalQuery = filters.sortOrder === 'desc'
        ? (finalQuery as any).orderBy(desc(businesses.name))
        : (finalQuery as any).orderBy(asc(businesses.name));
    } else if (filters.sortBy === 'created_at') {
      finalQuery = filters.sortOrder === 'asc'
        ? (finalQuery as any).orderBy(asc(businesses.created_at))
        : (finalQuery as any).orderBy(desc(businesses.created_at));
    } else {
      // Default sort by opportunity score desc, then created_at desc
      finalQuery = (finalQuery as any).orderBy(desc(opportunities.score), desc(businesses.created_at));
    }

    const rows = await (finalQuery as any).limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`count(distinct ${businesses.id})` })
      .from(businesses)
      .leftJoin(opportunities, eq(businesses.id, opportunities.business_id))
      .leftJoin(website_audits, eq(businesses.id, website_audits.business_id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }

    const totalCountRes = await countQuery;
    const total = Number(totalCountRes[0]?.count || 0);

    const items = rows.map((r: any) => ({
      ...r.business,
      opportunity: r.opportunity ? {
        ...r.opportunity,
        reasons: JSON.parse(r.opportunity.reasons || '[]'),
      } : null,
      audit: r.audit,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetches full lead details including audit, opportunity, messages, and activity log
   */
  async getLeadById(id: string) {
    const businessRows = await db.select().from(businesses).where(eq(businesses.id, id));
    const business = businessRows[0];
    if (!business) return null;

    const auditRows = await db.select().from(website_audits).where(eq(website_audits.business_id, id));
    const audit = auditRows[0] || null;

    const opportunityRows = await db.select().from(opportunities).where(eq(opportunities.business_id, id));
    const opportunityRecord = opportunityRows[0] || null;

    const messageList = await db.select().from(messages).where(eq(messages.business_id, id)).orderBy(desc(messages.created_at));
    const outreachList = await db.select().from(outreach).where(eq(outreach.business_id, id)).orderBy(desc(outreach.created_at));
    const activityList = await db.select().from(activity_log).where(eq(activity_log.business_id, id)).orderBy(desc(activity_log.created_at));

    const parsedOpportunity = opportunityRecord ? {
      ...opportunityRecord,
      reasons: JSON.parse(opportunityRecord.reasons || '[]'),
    } : null;

    const parsedActivity = activityList.map(a => ({
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : null,
    }));

    return {
      ...business,
      audit: audit || null,
      opportunity: parsedOpportunity,
      messages: messageList,
      outreach: outreachList,
      activity: parsedActivity,
    };
  }

  /**
   * Inserts or imports a normalized lead, evaluates initial score and audit
   */
  async createLead(normalized: NormalizedLead, runAuditImmediately = true): Promise<Business> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newLead: Business = {
      id,
      name: normalized.name,
      normalized_name: normalized.normalized_name,
      category: normalized.category,
      city: normalized.city,
      address: normalized.address,
      public_phone: normalized.public_phone,
      public_email: normalized.public_email,
      website: normalized.website,
      normalized_domain: normalized.normalized_domain,
      social_url: normalized.social_url,
      source_url: normalized.source_url,
      source_type: normalized.source_type,
      status: 'NEW',
      do_not_contact: false,
      is_demo: normalized.is_demo,
      created_at: now,
      updated_at: now,
    };

    await db.insert(businesses).values(newLead);

    await this.logActivity(id, 'LEAD_CREATED', {
      source: normalized.source_type,
      name: normalized.name,
    });

    if (runAuditImmediately) {
      await this.runWebsiteAuditAndScore(id);
    } else {
      // Calculate score without full audit
      const scoreBreakdown = calculateOpportunityScore({
        website: normalized.website,
        public_phone: normalized.public_phone,
        public_email: normalized.public_email,
        social_url: normalized.social_url,
      });

      await db.insert(opportunities).values({
        id: crypto.randomUUID(),
        business_id: id,
        score: scoreBreakdown.score,
        website_score: scoreBreakdown.website_score,
        mobile_score: scoreBreakdown.mobile_score,
        conversion_score: scoreBreakdown.conversion_score,
        business_fit_score: scoreBreakdown.business_fit_score,
        reasons: JSON.stringify(scoreBreakdown.reasons),
        created_at: now,
      });
    }

    return newLead;
  }

  /**
   * Runs or re-runs website audit and recalculates opportunity score deterministically
   */
  async runWebsiteAuditAndScore(businessId: string): Promise<{ audit: WebsiteAudit; opportunity: Opportunity }> {
    const businessRows = await db.select().from(businesses).where(eq(businesses.id, businessId));
    const business = businessRows[0];
    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    const auditData = await websiteAuditService.auditWebsite(business.id, business.website);

    // Save or update audit in DB
    const auditRows = await db.select().from(website_audits).where(eq(website_audits.business_id, businessId));
    const existingAudit = auditRows[0];

    if (existingAudit) {
      await db.update(website_audits).set({
        website_status: auditData.website_status,
        https_enabled: auditData.https_enabled,
        mobile_ready: auditData.mobile_ready,
        title: auditData.title,
        description: auditData.description,
        contact_path: auditData.contact_path,
        observations: auditData.observations,
        audited_at: auditData.audited_at,
      }).where(eq(website_audits.id, existingAudit.id));
    } else {
      await db.insert(website_audits).values(auditData);
    }

    // Deterministic Opportunity Score Calculation
    const scoreBreakdown = calculateOpportunityScore(
      {
        website: business.website,
        public_phone: business.public_phone,
        public_email: business.public_email,
        social_url: business.social_url,
      },
      auditData
    );

    const now = new Date().toISOString();
    const oppRows = await db.select().from(opportunities).where(eq(opportunities.business_id, businessId));
    const existingOpportunity = oppRows[0];

    let oppResult: Opportunity;
    if (existingOpportunity) {
      await db.update(opportunities).set({
        score: scoreBreakdown.score,
        website_score: scoreBreakdown.website_score,
        mobile_score: scoreBreakdown.mobile_score,
        conversion_score: scoreBreakdown.conversion_score,
        business_fit_score: scoreBreakdown.business_fit_score,
        reasons: JSON.stringify(scoreBreakdown.reasons),
      }).where(eq(opportunities.id, existingOpportunity.id));

      oppResult = {
        id: existingOpportunity.id,
        business_id: businessId,
        score: scoreBreakdown.score,
        website_score: scoreBreakdown.website_score,
        mobile_score: scoreBreakdown.mobile_score,
        conversion_score: scoreBreakdown.conversion_score,
        business_fit_score: scoreBreakdown.business_fit_score,
        reasons: scoreBreakdown.reasons,
        created_at: existingOpportunity.created_at,
      };
    } else {
      const oppId = crypto.randomUUID();
      await db.insert(opportunities).values({
        id: oppId,
        business_id: businessId,
        score: scoreBreakdown.score,
        website_score: scoreBreakdown.website_score,
        mobile_score: scoreBreakdown.mobile_score,
        conversion_score: scoreBreakdown.conversion_score,
        business_fit_score: scoreBreakdown.business_fit_score,
        reasons: JSON.stringify(scoreBreakdown.reasons),
        created_at: now,
      });

      oppResult = {
        id: oppId,
        business_id: businessId,
        score: scoreBreakdown.score,
        website_score: scoreBreakdown.website_score,
        mobile_score: scoreBreakdown.mobile_score,
        conversion_score: scoreBreakdown.conversion_score,
        business_fit_score: scoreBreakdown.business_fit_score,
        reasons: scoreBreakdown.reasons,
        created_at: now,
      };
    }

    // Auto-update status to QUALIFIED if score is high and lead is still NEW
    const appSettings = await this.getSettings();
    if (business.status === 'NEW' && scoreBreakdown.score >= (appSettings.min_opportunity_score || 50)) {
      await db.update(businesses).set({
        status: 'QUALIFIED',
        updated_at: now,
      }).where(eq(businesses.id, businessId));
    }

    await this.logActivity(businessId, 'WEBSITE_AUDITED', {
      website_status: auditData.website_status,
      score: scoreBreakdown.score,
      reasons: scoreBreakdown.reasons,
    });

    return {
      audit: auditData,
      opportunity: oppResult,
    };
  }

  /**
   * Updates lead fields or status
   */
  async updateLead(id: string, updates: Partial<Business>): Promise<Business> {
    const existingRows = await db.select().from(businesses).where(eq(businesses.id, id));
    const existing = existingRows[0];
    if (!existing) {
      throw new Error(`Business not found: ${id}`);
    }

    const now = new Date().toISOString();
    const updatedFields: any = {
      ...updates,
      updated_at: now,
    };

    const effectiveDnc = updates.do_not_contact !== undefined ? updates.do_not_contact : existing.do_not_contact;
    if (effectiveDnc && updates.status && (updates.status === 'APPROVED' || updates.status === 'CONTACT_OPENED')) {
      throw new Error('Cannot advance status toward contact for a lead marked Do Not Contact.');
    }

    if (updates.do_not_contact !== undefined && updates.do_not_contact !== existing.do_not_contact) {
      await this.logActivity(id, updates.do_not_contact ? 'MARKED_DO_NOT_CONTACT' : 'UNMARKED_DO_NOT_CONTACT', {
        previous: existing.do_not_contact,
        current: updates.do_not_contact,
      });
    }

    if (updates.status && updates.status !== existing.status) {
      await this.logActivity(id, 'STATUS_CHANGED', {
        previous: existing.status,
        current: updates.status,
      });
    }

    await db.update(businesses).set(updatedFields).where(eq(businesses.id, id));

    const updatedRows = await db.select().from(businesses).where(eq(businesses.id, id));
    return updatedRows[0]!;
  }

  /**
   * Deletes a lead and cascading records
   */
  async deleteLead(id: string): Promise<boolean> {
    const existingRows = await db.select().from(businesses).where(eq(businesses.id, id));
    if (existingRows.length === 0) return false;

    await db.delete(businesses).where(eq(businesses.id, id));
    return true;
  }

  /**
   * Clears all business records from the database
   */
  async clearAllData(): Promise<void> {
    await sqliteClient.execute('DELETE FROM activity_log;');
    await sqliteClient.execute('DELETE FROM outreach;');
    await sqliteClient.execute('DELETE FROM messages;');
    await sqliteClient.execute('DELETE FROM opportunities;');
    await sqliteClient.execute('DELETE FROM website_audits;');
    await sqliteClient.execute('DELETE FROM businesses;');
  }

  /**
   * Fetches real counts and funnel metrics from SQLite
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const totalRes = await sqliteClient.execute('SELECT COUNT(*) as count FROM businesses');
    const noWebsiteRes = await sqliteClient.execute(`
      SELECT COUNT(DISTINCT b.id) as count 
      FROM businesses b 
      LEFT JOIN website_audits w ON b.id = w.business_id 
      WHERE b.website IS NULL OR b.website = '' OR w.website_status = 'NO_WEBSITE'
    `);

    const qualifiedRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'QUALIFIED'");
    const reviewRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'REVIEW'");
    const messagesApprovedRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM messages WHERE status = 'APPROVED'");
    const contactOpenedRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'CONTACT_OPENED'");
    const repliesRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'REPLIED'");
    const interestedRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'INTERESTED'");
    const convertedRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM businesses WHERE status = 'CONVERTED'");

    const totalLeads = Number(totalRes.rows[0]?.count || 0);
    const leadsWithoutWebsites = Number(noWebsiteRes.rows[0]?.count || 0);
    const qualifiedLeads = Number(qualifiedRes.rows[0]?.count || 0);
    const awaitingReview = Number(reviewRes.rows[0]?.count || 0);
    const messagesApproved = Number(messagesApprovedRes.rows[0]?.count || 0);
    const contactOpened = Number(contactOpenedRes.rows[0]?.count || 0);
    const replies = Number(repliesRes.rows[0]?.count || 0);
    const interested = Number(interestedRes.rows[0]?.count || 0);
    const converted = Number(convertedRes.rows[0]?.count || 0);

    return {
      totalLeads,
      leadsWithoutWebsites,
      qualifiedLeads,
      awaitingReview,
      messagesApproved,
      contactOpened,
      replies,
      interested,
      converted,
      funnel: {
        total: totalLeads,
        qualified: qualifiedLeads,
        approved: messagesApproved,
        contactOpened: contactOpened,
        replied: replies,
        interested: interested,
        converted: converted,
      },
    };
  }

  /**
   * Log action in activity_log
   */
  async logActivity(businessId: string, action: string, metadata?: Record<string, any>) {
    await db.insert(activity_log).values({
      id: crypto.randomUUID(),
      business_id: businessId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Settings management
   */
  async getSettings(): Promise<AppSettings> {
    const rows = await db.select().from(settings).where(eq(settings.id, 'default'));
    const row = rows[0];
    if (!row) {
      return {
        id: 'default',
        user_name: 'Hemu',
        business_name: 'Hemu Web Studio',
        service_description: 'modern, fast websites for local businesses',
        default_city: 'Chennai',
        default_categories: ['Cricket Academy', 'Fitness Studio', 'Restaurant'],
        default_message_tone: 'friendly',
        min_opportunity_score: 50,
        updated_at: new Date().toISOString(),
      };
    }
    return {
      ...row,
      default_categories: JSON.parse(row.default_categories || '[]'),
      default_message_tone: (row.default_message_tone as any) || 'friendly',
    };
  }

  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = {
      user_name: newSettings.user_name ?? current.user_name,
      business_name: newSettings.business_name ?? current.business_name,
      service_description: newSettings.service_description ?? current.service_description,
      default_city: newSettings.default_city ?? current.default_city,
      default_categories: JSON.stringify(newSettings.default_categories ?? current.default_categories),
      default_message_tone: newSettings.default_message_tone ?? current.default_message_tone,
      min_opportunity_score: newSettings.min_opportunity_score ?? current.min_opportunity_score,
      updated_at: new Date().toISOString(),
    };

    await db.update(settings).set(updated).where(eq(settings.id, 'default'));
    return this.getSettings();
  }
}

export const leadService = new LeadService();
