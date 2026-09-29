import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { LeadStatus, WebsiteStatus, MessageChannel, MessageStatus, LeadSourceType } from '@client-finder/shared';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  normalized_name: text('normalized_name').notNull(),
  category: text('category').notNull(),
  city: text('city').notNull(),
  address: text('address'),
  public_phone: text('public_phone'),
  public_email: text('public_email'),
  website: text('website'),
  normalized_domain: text('normalized_domain'),
  social_url: text('social_url'),
  source_url: text('source_url'),
  source_type: text('source_type').$type<LeadSourceType>().notNull().default('CSV'),
  status: text('status').$type<LeadStatus>().notNull().default('NEW'),
  do_not_contact: integer('do_not_contact', { mode: 'boolean' }).notNull().default(false),
  is_demo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const website_audits = sqliteTable('website_audits', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  website_status: text('website_status').$type<WebsiteStatus>().notNull(),
  https_enabled: integer('https_enabled', { mode: 'boolean' }),
  mobile_ready: integer('mobile_ready', { mode: 'boolean' }),
  title: text('title'),
  description: text('description'),
  contact_path: integer('contact_path', { mode: 'boolean' }),
  observations: text('observations'),
  audited_at: text('audited_at').notNull(),
});

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  website_score: integer('website_score').notNull().default(0),
  mobile_score: integer('mobile_score').notNull().default(0),
  conversion_score: integer('conversion_score').notNull().default(0),
  business_fit_score: integer('business_fit_score').notNull().default(0),
  reasons: text('reasons').notNull(),
  created_at: text('created_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  channel: text('channel').$type<MessageChannel>().notNull(),
  subject: text('subject'),
  content: text('content').notNull(),
  status: text('status').$type<MessageStatus>().notNull().default('DRAFT'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const outreach = sqliteTable('outreach', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  message_id: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  channel: text('channel').$type<MessageChannel>().notNull(),
  status: text('status').notNull().default('CONTACT_OPENED'),
  created_at: text('created_at').notNull(),
});

export const activity_log = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  metadata: text('metadata'),
  created_at: text('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  user_name: text('user_name').notNull().default('Hemu'),
  business_name: text('business_name').notNull().default('Hemu Web Studio'),
  service_description: text('service_description').notNull().default('modern, fast websites for local businesses'),
  default_city: text('default_city').notNull().default('Chennai'),
  default_categories: text('default_categories').notNull().default('["Cricket Academy","Fitness Studio","Restaurant"]'),
  default_message_tone: text('default_message_tone').notNull().default('friendly'),
  min_opportunity_score: integer('min_opportunity_score').notNull().default(50),
  updated_at: text('updated_at').notNull(),
});
