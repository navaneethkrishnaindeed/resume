const puppeteer = require('puppeteer');
const path = require('path');
const readline = require('readline');

const resumes = [
  { file: 'index.html', output: 'M_Navaneeth_Krishna_Resume.pdf', name: 'Original (Mixed)' },
  { file: 'index-aspnet.html', output: 'M_Navaneeth_Krishna_Resume_ASPNet.pdf', name: 'ASP.NET Backend' },
  { file: 'index-flutter.html', output: 'M_Navaneeth_Krishna_Resume_Flutter.pdf', name: 'Flutter Mobile' },
  { file: 'index-data-backend.html', output: 'M_Navaneeth_Krishna_Resume_DataBackend.pdf', name: 'Data Platform Backend' },
  { file: 'index-fullstack.html', output: 'M_Navaneeth_Krishna_Resume_FullStack.pdf', name: 'Full-Stack Engineer (3+ pages)' }
];

const coverLetters = [
  { file: 'cover-letter-aspnet.html', output: 'M_Navaneeth_Krishna_CoverLetter_ASPNet.pdf', name: 'ASP.NET Cover Letter' }
];

const allDocuments = [...resumes, ...coverLetters];

function showMenu() {
  console.log('\n📄 Resume & Cover Letter PDF Generator\n');
  console.log('═══════════════════════════════════════\n');
  
  console.log('📋 RESUMES:\n');
  resumes.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}`);
    console.log(`     └─ ${r.file} → ${r.output}\n`);
  });
  
  console.log('✉️  COVER LETTERS:\n');
  coverLetters.forEach((c, i) => {
    const num = resumes.length + i + 1;
    console.log(`  ${num}. ${c.name}`);
    console.log(`     └─ ${c.file} → ${c.output}\n`);
  });
  
  console.log('═══════════════════════════════════════\n');
  console.log(`  ${allDocuments.length + 1}. Generate ALL Resumes`);
  console.log(`  ${allDocuments.length + 2}. Generate ALL Cover Letters`);
  console.log(`  ${allDocuments.length + 3}. Generate EVERYTHING\n`);
}

async function generatePDF(doc, isResume = true) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, doc.file);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Different margins for resumes vs cover letters
  const margins = isResume ? {
    top: '18mm',
    right: '20mm',
    bottom: '18mm',
    left: '20mm'
  } : {
    top: '15mm',
    right: '25mm',
    bottom: '15mm',
    left: '25mm'
  };
  
  await page.pdf({
    path: doc.output,
    format: 'A4',
    margin: margins,
    printBackground: true
  });
  
  await browser.close();
  console.log(`✓ Generated: ${doc.output}`);
}

async function generateAllResumes() {
  console.log('\n📋 Generating all resumes...\n');
  for (const resume of resumes) {
    await generatePDF(resume, true);
  }
  console.log('\n✅ All resumes generated!\n');
}

async function generateAllCoverLetters() {
  console.log('\n✉️  Generating all cover letters...\n');
  for (const letter of coverLetters) {
    await generatePDF(letter, false);
  }
  console.log('\n✅ All cover letters generated!\n');
}

async function generateEverything() {
  console.log('\n🚀 Generating all documents...\n');
  for (const resume of resumes) {
    await generatePDF(resume, true);
  }
  for (const letter of coverLetters) {
    await generatePDF(letter, false);
  }
  console.log('\n✅ All PDFs generated!\n');
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  showMenu();

  const totalOptions = allDocuments.length + 3;
  
  rl.question(`Enter option (1-${totalOptions}): `, async (answer) => {
    const choice = parseInt(answer);
    
    if (choice >= 1 && choice <= resumes.length) {
      // Individual resume
      await generatePDF(resumes[choice - 1], true);
    } else if (choice > resumes.length && choice <= allDocuments.length) {
      // Individual cover letter
      const letterIndex = choice - resumes.length - 1;
      await generatePDF(coverLetters[letterIndex], false);
    } else if (choice === allDocuments.length + 1) {
      // All resumes
      await generateAllResumes();
    } else if (choice === allDocuments.length + 2) {
      // All cover letters
      await generateAllCoverLetters();
    } else if (choice === allDocuments.length + 3) {
      // Everything
      await generateEverything();
    } else {
      console.log('Invalid option');
    }
    
    rl.close();
  });
}

main();
