import { db } from '../db';
import { messages, outreach, businesses, website_audits, opportunities } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import {
  Message,
  MessageChannel,
  MessageStatus,
  generatePersonalizedMessages,
  buildWhatsAppUrl,
  buildMailtoUrl,
  buildSocialContactUrl,
} from '@client-finder/shared';
import crypto from 'crypto';
import { leadService } from './leadService';

export class MessageService {
  /**
   * Generates or regenerates messages for a business across all channels
   */
  async generateMessagesForBusiness(businessId: string): Promise<Message[]> {
    const businessRows = await db.select().from(businesses).where(eq(businesses.id, businessId));
    const business = businessRows[0];
    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    if (business.do_not_contact) {
      throw new Error('Cannot generate outreach messages for a lead marked Do Not Contact.');
    }

    const auditRows = await db.select().from(website_audits).where(eq(website_audits.business_id, businessId));
    const audit = auditRows[0] || null;

    const oppRows = await db.select().from(opportunities).where(eq(opportunities.business_id, businessId));
    const opportunity = oppRows[0] || null;

    const settings = await leadService.getSettings();

    const drafts = generatePersonalizedMessages(
      business,
      audit,
      opportunity ? { ...opportunity, reasons: JSON.parse(opportunity.reasons || '[]') } : null,
      settings
    );

    const now = new Date().toISOString();
    const resultMessages: Message[] = [];

    for (const [ch, draft] of Object.entries(drafts)) {
      const channel = ch as MessageChannel;
      const existingRows = await db
        .select()
        .from(messages)
        .where(and(eq(messages.business_id, businessId), eq(messages.channel, channel)));
      const existing = existingRows[0];

      if (existing) {
        await db
          .update(messages)
          .set({
            content: draft.content,
            subject: draft.subject || null,
            status: 'DRAFT',
            updated_at: now,
          })
          .where(eq(messages.id, existing.id));

        resultMessages.push({
          id: existing.id,
          business_id: businessId,
          channel,
          subject: draft.subject || null,
          content: draft.content,
          status: 'DRAFT',
          created_at: existing.created_at,
          updated_at: now,
        });
      } else {
        const id = crypto.randomUUID();
        const newMsg: Message = {
          id,
          business_id: businessId,
          channel,
          subject: draft.subject || null,
          content: draft.content,
          status: 'DRAFT',
          created_at: now,
          updated_at: now,
        };
        await db.insert(messages).values(newMsg);
        resultMessages.push(newMsg);
      }
    }

    await leadService.logActivity(businessId, 'MESSAGES_GENERATED', {
      channels: Object.keys(drafts),
    });

    return resultMessages;
  }

  /**
   * Fetches all messages with business details for the messages management page
   */
  async getAllMessages(statusFilter?: MessageStatus, channelFilter?: MessageChannel) {
    let query = db
      .select({
        message: messages,
        business: businesses,
      })
      .from(messages)
      .innerJoin(businesses, eq(messages.business_id, businesses.id))
      .orderBy(desc(messages.updated_at));

    const rows = await query;

    let filtered = rows;
    if (statusFilter) {
      filtered = filtered.filter(r => r.message.status === statusFilter);
    }
    if (channelFilter) {
      filtered = filtered.filter(r => r.message.channel === channelFilter);
    }

    return filtered.map(r => ({
      ...r.message,
      business: r.business,
    }));
  }

  /**
   * Update message content or approval status
   */
  async updateMessage(
    id: string,
    updates: { content?: string; subject?: string; status?: MessageStatus }
  ): Promise<Message> {
    const existingRows = await db.select().from(messages).where(eq(messages.id, id));
    const existing = existingRows[0];
    if (!existing) {
      throw new Error(`Message not found: ${id}`);
    }

    const now = new Date().toISOString();
    await db
      .update(messages)
      .set({
        ...updates,
        updated_at: now,
      })
      .where(eq(messages.id, id));

    const updatedRows = await db.select().from(messages).where(eq(messages.id, id));
    const updated = updatedRows[0];

    if (updates.status === 'APPROVED') {
      const bizRows = await db.select().from(businesses).where(eq(businesses.id, existing.business_id));
      const business = bizRows[0];
      if (business?.do_not_contact) {
        throw new Error('Cannot approve message for a lead marked Do Not Contact.');
      }

      await leadService.logActivity(existing.business_id, 'MESSAGE_APPROVED', {
        messageId: id,
        channel: existing.channel,
      });

      // Update lead status to APPROVED if not already further along
      if (business && (business.status === 'NEW' || business.status === 'REVIEW' || business.status === 'QUALIFIED')) {
        await db.update(businesses).set({ status: 'APPROVED', updated_at: now }).where(eq(businesses.id, business.id));
      }
    }

    return updated as Message;
  }

  /**
   * Prepare contact action:
   * Validates DNC flag, calculates target link, logs outreach attempt, and marks status CONTACT_OPENED.
   * Does NOT auto-send messages.
   */
  async prepareContactAction(
    businessId: string,
    messageId: string,
    channel: MessageChannel
  ) {
    const bizRows = await db.select().from(businesses).where(eq(businesses.id, businessId));
    const business = bizRows[0];
    if (!business) {
      throw new Error('Business not found.');
    }

    if (business.do_not_contact) {
      throw new Error('Action blocked: Lead is marked Do Not Contact.');
    }

    const msgRows = await db.select().from(messages).where(eq(messages.id, messageId));
    const message = msgRows[0];
    if (!message) {
      throw new Error('Message not found.');
    }

    let actionResult;
    const isDemo = Boolean(business.is_demo);

    switch (channel) {
      case 'WHATSAPP':
        actionResult = buildWhatsAppUrl(business.public_phone, message.content, isDemo);
        break;
      case 'EMAIL':
        actionResult = buildMailtoUrl(business.public_email, message.subject || 'Web Consultation', message.content, isDemo);
        break;
      case 'GENERIC_DM':
        actionResult = buildSocialContactUrl(business.social_url || business.source_url, isDemo);
        break;
    }

    if (!actionResult.isValid) {
      throw new Error(actionResult.error || 'Unable to generate contact action URL.');
    }

    const now = new Date().toISOString();
    const outreachId = crypto.randomUUID();

    // Record outreach log
    await db.insert(outreach).values({
      id: outreachId,
      business_id: businessId,
      message_id: messageId,
      channel,
      status: 'CONTACT_OPENED',
      created_at: now,
    });

    // Update lead status to CONTACT_OPENED
    if (business.status !== 'REPLIED' && business.status !== 'INTERESTED' && business.status !== 'CONVERTED') {
      await db.update(businesses).set({
        status: 'CONTACT_OPENED',
        updated_at: now,
      }).where(eq(businesses.id, businessId));
    }

    await leadService.logActivity(businessId, 'CONTACT_ACTION_OPENED', {
      channel,
      messageId,
      url: isDemo ? 'DEMO_ACTION' : actionResult.url,
      timestamp: now,
    });

    return {
      actionResult,
      business,
      message,
    };
  }
}

export const messageService = new MessageService();
