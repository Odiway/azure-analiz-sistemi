const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'CAE_İş_Planı_V02.xlsx');
const wb = XLSX.readFile(filePath);

console.log('Sheet names:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  console.log('\n=== Sheet:', name, '===');
  console.log('Range:', ws['!ref']);
  
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Print first 15 rows to understand structure
  const rowCount = Math.min(data.length, 15);
  for (let i = 0; i < rowCount; i++) {
    console.log('Row ' + i + ':', JSON.stringify(data[i]));
  }
  
  console.log('... Total rows:', data.length);
  
  // Also print merged cells if any
  if (ws['!merges']) {
    console.log('Merged cells:', JSON.stringify(ws['!merges'].slice(0, 10)));
  }
});
