import { test, expect } from '@playwright/test';

test.describe('Client Finder End-to-End Workflow', () => {
  test.beforeEach(async ({ request }) => {
    // Clear test database before running E2E flow
    await request.post('http://127.0.0.1:3001/api/data/clear', {
      data: { confirmation: 'CLEAR_ALL_DATA' }
    });
  });

  test('Complete Flow: Ingestion -> Audit -> Score -> Messaging -> Approval -> DNC Safety', async ({ page }) => {
    const testId = Date.now();
    const cricketBizName = `DEMO Cricket Academy ${testId}`;
    const fitnessBizName = `DEMO Fitness Center ${testId}`;

    // 1. Open dashboard
    await page.goto('/');
    await expect(page.getByText('Client Finder', { exact: true })).toBeVisible();
    await expect(page.getByText('Live counts from your local database.')).toBeVisible();

    // 2. Import demo CSV
    await page.getByRole('button', { name: 'Import CSV' }).first().click();
    await expect(page.getByText('Import Business Leads CSV')).toBeVisible();

    // Switch to raw text mode and paste synthetic test leads
    await page.getByRole('button', { name: 'Paste Raw CSV' }).click();
    const testCsv = `name,category,city,phone,email,website\n"${cricketBizName}","Cricket Academy","Chennai","+91 98401 99999","test${testId}@democricket.local",""\n"${fitnessBizName}","Fitness Studio","Chennai","+91 98402 88888","fit${testId}@demofit.local","http://insecure-gym.local"`;

    await page.locator('textarea').fill(testCsv);
    await page.getByRole('button', { name: 'Generate Preview' }).click();

    // Verify preview displays valid rows and import
    const importBtn = page.getByRole('button', { name: /IMPORT VALID LEADS \(2\)/i });
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // 3. View leads directory
    await expect(page.getByText('Leads Directory', { exact: true })).toBeVisible();
    await expect(page.getByText(cricketBizName).first()).toBeVisible();

    // 4. Search
    const searchInput = page.getByPlaceholder(/Search business name/i);
    await searchInput.fill(cricketBizName);
    await expect(page.getByText(cricketBizName).first()).toBeVisible();

    // 5. Clear search and test filter toggle
    await searchInput.fill('');
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.getByText('Clear Filters')).toBeVisible();
    await page.getByRole('button', { name: 'Clear Filters' }).click();

    // 6. Open lead details
    await page.getByText(cricketBizName).first().click();
    await expect(page.getByText('Business Information')).toBeVisible();
    await expect(page.getByText('Deterministic Opportunity Breakdown')).toBeVisible();

    // 7. Run audit
    const auditBtn = page.getByRole('button', { name: 'Run Website Audit' });
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();
    await page.waitForTimeout(500);

    // 8. Generate message
    const genMsgBtn = page.getByRole('button', { name: 'Generate Messages' });
    await expect(genMsgBtn).toBeVisible();
    await genMsgBtn.click();
    await page.waitForTimeout(500);

    // Verify generated pitch exists
    await expect(page.getByText('WHATSAPP', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/does not currently have a dedicated website/i).first()).toBeVisible();

    // 9. Edit message
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByText(/Edit WHATSAPP Message/i)).toBeVisible();
    const messageTextarea = page.locator('textarea');
    await messageTextarea.fill(`Hi ${cricketBizName}, customized proposal from Hemu Web Studio.`);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // 10. Approve message
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('button', { name: 'Approve Message' }).click();

    // 11. Mark lead Do Not Contact
    const dncBtn = page.getByRole('button', { name: /Mark Do Not Contact/i });
    await dncBtn.click();
    await expect(page.getByText('DO NOT CONTACT').first()).toBeVisible();

    // 12. Verify contact action is unavailable/disabled when Do Not Contact is active
    const contactBtn = page.getByRole('button', { name: 'Contact', exact: true }).first();
    await expect(contactBtn).toBeDisabled();

    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
  });
});
