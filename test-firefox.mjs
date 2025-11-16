import { firefox } from 'playwright';

const browser = await firefox.launch();
const page = await browser.newPage();
await page.goto('http://localhost:4321/');
await page.screenshot({ path: 'homepage-firefox.png' });
console.log('Screenshot saved to homepage-firefox.png');
await browser.close();
