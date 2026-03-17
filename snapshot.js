const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://mybagpro.jp/app/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'snapshot.png' });
  await browser.close();
})();
