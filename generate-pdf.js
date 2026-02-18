const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: 'M_Navaneeth_Krishna_Resume.pdf',
    format: 'A4',
    margin: {
      top: '18mm',
      right: '20mm',
      bottom: '18mm',
      left: '20mm'
    },
    printBackground: true
  });
  
  await browser.close();
  console.log('PDF generated: M_Navaneeth_Krishna_Resume.pdf');
}

generatePDF();
