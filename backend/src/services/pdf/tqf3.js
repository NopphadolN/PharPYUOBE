const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const { renderSection1 } = require('./templates/sections/section1_general');
const { renderSection2 } = require('./templates/sections/section2_clo');
const { renderMapping } = require('./templates/sections/section4_mapping');

const generateMKO3 = async (req, res) => {
  try {

    const data = req.data; 
    const { subPlos, cloMappings } = req.body; // ✅ ต้องส่งมาจาก frontend

    const htmlTemplate = fs.readFileSync(
      './templates/tqf3.html',
      'utf8'
    );

    const content = `
      ${renderSection1(data)}
      ${renderSection2(data)}
      ${renderMapping({ ...data, subPlos, cloMappings })}
    `;

    const finalHtml = htmlTemplate.replace('{{content}}', content);

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(finalHtml, {
      waitUntil: 'networkidle0'
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        bottom: '1cm',
        left: '1.5cm',
        right: '1.5cm'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send('PDF error');
  }
};

module.exports = { generateMKO3 };