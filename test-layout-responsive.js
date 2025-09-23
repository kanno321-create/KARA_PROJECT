const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration for different screen sizes
const screenSizes = [
  { name: '1200x800', width: 1200, height: 800 },
  { name: '1600x900', width: 1600, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 }
];

async function testLayoutAtScreenSize(page, size) {
  console.log(`\n🔍 Testing layout at ${size.name}...`);

  // Set viewport size
  await page.setViewportSize({ width: size.width, height: size.height });

  // Wait for page to load and stabilize
  await page.waitForTimeout(1000);

  // Test results for this screen size
  const results = {
    screenSize: size.name,
    viewport: `${size.width}x${size.height}`,
    tests: {}
  };

  try {
    // Test 1: Sidebar stretches full height
    console.log('  ✓ Testing sidebar full height...');
    const sidebar = await page.locator('[class*="sidebarStyles"]').first();
    const sidebarBox = await sidebar.boundingBox();
    const viewportHeight = size.height;

    if (sidebarBox) {
      const sidebarHeight = sidebarBox.height;
      const heightMatch = Math.abs(sidebarHeight - viewportHeight) < 10; // Allow 10px tolerance
      results.tests.sidebarFullHeight = {
        passed: heightMatch,
        expected: viewportHeight,
        actual: sidebarHeight,
        tolerance: 10
      };
      console.log(`    Sidebar height: ${sidebarHeight}px (viewport: ${viewportHeight}px) - ${heightMatch ? 'PASS' : 'FAIL'}`);
    } else {
      results.tests.sidebarFullHeight = {
        passed: false,
        error: 'Sidebar not found'
      };
      console.log('    Sidebar not found - FAIL');
    }

    // Test 2: Account menu stays at bottom
    console.log('  ✓ Testing account menu position...');
    const accountSection = await page.locator('[class*="accountSectionStyles"]').first();
    const accountBox = await accountSection.boundingBox();

    if (accountBox && sidebarBox) {
      const accountBottom = accountBox.y + accountBox.height;
      const sidebarBottom = sidebarBox.y + sidebarBox.height;
      const bottomAlignment = Math.abs(accountBottom - sidebarBottom) < 10; // Allow 10px tolerance

      results.tests.accountMenuBottom = {
        passed: bottomAlignment,
        accountBottom: accountBottom,
        sidebarBottom: sidebarBottom,
        tolerance: 10
      };
      console.log(`    Account menu bottom: ${accountBottom}px, Sidebar bottom: ${sidebarBottom}px - ${bottomAlignment ? 'PASS' : 'FAIL'}`);
    } else {
      results.tests.accountMenuBottom = {
        passed: false,
        error: 'Account section or sidebar not found'
      };
      console.log('    Account section not found - FAIL');
    }

    // Test 3: Content stays centered (max-width constraint)
    console.log('  ✓ Testing content centering...');
    const messagesContainer = await page.locator('[class*="messagesContainerStyles"]').first();
    const inputContainer = await page.locator('[class*="inputContainerStyles"]').first();

    // Check if there are messages (conversation state) or welcome screen
    const hasMessages = await messagesContainer.count() > 0;
    const welcomeScreen = await page.locator('[class*="welcomeScreenStyles"]').first();

    if (hasMessages) {
      const messagesBox = await messagesContainer.boundingBox();
      if (messagesBox) {
        const maxWidth = 768; // From CSS styles
        const actualWidth = messagesBox.width;
        const widthConstrained = actualWidth <= maxWidth + 10; // Allow tolerance for padding

        results.tests.contentCentered = {
          passed: widthConstrained,
          maxExpectedWidth: maxWidth,
          actualWidth: actualWidth,
          constraint: 'messages container'
        };
        console.log(`    Messages container width: ${actualWidth}px (max: ${maxWidth}px) - ${widthConstrained ? 'PASS' : 'FAIL'}`);
      }
    } else {
      const welcomeBox = await welcomeScreen.boundingBox();
      if (welcomeBox) {
        // Welcome screen should be centered and reasonable width
        const screenCenter = size.width / 2;
        const welcomeCenter = welcomeBox.x + (welcomeBox.width / 2);
        const centered = Math.abs(welcomeCenter - screenCenter) < 50; // Allow some tolerance

        results.tests.contentCentered = {
          passed: centered,
          screenCenter: screenCenter,
          welcomeCenter: welcomeCenter,
          constraint: 'welcome screen centering'
        };
        console.log(`    Welcome screen center: ${welcomeCenter}px (screen center: ${screenCenter}px) - ${centered ? 'PASS' : 'FAIL'}`);
      }
    }

    // Test 4: No horizontal scrollbar
    console.log('  ✓ Testing for horizontal overflow...');
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    const hasHorizontalScroll = bodyScrollWidth > bodyClientWidth;

    results.tests.noHorizontalScroll = {
      passed: !hasHorizontalScroll,
      scrollWidth: bodyScrollWidth,
      clientWidth: bodyClientWidth
    };
    console.log(`    Body scroll width: ${bodyScrollWidth}px, client width: ${bodyClientWidth}px - ${!hasHorizontalScroll ? 'PASS' : 'FAIL'}`);

    // Test 5: Sidebar collapsed state (if toggle button exists)
    console.log('  ✓ Testing sidebar collapse functionality...');
    const toggleButton = await page.locator('button[title*="메뉴 토글"], button[title*="토글"]').first();
    const toggleExists = await toggleButton.count() > 0;

    if (toggleExists) {
      // Get initial sidebar width
      const initialSidebarBox = await sidebar.boundingBox();
      const initialWidth = initialSidebarBox ? initialSidebarBox.width : 0;

      // Click toggle button
      await toggleButton.click();
      await page.waitForTimeout(500); // Wait for animation

      // Get collapsed sidebar width
      const collapsedSidebarBox = await sidebar.boundingBox();
      const collapsedWidth = collapsedSidebarBox ? collapsedSidebarBox.width : 0;

      const collapseWorking = collapsedWidth < initialWidth;

      results.tests.sidebarCollapse = {
        passed: collapseWorking,
        initialWidth: initialWidth,
        collapsedWidth: collapsedWidth
      };
      console.log(`    Sidebar collapse: ${initialWidth}px → ${collapsedWidth}px - ${collapseWorking ? 'PASS' : 'FAIL'}`);

      // Restore to expanded state for screenshot
      await toggleButton.click();
      await page.waitForTimeout(500);
    } else {
      results.tests.sidebarCollapse = {
        passed: false,
        error: 'Toggle button not found'
      };
      console.log('    Toggle button not found - SKIP');
    }

  } catch (error) {
    console.error(`    Error during testing: ${error.message}`);
    results.error = error.message;
  }

  // Take screenshot
  const screenshotPath = `C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\layout-test-${size.name}.png`;
  try {
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,  // Just viewport, not full page
      clip: { x: 0, y: 0, width: size.width, height: size.height }
    });
    results.screenshot = screenshotPath;
    console.log(`  📸 Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`    Failed to save screenshot: ${error.message}`);
    results.screenshotError = error.message;
  }

  return results;
}

async function runLayoutTests() {
  console.log('🚀 Starting KIS AI Layout Responsiveness Tests\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    devtools: false
  });

  const context = await browser.newContext({
    // Disable JavaScript features that might interfere
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Navigate to the application
  const appUrl = 'http://localhost:3000';
  console.log(`📡 Navigating to ${appUrl}...`);

  try {
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    console.log('✅ Application loaded successfully');
  } catch (error) {
    console.error(`❌ Failed to load application: ${error.message}`);
    await browser.close();
    return;
  }

  // Wait for React to initialize
  await page.waitForTimeout(2000);

  const allResults = [];

  // Test each screen size
  for (const size of screenSizes) {
    const result = await testLayoutAtScreenSize(page, size);
    allResults.push(result);
  }

  // Generate summary report
  console.log('\n📊 LAYOUT TEST SUMMARY REPORT');
  console.log('===============================');

  const summaryResults = {};

  for (const result of allResults) {
    console.log(`\n🖥️  ${result.screenSize} (${result.viewport})`);

    if (result.error) {
      console.log(`   ❌ Test failed with error: ${result.error}`);
      continue;
    }

    for (const [testName, testResult] of Object.entries(result.tests)) {
      const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${testName}`);

      if (!testResult.passed && testResult.error) {
        console.log(`     Error: ${testResult.error}`);
      }

      // Track overall test results
      if (!summaryResults[testName]) {
        summaryResults[testName] = { passed: 0, failed: 0, total: 0 };
      }
      summaryResults[testName].total++;
      if (testResult.passed) {
        summaryResults[testName].passed++;
      } else {
        summaryResults[testName].failed++;
      }
    }

    if (result.screenshot) {
      console.log(`   📸 Screenshot: ${result.screenshot}`);
    }
  }

  // Overall summary
  console.log('\n🎯 OVERALL TEST RESULTS');
  console.log('========================');

  for (const [testName, stats] of Object.entries(summaryResults)) {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(0);
    const status = stats.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${testName}: ${stats.passed}/${stats.total} passed (${passRate}%)`);
  }

  // Save detailed report
  const reportPath = 'C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\layout-test-report.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: summaryResults,
    detailedResults: allResults,
    testedSizes: screenSizes
  };

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  } catch (error) {
    console.error(`Failed to save report: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Layout tests completed!');
}

// Run the tests
runLayoutTests().catch(console.error);