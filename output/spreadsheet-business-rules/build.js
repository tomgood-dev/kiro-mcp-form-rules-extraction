// Builds the Asteron Connect Quote Screen business-rules workbook from data.js
// into both .xlsx and .ods, next to this script.
const path = require('path');
const XLSX = require(path.join(__dirname, '..', '..', 'node_modules', 'xlsx'));
const { README, HEADER, sheets, KNOWN_DISCREPANCIES } = require('./data.js');

const wb = XLSX.utils.book_new();

function addSheet(name, rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Reasonable column widths so it's usable without manual resizing.
  ws['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 40 }, { wch: 70 }, { wch: 22 }];
  // Freeze the header row.
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!sheetView'] = [{ topLeftCell: 'A2', ySplit: 1 }];
  XLSX.utils.book_append_sheet(wb, ws, name);
  return ws;
}

// Read_Me sheet first so it's the tab that opens by default.
addSheet('Read_Me', README);

for (const [name, rows] of sheets) {
  addSheet(name, [HEADER, ...rows]);
}

const discWs = XLSX.utils.aoa_to_sheet(KNOWN_DISCREPANCIES);
discWs['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 55 }, { wch: 55 }, { wch: 25 }, { wch: 45 }];
XLSX.utils.book_append_sheet(wb, discWs, 'Known_Discrepancies');

const xlsxPath = path.join(__dirname, 'Asteron-Connect-Quote-Screen-Business-Rules.xlsx');
const odsPath = path.join(__dirname, 'Asteron-Connect-Quote-Screen-Business-Rules.ods');

XLSX.writeFile(wb, xlsxPath);
XLSX.writeFile(wb, odsPath);

console.log('Wrote:', xlsxPath);
console.log('Wrote:', odsPath);

// Sanity check: re-read both files back and report row counts per sheet.
for (const p of [xlsxPath, odsPath]) {
  const check = XLSX.readFile(p);
  console.log(`\nVerify ${path.basename(p)}:`);
  for (const sn of check.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(check.Sheets[sn], { header: 1 });
    console.log(`  ${sn}: ${rows.length} rows`);
  }
}
