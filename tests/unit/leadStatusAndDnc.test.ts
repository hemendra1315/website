import { describe, it, expect, beforeEach } from 'vitest';
import { leadService } from '../../apps/api/src/services/leadService';
import { messageService } from '../../apps/api/src/services/messageService';
import { initDatabase, db, sqlite } from '../../apps/api/src/db';
import { businesses } from '../../apps/api/src/db/schema';
import { eq } from 'drizzle-orm';

describe('Lead Status Transitions & Do Not Contact Behavior', () => {
  beforeEach(async () => {
    initDatabase();
    await leadService.clearAllData();
  });

  it('preserves do_not_contact flag and blocks message generation / contact actions', async () => {
    // 1. Create lead
    const lead = await leadService.createLead({
      name: 'Restricted Academy',
      normalized_name: 'restricted academy',
      category: 'Cricket',
      city: 'Chennai',
      address: null,
      public_phone: '+919840123456',
      public_email: 'restricted@academy.in',
      website: null,
      normalized_domain: null,
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      is_demo: false,
    }, false);

    // 2. Mark lead Do Not Contact
    await leadService.updateLead(lead.id, { do_not_contact: true });

    const updatedLead = await leadService.getLeadById(lead.id);
    expect(updatedLead?.do_not_contact).toBe(true);

    // 3. Attempt to generate messages -> must fail
    await expect(messageService.generateMessagesForBusiness(lead.id)).rejects.toThrow(
      'Cannot generate outreach messages for a lead marked Do Not Contact.'
    );

    // 4. Attempt to prepare contact action -> must fail
    await expect(messageService.prepareContactAction(lead.id, 'dummy-msg', 'WHATSAPP')).rejects.toThrow(
      'Action blocked: Lead is marked Do Not Contact.'
    );

    // 5. Attempt to approve message for DNC lead -> must fail
    // Temporarily unmark DNC to generate a draft message, then mark DNC again
    await leadService.updateLead(lead.id, { do_not_contact: false });
    const msgs = await messageService.generateMessagesForBusiness(lead.id);
    const draftMsg = msgs[0];
    await leadService.updateLead(lead.id, { do_not_contact: true });

    await expect(messageService.updateMessage(draftMsg.id, { status: 'APPROVED' })).rejects.toThrow(
      'Cannot approve message for a lead marked Do Not Contact.'
    );

    // 6. Attempt to change status to CONTACT_OPENED or APPROVED for DNC lead -> must fail
    await expect(leadService.updateLead(lead.id, { status: 'CONTACT_OPENED' })).rejects.toThrow(
      'Cannot advance status toward contact for a lead marked Do Not Contact.'
    );
    await expect(leadService.updateLead(lead.id, { status: 'APPROVED' })).rejects.toThrow(
      'Cannot advance status toward contact for a lead marked Do Not Contact.'
    );
  });

  it('transitions statuses explicitly and does not auto-advance to REPLIED or CONVERTED', async () => {
    const lead = await leadService.createLead({
      name: 'Status Test Gym',
      normalized_name: 'status test gym',
      category: 'Gym',
      city: 'Chennai',
      address: null,
      public_phone: '+919840999888',
      public_email: 'gym@test.in',
      website: 'https://gymtest.in',
      normalized_domain: 'gymtest.in',
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      is_demo: false,
    }, false);

    expect(lead.status).toBe('NEW');

    // Generate messages and approve
    const msgs = await messageService.generateMessagesForBusiness(lead.id);
    const whatsappMsg = msgs.find(m => m.channel === 'WHATSAPP')!;

    await messageService.updateMessage(whatsappMsg.id, { status: 'APPROVED' });
    let current = await leadService.getLeadById(lead.id);
    expect(current?.status).toBe('APPROVED');

    // Trigger contact action -> transitions to CONTACT_OPENED (not CONTACTED or REPLIED)
    await messageService.prepareContactAction(lead.id, whatsappMsg.id, 'WHATSAPP');
    current = await leadService.getLeadById(lead.id);
    expect(current?.status).toBe('CONTACT_OPENED');

    // Manual user transitions
    await leadService.updateLead(lead.id, { status: 'INTERESTED' });
    current = await leadService.getLeadById(lead.id);
    expect(current?.status).toBe('INTERESTED');
  });
});
