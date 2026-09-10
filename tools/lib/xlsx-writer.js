// Dependency-free XLSX (Office Open XML SpreadsheetML) writer.
//
// Built on the hand-rolled ZipWriter (see zip-writer.js) because this environment has no npm.
// Supports what the SharePoint tester template needs:
//   • Multiple worksheets
//   • String / number cells, bold + wrapped-text styles, column widths, row heights
//   • A merged banner/title row
//   • PNG images anchored into a worksheet (the "Test N" proof screenshots)
//
// Deliberately minimal — only the OOXML parts Excel/LibreOffice/SharePoint need to open the
// file cleanly. Not a general-purpose library.
//
// Usage:
//   const { Workbook } = require('./xlsx-writer');
//   const wb = new Workbook();
//   const ws = wb.addSheet('Script');
//   ws.setColumns([{ width: 8 }, { width: 40 }, ...]);
//   ws.addRow(['Test', 'Description', ...], { bold: true });
//   ws.addRow([1, 'desc', ...], { wrap: true });
//   const img = wb.addImage(pngBuffer);       // register once
//   const t = wb.addSheet('Test 1');
//   t.addImage(img, { row: 2, col: 0, widthPx: 900 });  // place, scaled to width
//   fs.writeFileSync('out.xlsx', wb.toBuffer());

const { ZipWriter } = require('./zip-writer');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\r/g, '');
}

// Column index (0-based) -> spreadsheet letter (A, B, ..., Z, AA, ...).
function colLetter(i) {
  let s = '';
  i += 1;
  while (i > 0) {
    const rem = (i - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

// Read a PNG's pixel width/height from its IHDR chunk (bytes 16..24).
function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return { width: 600, height: 400 };
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const EMU_PER_PX = 9525; // English Metric Units per pixel at 96 DPI

class Sheet {
  constructor(name, index) {
    this.name = name;
    this.index = index; // 1-based
    this.rows = []; // { cells: [{v, t, styleId}], height }
    this.columns = null; // [{width}]
    this.merges = []; // ['A1:F1']
    this.images = []; // { imageIndex, fromRow, fromCol, widthPx, heightPx }
  }

  setColumns(cols) {
    this.columns = cols;
    return this;
  }

  // cells: array of raw values; opts.styleId applied to all; per-cell style via {v, styleId}
  addRow(cells, opts = {}) {
    const height = opts.height || null;
    const rowCells = cells.map((c) => {
      const cell = c && typeof c === 'object' && 'v' in c ? c : { v: c };
      return { v: cell.v, styleId: cell.styleId != null ? cell.styleId : opts.styleId || 0 };
    });
    this.rows.push({ cells: rowCells, height });
    return this.rows.length; // 1-based row number
  }

  mergeTitle(text, colCount, styleId) {
    const rowNum = this.addRow([{ v: text, styleId }]);
    this.merges.push(`A${rowNum}:${colLetter(colCount - 1)}${rowNum}`);
    return this;
  }

  // Place a registered image. row/col are 0-based anchor. Scales to widthPx if given.
  addImage(img, { row = 0, col = 0, widthPx } = {}) {
    let w = img.width;
    let h = img.height;
    if (widthPx && img.width) {
      const scale = widthPx / img.width;
      w = Math.round(img.width * scale);
      h = Math.round(img.height * scale);
    }
    this.images.push({ imageIndex: img.index, fromRow: row, fromCol: col, widthPx: w, heightPx: h });
    return this;
  }
}

class Workbook {
  constructor() {
    this.sheets = [];
    this.images = []; // { index (1-based), buffer, ext, width, height }
    this._shared = new Map();
    this._sharedList = [];
  }

  addSheet(name) {
    // Excel sheet names: max 31 chars, no : \ / ? * [ ]
    const safe = String(name).replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || `Sheet${this.sheets.length + 1}`;
    const sheet = new Sheet(safe, this.sheets.length + 1);
    this.sheets.push(sheet);
    return sheet;
  }

  addImage(pngBuffer) {
    const { width, height } = pngSize(pngBuffer);
    const index = this.images.length + 1;
    this.images.push({ index, buffer: pngBuffer, ext: 'png', width, height });
    return { index, width, height };
  }

  _sharedIndex(str) {
    if (this._shared.has(str)) return this._shared.get(str);
    const idx = this._sharedList.length;
    this._shared.set(str, idx);
    this._sharedList.push(str);
    return idx;
  }

  // ── Style sheet: 0 = normal, 1 = bold, 2 = wrap top-left, 3 = bold+wrap+fill (header) ──
  _stylesXml() {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
      '</fonts>' +
      '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFD9E1F2"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="2">' +
      '<border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border>' +
      '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4">' +
      // 0 normal
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
      // 1 bold
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>' +
      // 2 wrap, top-left align
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' +
      // 3 header: bold + wrap + fill
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
    );
  }

  _sheetXml(sheet) {
    const parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    parts.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');

    if (sheet.columns) {
      parts.push('<cols>');
      sheet.columns.forEach((c, i) => {
        parts.push(`<col min="${i + 1}" max="${i + 1}" width="${c.width || 12}" customWidth="1"/>`);
      });
      parts.push('</cols>');
    }

    parts.push('<sheetData>');
    sheet.rows.forEach((row, ri) => {
      const rowNum = ri + 1;
      const heightAttr = row.height ? ` ht="${row.height}" customHeight="1"` : '';
      parts.push(`<row r="${rowNum}"${heightAttr}>`);
      row.cells.forEach((cell, ci) => {
        if (cell.v == null || cell.v === '') {
          // still emit an empty styled cell so borders/fills render across the row
          parts.push(`<c r="${colLetter(ci)}${rowNum}" s="${cell.styleId}"/>`);
          return;
        }
        const ref = `${colLetter(ci)}${rowNum}`;
        if (typeof cell.v === 'number' && isFinite(cell.v)) {
          parts.push(`<c r="${ref}" s="${cell.styleId}"><v>${cell.v}</v></c>`);
        } else {
          const si = this._sharedIndex(String(cell.v));
          parts.push(`<c r="${ref}" s="${cell.styleId}" t="s"><v>${si}</v></c>`);
        }
      });
      parts.push('</row>');
    });
    parts.push('</sheetData>');

    if (sheet.merges.length) {
      parts.push(`<mergeCells count="${sheet.merges.length}">`);
      sheet.merges.forEach((m) => parts.push(`<mergeCell ref="${m}"/>`));
      parts.push('</mergeCells>');
    }

    if (sheet.images.length) {
      parts.push(`<drawing r:id="rId1"/>`);
    }

    parts.push('</worksheet>');
    return parts.join('');
  }

  _drawingXml(sheet) {
    const parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    parts.push('<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">');
    sheet.images.forEach((im, i) => {
      const cx = im.widthPx * EMU_PER_PX;
      const cy = im.heightPx * EMU_PER_PX;
      const nvId = i + 2; // arbitrary unique id
      parts.push('<xdr:oneCellAnchor>');
      parts.push(`<xdr:from><xdr:col>${im.fromCol}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${im.fromRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>`);
      parts.push(`<xdr:ext cx="${cx}" cy="${cy}"/>`);
      parts.push('<xdr:pic>');
      parts.push(`<xdr:nvPicPr><xdr:cNvPr id="${nvId}" name="Picture ${nvId}"/><xdr:cNvPicPr/></xdr:nvPicPr>`);
      parts.push(`<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`);
      parts.push(`<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>`);
      parts.push('</xdr:pic>');
      parts.push('<xdr:clientData/>');
      parts.push('</xdr:oneCellAnchor>');
    });
    parts.push('</xdr:wsDr>');
    return parts.join('');
  }

  toBuffer() {
    const zip = new ZipWriter();

    // Which sheets have drawings (need drawing parts + rels)
    const sheetsWithImages = this.sheets.filter((s) => s.images.length);

    // ── [Content_Types].xml ──
    const ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    ct.push('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">');
    ct.push('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>');
    ct.push('<Default Extension="xml" ContentType="application/xml"/>');
    ct.push('<Default Extension="png" ContentType="image/png"/>');
    ct.push('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>');
    ct.push('<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>');
    ct.push('<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>');
    this.sheets.forEach((s) => ct.push(`<Override PartName="/xl/worksheets/sheet${s.index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`));
    sheetsWithImages.forEach((s) => ct.push(`<Override PartName="/xl/drawings/drawing${s.index}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`));
    ct.push('</Types>');
    zip.add('[Content_Types].xml', ct.join(''));

    // ── _rels/.rels ──
    zip.add(
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'
    );

    // ── xl/workbook.xml ──
    const wbXml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    wbXml.push('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>');
    this.sheets.forEach((s) => wbXml.push(`<sheet name="${esc(s.name)}" sheetId="${s.index}" r:id="rId${s.index}"/>`));
    wbXml.push('</sheets></workbook>');
    zip.add('xl/workbook.xml', wbXml.join(''));

    // ── xl/_rels/workbook.xml.rels ── (sheets + styles + sharedStrings)
    const wbRels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    wbRels.push('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">');
    this.sheets.forEach((s) => wbRels.push(`<Relationship Id="rId${s.index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.index}.xml"/>`));
    const stylesRid = this.sheets.length + 1;
    const sharedRid = this.sheets.length + 2;
    wbRels.push(`<Relationship Id="rId${stylesRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
    wbRels.push(`<Relationship Id="rId${sharedRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`);
    wbRels.push('</Relationships>');
    zip.add('xl/_rels/workbook.xml.rels', wbRels.join(''));

    // ── styles ──
    zip.add('xl/styles.xml', this._stylesXml());

    // ── worksheets (build first so sharedStrings is fully populated) ──
    const sheetXmls = this.sheets.map((s) => ({ s, xml: this._sheetXml(s) }));

    // ── sharedStrings.xml (populated by _sheetXml calls above) ──
    const ss = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
    ss.push(`<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this._sharedList.length}" uniqueCount="${this._sharedList.length}">`);
    this._sharedList.forEach((str) => ss.push(`<si><t xml:space="preserve">${esc(str)}</t></si>`));
    ss.push('</sst>');
    zip.add('xl/sharedStrings.xml', ss.join(''));

    // ── write sheets + their drawing rels ──
    sheetXmls.forEach(({ s, xml }) => {
      zip.add(`xl/worksheets/sheet${s.index}.xml`, xml);
      if (s.images.length) {
        zip.add(
          `xl/worksheets/_rels/sheet${s.index}.xml.rels`,
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${s.index}.xml"/>` +
            '</Relationships>'
        );
        zip.add(`xl/drawings/drawing${s.index}.xml`, this._drawingXml(s));
        // drawing rels -> media
        const dRels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
        dRels.push('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">');
        s.images.forEach((im, i) => {
          dRels.push(`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${im.imageIndex}.png"/>`);
        });
        dRels.push('</Relationships>');
        zip.add(`xl/drawings/_rels/drawing${s.index}.xml.rels`, dRels.join(''));
      }
    });

    // ── media (PNGs, stored uncompressed since already compressed) ──
    this.images.forEach((im) => {
      zip.add(`xl/media/image${im.index}.png`, im.buffer, { store: true });
    });

    return zip.toBuffer();
  }
}

module.exports = { Workbook, colLetter };
