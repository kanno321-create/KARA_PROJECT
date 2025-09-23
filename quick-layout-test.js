const { chromium } = require('playwright');

const screenSizes = [
  { name: '1200x800', width: 1200, height: 800 },
  { name: '1600x900', width: 1600, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 }
];

async function quickLayoutTest() {
  console.log('🚀 Quick KIS AI Layout Tests\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📡 Loading application...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for app to render
  await page.waitForTimeout(3000);

  const results = [];

  for (const size of screenSizes) {
    console.log(`\n🔍 Testing ${size.name}...`);

    // Set viewport
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(1000);

    const result = { size: size.name, tests: {} };

    try {
      // Test 1: Check if sidebar exists and get its dimensions
      console.log('  → Checking sidebar...');
      const sidebarExists = await page.locator('div').filter({ hasText: 'KIS AI' }).count() > 0;

      if (sidebarExists) {
        // Get sidebar element by looking for the navigation structure
        const navElement = await page.locator('div:has-text("KIS AI")').first();
        const navBox = await navElement.boundingBox();

        if (navBox) {
          result.tests.sidebarFound = true;
          result.tests.sidebarHeight = navBox.height;
          result.tests.sidebarWidth = navBox.width;
          console.log(`    Sidebar: ${navBox.width}px × ${navBox.height}px`);
        }
      }

      // Test 2: Check for account section
      console.log('  → Checking account section...');
      const personaExists = await page.locator('div').filter({ hasText: '이충원' }).count() > 0;
      result.tests.accountSectionFound = personaExists;
      console.log(`    Account section: ${personaExists ? 'Found' : 'Not found'}`);

      // Test 3: Check for main content area
      console.log('  → Checking main content...');
      const mainContentExists = await page.locator('div').filter({ hasText: '무엇을 도와드릴까요' }).count() > 0;
      result.tests.mainContentFound = mainContentExists;
      console.log(`    Main content: ${mainContentExists ? 'Found' : 'Not found'}`);

      // Test 4: Check for horizontal scrolling
      console.log('  → Checking for overflow...');
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      const hasHorizontalScroll = bodyScrollWidth > bodyClientWidth;

      result.tests.hasHorizontalScroll = hasHorizontalScroll;
      result.tests.scrollWidth = bodyScrollWidth;
      result.tests.clientWidth = bodyClientWidth;
      console.log(`    Overflow: ${hasHorizontalScroll ? 'Yes' : 'No'} (${bodyScrollWidth}px/${bodyClientWidth}px)`);

    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      result.error = error.message;
    }

    // Take screenshot
    const screenshotPath = `C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\quick-test-${size.name}.png`;
    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: size.width, height: size.height }
      });
      result.screenshot = screenshotPath;
      console.log(`  📸 Screenshot: ${screenshotPath}`);
    } catch (error) {
      console.log(`  ❌ Screenshot failed: ${error.message}`);
    }

    results.push(result);
  }

  await browser.close();

  // Print summary
  console.log('\n📊 SUMMARY');
  console.log('==========');

  results.forEach(result => {
    console.log(`\n🖥️  ${result.size}`);
    if (result.error) {
      console.log(`   ❌ Failed: ${result.error}`);
      return;
    }

    const tests = result.tests;
    console.log(`   Sidebar: ${tests.sidebarFound ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Account: ${tests.accountSectionFound ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Content: ${tests.mainContentFound ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Overflow: ${tests.hasHorizontalScroll ? '❌ Yes' : '✅ None'}`);
    if (result.screenshot) {
      console.log(`   Screenshot: ✅ Saved`);
    }
  });

  console.log('\n✅ Quick tests completed!');
}

quickLayoutTest().catch(console.error);