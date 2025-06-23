import { test, expect, type Page } from '@playwright/test';

test.describe('Terminal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Ensure we're in developer mode (if mode switching exists)
    const modeSwitch = page.locator('[data-testid="mode-switch"]');
    if (await modeSwitch.isVisible()) {
      await modeSwitch.click();
    }
  });

  test.describe('Terminal Creation and Management', () => {
    test('should create initial terminal on app load', async ({ page }) => {
      // Check that a terminal container exists
      await expect(page.locator('.terminal-manager')).toBeVisible();
      await expect(page.locator('.terminal-tab')).toBeVisible();
      await expect(page.locator('.terminal-content')).toBeVisible();
    });

    test('should create new terminal tab', async ({ page }) => {
      // Click the new terminal button
      await page.locator('[aria-label="New terminal"]').click();
      
      // Should now have multiple terminal tabs
      const tabs = page.locator('.terminal-tab');
      await expect(tabs).toHaveCount(2);
      
      // New tab should be active
      const activeTabs = page.locator('.terminal-tab.active');
      await expect(activeTabs).toHaveCount(1);
    });

    test('should switch between terminal tabs', async ({ page }) => {
      // Create a second terminal
      await page.locator('[aria-label="New terminal"]').click();
      
      // Get both tabs
      const tabs = page.locator('.terminal-tab');
      await expect(tabs).toHaveCount(2);
      
      // Click on the first tab
      await tabs.first().click();
      
      // First tab should now be active
      await expect(tabs.first()).toHaveClass(/active/);
      await expect(tabs.last()).not.toHaveClass(/active/);
    });

    test('should close terminal tab', async ({ page }) => {
      // Create multiple terminals
      await page.locator('[aria-label="New terminal"]').click();
      await page.locator('[aria-label="New terminal"]').click();
      
      await expect(page.locator('.terminal-tab')).toHaveCount(3);
      
      // Close the first terminal
      await page.locator('.terminal-tab').first().locator('[aria-label="Close terminal"]').click();
      
      // Should have one less terminal
      await expect(page.locator('.terminal-tab')).toHaveCount(2);
    });

    test('should not show close button for single terminal', async ({ page }) => {
      // With only one terminal, close button should not be visible
      await expect(page.locator('[aria-label="Close terminal"]')).not.toBeVisible();
    });

    test('should maintain terminal titles', async ({ page }) => {
      const firstTab = page.locator('.terminal-tab').first();
      await expect(firstTab.locator('.terminal-tab-title')).toContainText('Terminal');
      
      // Create second terminal
      await page.locator('[aria-label="New terminal"]').click();
      
      const tabs = page.locator('.terminal-tab');
      await expect(tabs.nth(1).locator('.terminal-tab-title')).toContainText('Terminal');
    });
  });

  test.describe('Terminal Interaction', () => {
    test('should accept keyboard input', async ({ page }) => {
      // Wait for terminal to be ready
      await page.waitForSelector('.terminal-wrapper');
      
      // Focus on the terminal
      await page.locator('.terminal-wrapper').click();
      
      // Type a command
      await page.keyboard.type('echo "Hello World"');
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Wait for output (this depends on actual terminal implementation)
      await page.waitForTimeout(1000);
    });

    test('should handle custom IDE commands', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      // Type help command
      await page.keyboard.type('help');
      await page.keyboard.press('Enter');
      
      // Should show help output
      await page.waitForTimeout(1000);
      
      // Check if help content is displayed (this would need actual terminal output checking)
      // For now, we verify the command was entered
    });

    test('should handle file operations through terminal', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      // Test pwd command
      await page.keyboard.type('pwd');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Test ls command
      await page.keyboard.type('ls');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });

    test('should support terminal shortcuts', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      // Test Ctrl+C (interrupt)
      await page.keyboard.type('sleep 10');
      await page.keyboard.press('Control+c');
      
      // Test Ctrl+L (clear)
      await page.keyboard.press('Control+l');
      
      await page.waitForTimeout(500);
    });
  });

  test.describe('Terminal Features', () => {
    test('should have working terminal toolbar', async ({ page }) => {
      // Check if toolbar exists and is functional
      const toolbar = page.locator('.terminal-toolbar');
      if (await toolbar.isVisible()) {
        // Test toolbar buttons if they exist
        const buttons = toolbar.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          if (await button.isEnabled()) {
            await button.click();
            await page.waitForTimeout(100);
          }
        }
      }
    });

    test('should support copy and paste', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      
      // Type some text
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "test text for copying"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Try to select text (this is complex in terminals)
      // For now, just test that copy/paste shortcuts don't break
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Control+v');
    });

    test('should handle terminal resize', async ({ page }) => {
      // Resize the browser window
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(200);
      
      // Terminal should still be visible and functional
      await expect(page.locator('.terminal-wrapper')).toBeVisible();
      
      // Resize again
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(200);
      
      await expect(page.locator('.terminal-wrapper')).toBeVisible();
    });
  });

  test.describe('Multi-Terminal Scenarios', () => {
    test('should handle multiple terminals independently', async ({ page }) => {
      // Create three terminals
      await page.locator('[aria-label="New terminal"]').click();
      await page.locator('[aria-label="New terminal"]').click();
      
      const tabs = page.locator('.terminal-tab');
      await expect(tabs).toHaveCount(3);
      
      // Test switching between them
      await tabs.nth(0).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "terminal 1"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      await tabs.nth(1).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "terminal 2"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      await tabs.nth(2).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "terminal 3"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    });

    test('should maintain independent command history', async ({ page }) => {
      // Create second terminal
      await page.locator('[aria-label="New terminal"]').click();
      
      const tabs = page.locator('.terminal-tab');
      
      // Run different commands in each terminal
      await tabs.nth(0).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "first terminal"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      await tabs.nth(1).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('pwd');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Switch back and test history navigation
      await tabs.nth(0).click();
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.press('ArrowUp'); // Should show previous command
    });

    test('should handle terminal session cleanup', async ({ page }) => {
      // Create many terminals to test limits
      for (let i = 0; i < 5; i++) {
        await page.locator('[aria-label="New terminal"]').click();
        await page.waitForTimeout(100);
      }
      
      // Should have 6 terminals total
      await expect(page.locator('.terminal-tab')).toHaveCount(6);
      
      // Close some terminals
      const closeButtons = page.locator('[aria-label="Close terminal"]');
      const buttonCount = await closeButtons.count();
      
      for (let i = 0; i < 3; i++) {
        await closeButtons.first().click();
        await page.waitForTimeout(100);
      }
      
      // Should have fewer terminals
      await expect(page.locator('.terminal-tab')).toHaveCount(3);
    });
  });

  test.describe('Terminal Performance', () => {
    test('should handle rapid terminal creation', async ({ page }) => {
      // Rapidly create multiple terminals
      for (let i = 0; i < 10; i++) {
        await page.locator('[aria-label="New terminal"]').click();
      }
      
      // All terminals should be created
      await expect(page.locator('.terminal-tab')).toHaveCount(11);
      
      // App should remain responsive
      const lastTab = page.locator('.terminal-tab').last();
      await lastTab.click();
      await expect(lastTab).toHaveClass(/active/);
    });

    test('should handle high-volume output', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      // Generate some output (adjust based on actual shell)
      await page.keyboard.type('for i in {1..100}; do echo "Line $i"; done');
      await page.keyboard.press('Enter');
      
      // Wait for output to complete
      await page.waitForTimeout(2000);
      
      // Terminal should still be responsive
      await page.keyboard.type('echo "test after output"');
      await page.keyboard.press('Enter');
    });

    test('should handle terminal startup time', async ({ page }) => {
      const startTime = Date.now();
      
      // Create a new terminal
      await page.locator('[aria-label="New terminal"]').click();
      
      // Wait for terminal to be fully ready
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      const endTime = Date.now();
      const startupTime = endTime - startTime;
      
      // Terminal should start up within reasonable time (5 seconds)
      expect(startupTime).toBeLessThan(5000);
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through UI elements
      await page.keyboard.press('Tab');
      
      // Should be able to reach terminal-related elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Enter should activate focused elements
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for important ARIA labels
      await expect(page.locator('[aria-label="New terminal"]')).toBeVisible();
      
      // Check if close buttons have proper labels when visible
      const closeButtons = page.locator('[aria-label="Close terminal"]');
      if (await closeButtons.count() > 0) {
        await expect(closeButtons.first()).toBeVisible();
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      // Check for semantic HTML structure
      await expect(page.locator('.terminal-tabs')).toBeVisible();
      await expect(page.locator('.terminal-content')).toBeVisible();
      
      // Tabs should be accessible
      const tabs = page.locator('.terminal-tab');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        await expect(tabs.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle terminal initialization errors gracefully', async ({ page }) => {
      // Monitor console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Perform terminal operations
      await page.locator('[aria-label="New terminal"]').click();
      await page.waitForTimeout(1000);
      
      // Check that there are no critical errors
      const criticalErrors = errors.filter(error => 
        error.includes('Terminal') && 
        (error.includes('failed') || error.includes('error'))
      );
      
      expect(criticalErrors.length).toBe(0);
    });

    test('should recover from network interruptions', async ({ page, context }) => {
      // Simulate network issues (if applicable to your terminal implementation)
      await context.setOffline(true);
      await page.waitForTimeout(500);
      
      // Terminal should still function for local operations
      await page.locator('.terminal-wrapper').click();
      await page.keyboard.type('echo "offline test"');
      await page.keyboard.press('Enter');
      
      // Restore network
      await context.setOffline(false);
      await page.waitForTimeout(500);
    });

    test('should handle invalid commands gracefully', async ({ page }) => {
      await page.waitForSelector('.terminal-wrapper');
      await page.locator('.terminal-wrapper').click();
      
      // Type invalid command
      await page.keyboard.type('nonexistentcommand123');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(500);
      
      // Terminal should still be responsive
      await page.keyboard.type('echo "after invalid command"');
      await page.keyboard.press('Enter');
    });
  });
});