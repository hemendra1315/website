import { Business, WebsiteAudit, Opportunity, MessageChannel, AppSettings } from './types';

export interface GeneratedMessageDraft {
  channel: MessageChannel;
  content: string;
  subject?: string;
}

export function generatePersonalizedMessages(
  business: Business,
  audit?: WebsiteAudit | null,
  opportunity?: Opportunity | null,
  settings?: Partial<AppSettings>
): Record<MessageChannel, GeneratedMessageDraft> {
  const businessName = business.name;
  const category = business.category || 'business';
  const city = business.city && business.city !== 'Unknown' ? business.city : '';
  const senderName = settings?.user_name || 'Hemu';
  const agencyName = settings?.business_name || 'Hemu Web Studio';
  const serviceDesc = settings?.service_description || 'modern, fast websites for local businesses';

  // Determine the primary observable opportunity gap based ONLY on verified data
  let opportunityInsight = '';
  let opportunityInsightShort = '';

  if (!business.website || audit?.website_status === 'NO_WEBSITE') {
    opportunityInsight = `I noticed that ${businessName} does not currently have a dedicated website`;
    opportunityInsightShort = `I couldn't find an active website for ${businessName}`;
  } else if (audit?.website_status === 'UNREACHABLE' || audit?.website_status === 'ERROR') {
    opportunityInsight = `I noticed that your current web address appears to be offline or inaccessible`;
    opportunityInsightShort = `your current website appears to be unreachable`;
  } else if (audit?.mobile_ready === false) {
    opportunityInsight = `I was looking at your website and noticed it isn't fully optimized for mobile screens`;
    opportunityInsightShort = `your website lacks mobile responsive layout`;
  } else if (audit?.https_enabled === false) {
    opportunityInsight = `I noticed that your website is missing secure HTTPS encryption, which browsers mark as not secure`;
    opportunityInsightShort = `your website lacks HTTPS security`;
  } else if (audit?.contact_path === false) {
    opportunityInsight = `I checked your website and noticed there isn't a direct online booking or inquiry option for visitors`;
    opportunityInsightShort = `there is no direct online booking or enquiry option on your website`;
  } else {
    opportunityInsight = `I came across your profile and noticed opportunities to refresh your online presentation and student/customer conversion`;
    opportunityInsightShort = `an opportunity to upgrade your digital customer funnel`;
  }

  const locationContext = city ? ` in ${city}` : '';

  // 1. WhatsApp Message
  const whatsappContent =
    `Hi ${businessName},\n\n` +
    `I came across ${businessName} while looking into ${category}${locationContext}. ` +
    `${opportunityInsight}.\n\n` +
    `At ${agencyName}, I build ${serviceDesc}. I would love to put together a quick, no-obligation preview of what a modern website could look like for you.\n\n` +
    `Would you be open to taking a quick look?`;

  // 2. Email Message
  const emailSubject = `Website & digital inquiry demo for ${businessName}`;
  const emailContent =
    `Hello ${businessName} Team,\n\n` +
    `I hope you're having a productive week.\n\n` +
    `While reviewing ${category}${locationContext}, I came across your business. ${opportunityInsight}.\n\n` +
    `I run ${agencyName}, where we build ${serviceDesc} that make it easy for local customers to discover services, view details, and get in touch directly.\n\n` +
    `I would be glad to create a tailored mockup for ${businessName} to show how an updated web presence could help capture more inquiries.\n\n` +
    `Would you be open to a 5-minute preview this week?\n\n` +
    `Best regards,\n` +
    `${senderName}\n` +
    `${agencyName}`;

  // 3. Generic DM
  const genericDmContent =
    `Hi ${businessName} team! I noticed ${opportunityInsightShort}. ` +
    `I help ${category} businesses build modern, mobile-ready websites to bring in more direct clients. ` +
    `Would you be open to seeing a free quick demo mockup designed for ${businessName}?`;

  return {
    WHATSAPP: {
      channel: 'WHATSAPP',
      content: whatsappContent
    },
    EMAIL: {
      channel: 'EMAIL',
      subject: emailSubject,
      content: emailContent
    },
    GENERIC_DM: {
      channel: 'GENERIC_DM',
      content: genericDmContent
    }
  };
}
