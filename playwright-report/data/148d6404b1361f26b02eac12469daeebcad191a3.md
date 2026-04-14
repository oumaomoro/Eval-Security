# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contract-workflow.spec.ts >> Contract Lifecycle Management >> should navigate through the contract analysis and redlining flow
- Location: tests\e2e\contract-workflow.spec.ts:17:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[role="tab"]:has-text("Initialize Agent")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e12]: Costloci
        - generic [ref=e13]:
          - link "Solutions" [ref=e14] [cursor=pointer]:
            - /url: "#features"
          - link "Trust" [ref=e15] [cursor=pointer]:
            - /url: "#trust"
          - link "Pricing" [ref=e16] [cursor=pointer]:
            - /url: "#pricing"
          - link "Access Portal" [ref=e17] [cursor=pointer]:
            - /url: /auth
            - button "Access Portal" [ref=e18]
    - generic [ref=e21]:
      - generic [ref=e22]:
        - img [ref=e23]
        - text: Now with Autonomic Compliance Engines
      - heading "AI Contract Governance & Regional Compliance" [level=1] [ref=e25]:
        - text: AI Contract Governance &
        - text: Regional Compliance
      - paragraph [ref=e26]: The Sovereign Intelligence Standard for identifying forensic contract risks, streamlining KDPA & POPIA compliance, and maximizing enterprise vendor ROI. Built for MSPs and Global 2000 DPOs.
      - generic [ref=e27]:
        - link "Start Free Audit" [ref=e28] [cursor=pointer]:
          - /url: /auth
          - button "Start Free Audit" [ref=e29]:
            - text: Start Free Audit
            - img
        - button "Schedule Demo" [ref=e30] [cursor=pointer]
    - generic [ref=e32]:
      - paragraph [ref=e33]: Certified Across Global Jurisdictions
      - generic [ref=e34]:
        - generic [ref=e35] [cursor=pointer]:
          - img [ref=e36]
          - generic [ref=e39]: KDPA
          - generic [ref=e40]: Kenya
        - generic [ref=e41] [cursor=pointer]:
          - img [ref=e42]
          - generic [ref=e45]: POPIA
          - generic [ref=e46]: So. Africa
        - generic [ref=e47] [cursor=pointer]:
          - img [ref=e48]
          - generic [ref=e51]: GDPR
          - generic [ref=e52]: EU Standard
        - generic [ref=e53] [cursor=pointer]:
          - img [ref=e54]
          - generic [ref=e57]: CBK
          - generic [ref=e58]: Central Bank
        - generic [ref=e59] [cursor=pointer]:
          - img [ref=e60]
          - generic [ref=e63]: SOC 2 TYPE II
          - generic [ref=e64]: Global Trust
        - generic [ref=e65] [cursor=pointer]:
          - img [ref=e66]
          - generic [ref=e69]: HIPAA
          - generic [ref=e70]: Healthcare
        - generic [ref=e71] [cursor=pointer]:
          - img [ref=e72]
          - generic [ref=e75]: ISO 27001
          - generic [ref=e76]: Security
        - generic [ref=e77] [cursor=pointer]:
          - img [ref=e78]
          - generic [ref=e81]: PCI DSS
          - generic [ref=e82]: Payments
    - generic [ref=e85]:
      - generic [ref=e88]:
        - img [ref=e90]
        - heading "For MSPs & SecOps" [level=3] [ref=e92]
        - paragraph [ref=e93]: Deep-tensor forensic analysis of vendor contracts. Correlate insurance limits with cybersecurity risk posture automatically.
        - list [ref=e94]:
          - listitem [ref=e95]:
            - img [ref=e96]
            - text: Billing Telemetry
          - listitem [ref=e99]:
            - img [ref=e100]
            - text: Multi-tenant Dashboard
          - listitem [ref=e103]:
            - img [ref=e104]
            - text: ROI Automated Benchmarking
      - generic [ref=e109]:
        - img [ref=e111]
        - heading "For DPOs & Legal" [level=3] [ref=e114]
        - paragraph [ref=e115]: Autonomic regional compliance engine. Generate local jurisdictional evidence packs for KDPA, POPIA, and GDPR in seconds.
        - list [ref=e116]:
          - listitem [ref=e117]:
            - img [ref=e118]
            - text: Regional Policy Mapping
          - listitem [ref=e121]:
            - img [ref=e122]
            - text: Self-Healing Compliance
          - listitem [ref=e125]:
            - img [ref=e126]
            - text: Evidence Repository
      - generic [ref=e131]:
        - img [ref=e133]
        - heading "Enterprise ROI Engine" [level=3] [ref=e135]
        - paragraph [ref=e136]: Uncover hidden savings in SaaS and vendor portfolios. Autonomic negotiation intelligence with real-time market data.
        - list [ref=e137]:
          - listitem [ref=e138]:
            - img [ref=e139]
            - text: Savings Identification
          - listitem [ref=e142]:
            - img [ref=e143]
            - text: Autonomic Remediation
          - listitem [ref=e146]:
            - img [ref=e147]
            - text: Executive ROI Reporting
    - generic [ref=e151]:
      - generic [ref=e152]:
        - heading "Transparent Enterprise Value" [level=2] [ref=e153]
        - paragraph [ref=e154]: Simple tiers for the modern sovereign enterprise.
      - generic [ref=e155]:
        - generic [ref=e156]:
          - generic [ref=e157]:
            - text: Starter
            - generic [ref=e158]:
              - generic [ref=e159]: $
              - generic [ref=e160]: 2,500
              - generic [ref=e161]: /mo
            - paragraph [ref=e162]: For boutique MSPs and small DPO teams.
          - generic [ref=e163]:
            - generic [ref=e164]:
              - img [ref=e166]
              - generic [ref=e169]: Single Tenant
            - generic [ref=e170]:
              - img [ref=e172]
              - generic [ref=e175]: AI Clause Audit
            - generic [ref=e176]:
              - img [ref=e178]
              - generic [ref=e181]: KDPA/POPIA Sync
          - button "Deploy Instance" [ref=e182] [cursor=pointer]
        - generic [ref=e183]:
          - generic [ref=e184]:
            - text: Professional
            - generic [ref=e185]:
              - generic [ref=e186]: $
              - generic [ref=e187]: 10,000
              - generic [ref=e188]: /mo
            - paragraph [ref=e189]: Our most popular tier for active SecOps.
          - generic [ref=e190]:
            - generic [ref=e191]:
              - img [ref=e193]
              - generic [ref=e196]: Forensic Risk Mapping
            - generic [ref=e197]:
              - img [ref=e199]
              - generic [ref=e202]: Multi-tenant Support
            - generic [ref=e203]:
              - img [ref=e205]
              - generic [ref=e208]: Full ROI Benchmarking
            - generic [ref=e209]:
              - img [ref=e211]
              - generic [ref=e214]: Self-Healing Infra
          - button "Deploy Instance" [ref=e215] [cursor=pointer]
        - generic [ref=e216]:
          - generic [ref=e217]:
            - text: Enterprise
            - generic [ref=e219]: Custom
            - paragraph [ref=e220]: Global sovereign intelligence for the elite.
          - generic [ref=e221]:
            - generic [ref=e222]:
              - img [ref=e224]
              - generic [ref=e227]: Autonomic Governance
            - generic [ref=e228]:
              - img [ref=e230]
              - generic [ref=e233]: White-label Portal
            - generic [ref=e234]:
              - img [ref=e236]
              - generic [ref=e239]: Direct API Synergies
            - generic [ref=e240]:
              - img [ref=e242]
              - generic [ref=e245]: 24/7 Sovereign Support
          - button "Let's Talk" [ref=e246] [cursor=pointer]
    - contentinfo [ref=e247]:
      - generic [ref=e248]:
        - generic [ref=e249]:
          - generic [ref=e256]: Costloci
          - paragraph [ref=e257]: The Sovereign Intelligence Standard for the modern regulated enterprise. Engineered for DPOs, MSPs, and Cybersecurity Professionals.
        - generic [ref=e258]:
          - heading "Company" [level=4] [ref=e259]
          - list [ref=e260]:
            - listitem [ref=e261]:
              - link "Privacy" [ref=e262] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e263]:
              - link "Compliance" [ref=e264] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e265]:
              - link "ROI Model" [ref=e266] [cursor=pointer]:
                - /url: "#"
        - generic [ref=e267]:
          - heading "Portal" [level=4] [ref=e268]
          - list [ref=e269]:
            - listitem [ref=e270]:
              - link "Sign In" [ref=e271] [cursor=pointer]:
                - /url: /auth
            - listitem [ref=e272]:
              - link "Secure Register" [ref=e273] [cursor=pointer]:
                - /url: /auth
      - generic [ref=e274]:
        - paragraph [ref=e275]: © 2026 Costloci Intelligence Inc. Autonomic Remediation Engaged.
        - generic [ref=e276]:
          - img [ref=e277]
          - img [ref=e279]
          - img [ref=e281]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Contract Lifecycle Management', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // 1. Bypass auth by registering a unique test user
  6  |     await page.goto('/');
> 7  |     await page.locator('button[role="tab"]:has-text("Initialize Agent")').click();
     |                                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  8  |     const testEmail = `playwright-${Math.floor(Math.random() * 1000000)}@enterprise-test.com`;
  9  |     await page.fill('input[placeholder="John"]', 'Playwright');
  10 |     await page.fill('input[placeholder="Doe"]', 'Tester');
  11 |     await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
  12 |     await page.fill('input[type="password"]', 'SecurePass123!');
  13 |     await page.locator('button:has-text("Deploy Enterprise Identity")').click();
  14 |     await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => null); 
  15 |   });
  16 | 
  17 |   test('should navigate through the contract analysis and redlining flow', async ({ page }) => {
  18 |     // Mock the backend API to securely test the UI without requiring an uploaded PDF
  19 |     await page.route('**/api/contracts', async route => {
  20 |       if (route.request().method() === 'GET') {
  21 |         const mockContracts = [{
  22 |           id: 9999,
  23 |           clientId: 1,
  24 |           vendorName: "Playwright Mock Vendor",
  25 |           productService: "Test Suite Service",
  26 |           category: "Testing",
  27 |           annualCost: 50000,
  28 |           status: "active",
  29 |           createdAt: new Date().toISOString()
  30 |         }];
  31 |         await route.fulfill({ json: mockContracts });
  32 |       } else {
  33 |         await route.continue();
  34 |       }
  35 |     });
  36 | 
  37 |     // 1. Visit Contracts Page
  38 |     await page.goto('/contracts');
  39 |     await expect(page.locator('h1')).toContainText(/Contract/i, { timeout: 15000 });
  40 | 
  41 |     // 2. Select the mocked contract
  42 |     const contractRow = page.locator('table tr').filter({ hasText: 'Playwright Mock Vendor' }).first();
  43 |     if (await contractRow.isVisible()) {
  44 |       // Click the exact link inside the row
  45 |       await contractRow.getByRole('link', { name: /view details/i }).click();
  46 |       
  47 |       // 3. Verify Detail Navigation
  48 |       await expect(page).toHaveURL(/.*contract\/\d+/);
  49 |       await expect(page.locator('text=Executive Summary')).toBeVisible({ timeout: 10000 });
  50 | 
  51 |       // 4. Open AI Analysis Tab
  52 |       await page.click('button:has-text("AI Analysis")');
  53 |       await expect(page.locator('text=Contract Intelligence')).toBeVisible({ timeout: 10000 });
  54 | 
  55 |       // 5. Check SignNow Gateway
  56 |       const signBtn = page.getByRole('button', { name: /request signature/i });
  57 |       await expect(signBtn).toBeVisible({ timeout: 10000 });
  58 |     }
  59 |   });
  60 | 
  61 |   test('should allow marketplace playbook activation', async ({ page }) => {
  62 |     await page.goto('/marketplace');
  63 |     
  64 |     // UI might say "Activate" or "Deactivate" depending on current DB state.
  65 |     const actionBtn = page.getByRole('button', { name: /activate|deactivate/i }).first();
  66 |     await actionBtn.click();
  67 | 
  68 |     // Verify persistence via Toast
  69 |     await expect(page.locator('text=Playbook')).toBeVisible({ timeout: 10000 });
  70 |   });
  71 | });
  72 | 
```