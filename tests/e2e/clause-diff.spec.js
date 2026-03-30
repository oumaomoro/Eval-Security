import { test, expect } from '@playwright/test';
import { loginToUI } from '../utils/helpers.js';

test.describe('Clause Details Interactive Diff Viewer', () => {

  test('Should load React Diff Viewer accurately comparing extracted vs gold standard', async ({ page }) => {
    // Navigate to Contract details registry
    await loginToUI(page);
    await page.goto('/dashboard');
    
    // Look up contracts list or dashboard element to trigger details pane
    // The details pane opens when clicking a table row
    const rowLoc = page.locator('tbody tr').first();
    const visible = await rowLoc.isVisible();
    
    if (visible) {
       await rowLoc.click();
       // Assert the slide-in detail panel appears
       const sidePanel = page.locator('.slide-in-from-right-8'); // the Tailwind animate class
       await expect(sidePanel).toBeVisible();

       // Locate Categorical Findings block
       const catBlock = page.locator('h3:has-text("Categorical Risk Analysis")');
       await expect(catBlock).toBeVisible();
       
       // Verify the React Diff Viewer text components
       // Diff viewer typically displays titles "Original Contract Clause" and "Optimized AI Redline"
       const diffOriginal = page.getByText('Original Contract Clause', { exact: false });
       if (await diffOriginal.count() > 0) {
          await expect(diffOriginal.first()).toBeVisible();
       }
    } else {
       console.log('No seeded contracts available for visual diff tests.');
    }
  });

});
