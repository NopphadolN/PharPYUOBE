const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

const { renderHeader } = require('../templates/sections/header');
const { renderSection1 } = require('../templates/sections/section1');
const { renderSection2 } = require('../templates/sections/section2');
const { renderSection3 } = require('../templates/sections/section3');

const generatePlanPDF = async (data, res) => {

  const templatePath = path.join(__dirname, '../templates/plan.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // ✅ รวม section
  const content = `
    ${renderHeader(data)}
    ${renderSection1(data)}
    ${renderSection2(data)}
    ${renderSection3(data)}
  `;

  html = html.replace('{{content}}', content);

  const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'load' });

  const buffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: {
    top: '1in',
    bottom: '1in',
    left: '1in',
    right: '1in'
  }
  });

  await browser.close();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': buffer.length
  });

  res.send(buffer);
};

module.exports = { generatePlanPDF };
