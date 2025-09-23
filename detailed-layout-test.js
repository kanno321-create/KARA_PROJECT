const { chromium } = require('playwright');

const screenSizes = [
  { name: '1200x800', width: 1200, height: 800 },
  { name: '1600x900', width: 1600, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 }
];

async function detailedLayoutTest() {
  console.log('🎯 Detailed KIS AI Layout Verification\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📡 Loading application...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const results = [];

  for (const size of screenSizes) {
    console.log(`\n🔍 Detailed testing at ${size.name}...`);

    // Set viewport
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(1000);

    const result = {
      size: size.name,
      viewport: `${size.width}x${size.height}`,
      tests: {}
    };

    try {
      // Test 1: Sidebar stretches full height
      console.log('  → Testing sidebar full height...');

      // Use more specific selectors to find the actual sidebar
      const sidebarSelector = 'div[class*="sidebarStyles"]:not([class*="collapsedSidebarStyles"])';
      await page.waitForSelector(sidebarSelector, { timeout: 5000 });

      const sidebarElement = page.locator(sidebarSelector).first();
      const sidebarBox = await sidebarElement.boundingBox();

      if (sidebarBox) {
        const sidebarTop = sidebarBox.y;
        const sidebarHeight = sidebarBox.height;
        const expectedHeight = size.height;
        const heightMatch = Math.abs(sidebarHeight - expectedHeight) < 20; // Allow tolerance

        result.tests.sidebarFullHeight = {
          passed: heightMatch && sidebarTop <= 10, // Should start near top
          sidebarTop: sidebarTop,
          sidebarHeight: sidebarHeight,
          expectedHeight: expectedHeight,
          difference: Math.abs(sidebarHeight - expectedHeight)
        };

        console.log(`    Sidebar: top=${sidebarTop}px, height=${sidebarHeight}px (expected: ${expectedHeight}px)`);
        console.log(`    Full height test: ${result.tests.sidebarFullHeight.passed ? 'PASS' : 'FAIL'}`);
      }

      // Test 2: Account menu stays at bottom of sidebar
      console.log('  → Testing account menu bottom positioning...');

      const accountSelector = 'div[class*="accountSectionStyles"]';
      await page.waitForSelector(accountSelector, { timeout: 5000 });

      const accountElement = page.locator(accountSelector).first();
      const accountBox = await accountElement.boundingBox();

      if (accountBox && sidebarBox) {
        const accountTop = accountBox.y;
        const accountHeight = accountBox.height;
        const accountBottom = accountTop + accountHeight;

        const sidebarBottom = sidebarBox.y + sidebarBox.height;
        const bottomAlignment = Math.abs(accountBottom - sidebarBottom) < 10;

        // Also check that account section is towards the bottom part of sidebar
        const sidebarBottomThird = sidebarBox.y + (sidebarBox.height * 2/3);
        const inBottomThird = accountTop >= sidebarBottomThird;

        result.tests.accountMenuBottom = {
          passed: bottomAlignment && inBottomThird,
          accountTop: accountTop,
          accountBottom: accountBottom,
          sidebarBottom: sidebarBottom,
          sidebarBottomThird: sidebarBottomThird,
          inBottomThird: inBottomThird,
          bottomAlignment: bottomAlignment
        };

        console.log(`    Account: top=${accountTop}px, bottom=${accountBottom}px`);
        console.log(`    Sidebar bottom: ${sidebarBottom}px`);
        console.log(`    Bottom positioning test: ${result.tests.accountMenuBottom.passed ? 'PASS' : 'FAIL'}`);
      }

      // Test 3: Content stays centered and within max-width
      console.log('  → Testing content centering...');

      // Check for welcome screen or chat interface
      const welcomeSelector = 'div[class*="welcomeScreenStyles"]';
      const welcomeExists = await page.locator(welcomeSelector).count() > 0;

      if (welcomeExists) {
        const welcomeElement = page.locator(welcomeSelector).first();
        const welcomeBox = await welcomeElement.boundingBox();

        if (welcomeBox) {
          // Check if content is centered within the main area (excluding sidebar)
          const sidebarWidth = sidebarBox ? sidebarBox.width : 0;
          const availableWidth = size.width - sidebarWidth;
          const contentAreaStart = sidebarWidth;
          const contentAreaCenter = contentAreaStart + (availableWidth / 2);

          const welcomeCenter = welcomeBox.x + (welcomeBox.width / 2);
          const centered = Math.abs(welcomeCenter - contentAreaCenter) < 50;

          result.tests.contentCentered = {
            passed: centered,
            contentType: 'welcome screen',
            welcomeCenter: welcomeCenter,
            expectedCenter: contentAreaCenter,
            availableWidth: availableWidth,
            centered: centered
          };

          console.log(`    Content center: ${welcomeCenter}px (expected: ${contentAreaCenter}px)`);
          console.log(`    Centering test: ${result.tests.contentCentered.passed ? 'PASS' : 'FAIL'}`);
        }
      } else {
        // Check for chat messages container
        const messagesSelector = 'div[class*="messagesContainerStyles"]';
        const messagesExists = await page.locator(messagesSelector).count() > 0;

        if (messagesExists) {
          const messagesElement = page.locator(messagesSelector).first();
          const messagesBox = await messagesElement.boundingBox();

          if (messagesBox) {
            const maxWidth = 768; // From the CSS
            const actualWidth = messagesBox.width;
            const widthConstrained = actualWidth <= maxWidth + 20; // Allow tolerance

            result.tests.contentCentered = {
              passed: widthConstrained,
              contentType: 'messages container',
              actualWidth: actualWidth,
              maxWidth: maxWidth,
              widthConstrained: widthConstrained
            };

            console.log(`    Messages width: ${actualWidth}px (max: ${maxWidth}px)`);
            console.log(`    Width constraint test: ${result.tests.contentCentered.passed ? 'PASS' : 'FAIL'}`);
          }
        } else {
          result.tests.contentCentered = {
            passed: false,
            error: 'No content area found'
          };
          console.log(`    Content centering test: FAIL (no content found)`);
        }
      }

      // Test 4: Test sidebar collapse functionality
      console.log('  → Testing sidebar collapse...');

      const toggleSelector = 'button[title*="메뉴"], button[title*="토글"]';
      const toggleExists = await page.locator(toggleSelector).count() > 0;

      if (toggleExists) {
        const initialWidth = sidebarBox ? sidebarBox.width : 0;

        // Click toggle to collapse
        await page.locator(toggleSelector).first().click();
        await page.waitForTimeout(500);

        // Check collapsed state
        const collapsedSelector = 'div[class*="collapsedSidebarStyles"], div[class*="sidebarStyles"]';
        const collapsedElement = page.locator(collapsedSelector).first();
        const collapsedBox = await collapsedElement.boundingBox();
        const collapsedWidth = collapsedBox ? collapsedBox.width : 0;

        const collapseWorked = collapsedWidth < initialWidth && collapsedWidth < 100;

        result.tests.sidebarCollapse = {
          passed: collapseWorked,
          initialWidth: initialWidth,
          collapsedWidth: collapsedWidth,
          collapseWorked: collapseWorked
        };

        console.log(`    Sidebar collapse: ${initialWidth}px → ${collapsedWidth}px`);
        console.log(`    Collapse test: ${result.tests.sidebarCollapse.passed ? 'PASS' : 'FAIL'}`);

        // Restore expanded state for next test
        await page.locator(toggleSelector).first().click();
        await page.waitForTimeout(500);
      } else {
        result.tests.sidebarCollapse = {
          passed: false,
          error: 'Toggle button not found'
        };
        console.log(`    Collapse test: FAIL (toggle not found)`);
      }

    } catch (error) {
      console.error(`    ❌ Error during ${size.name} testing: ${error.message}`);
      result.error = error.message;
    }

    // Take screenshot
    const screenshotPath = `C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\layout-detailed-${size.name}.png`;
    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: size.width, height: size.height }
      });
      result.screenshot = screenshotPath;
      console.log(`  📸 Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      console.error(`    ❌ Screenshot failed: ${error.message}`);
    }

    results.push(result);
  }

  await browser.close();

  // Generate detailed report
  console.log('\n📊 DETAILED LAYOUT TEST REPORT');
  console.log('===============================');

  let allTestsPassed = true;
  const testSummary = {};

  results.forEach(result => {
    console.log(`\n🖥️  ${result.size} (${result.viewport})`);

    if (result.error) {
      console.log(`   ❌ Test suite failed: ${result.error}`);
      allTestsPassed = false;
      return;
    }

    Object.entries(result.tests).forEach(([testName, testResult]) => {
      const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${testName}`);

      if (!testResult.passed) {
        allTestsPassed = false;
        if (testResult.error) {
          console.log(`     → ${testResult.error}`);
        }
      }

      // Track test statistics
      if (!testSummary[testName]) {
        testSummary[testName] = { passed: 0, failed: 0 };
      }
      if (testResult.passed) {
        testSummary[testName].passed++;
      } else {
        testSummary[testName].failed++;
      }
    });

    if (result.screenshot) {
      console.log(`   📸 ${result.screenshot}`);
    }
  });

  console.log('\n🎯 TEST SUMMARY BY REQUIREMENT');
  console.log('================================');

  Object.entries(testSummary).forEach(([testName, stats]) => {
    const total = stats.passed + stats.failed;
    const passRate = Math.round((stats.passed / total) * 100);
    const status = stats.failed === 0 ? '✅' : '❌';

    console.log(`${status} ${testName}: ${stats.passed}/${total} screens passed (${passRate}%)`);
  });

  console.log(`\n🏆 Overall result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('\n✅ Detailed layout verification completed!');

  return { allTestsPassed, results, testSummary };
}

detailedLayoutTest().catch(console.error);