// Dependency-free ZIP writer.
//
// This environment has NO npm — only the bundled Node 22 runtime — so we cannot install
// jszip/archiver/exceljs. A .xlsx is just a ZIP of XML (+ media) parts, and a ZIP with
// DEFLATE-compressed entries can be built with node's built-in `zlib.deflateRawSync` plus a
// hand-rolled CRC32 and the (well-documented) ZIP local-header / central-directory / EOCD
// byte layout. No external dependency required.
//
// Usage:
//   const { ZipWriter } = require('./zip-writer');
//   const zip = new ZipWriter();
//   zip.add('xl/workbook.xml', Buffer.from(xml, 'utf8'));   // text or binary Buffer/string
//   zip.add('xl/media/image1.png', pngBuffer, { store: true }); // store (no compress) for pngs
//   const buf = zip.toBuffer();
//   fs.writeFileSync('out.xlsx', buf);

const zlib = require('zlib');

// ── CRC32 (standard polynomial 0xEDB88320), precomputed table ──
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// DOS date/time from a JS Date (ZIP stores mod time in this legacy format).
function dosDateTime(date = new Date()) {
  const time =
    (Math.floor(date.getSeconds() / 2) & 0x1f) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getHours() & 0x1f) << 11);
  const dosDate =
    (date.getDate() & 0x1f) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (((Math.max(1980, date.getFullYear()) - 1980) & 0x7f) << 9);
  return { time: time & 0xffff, date: dosDate & 0xffff };
}

class ZipWriter {
  constructor() {
    this.entries = [];
    this.date = new Date();
  }

  /**
   * Add a file entry.
   * @param {string} name  path inside the zip (forward slashes)
   * @param {Buffer|string} data
   * @param {{store?: boolean}} [opts]  store=true => no compression (use for already-compressed
   *                                    data like PNGs so we don't waste CPU / risk expansion)
   */
  add(name, data, opts = {}) {
    const content = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
    const store = !!opts.store;
    const compressed = store ? content : zlib.deflateRawSync(content, { level: 9 });
    this.entries.push({
      name: name.replace(/\\/g, '/'),
      crc: crc32(content),
      compressedSize: compressed.length,
      uncompressedSize: content.length,
      method: store ? 0 : 8, // 0 = stored, 8 = deflate
      compressed,
    });
    return this;
  }

  toBuffer() {
    const { time, date } = dosDateTime(this.date);
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const e of this.entries) {
      const nameBuf = Buffer.from(e.name, 'utf8');

      // ── Local file header (30 bytes + name) ──
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0); // signature
      local.writeUInt16LE(20, 4); // version needed
      local.writeUInt16LE(0x0800, 6); // flags: bit 11 = UTF-8 names
      local.writeUInt16LE(e.method, 8);
      local.writeUInt16LE(time, 10);
      local.writeUInt16LE(date, 12);
      local.writeUInt32LE(e.crc, 14);
      local.writeUInt32LE(e.compressedSize, 18);
      local.writeUInt32LE(e.uncompressedSize, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      local.writeUInt16LE(0, 28); // extra field length

      localParts.push(local, nameBuf, e.compressed);

      // ── Central directory header (46 bytes + name) ──
      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0); // signature
      central.writeUInt16LE(20, 4); // version made by
      central.writeUInt16LE(20, 6); // version needed
      central.writeUInt16LE(0x0800, 8); // flags: UTF-8
      central.writeUInt16LE(e.method, 10);
      central.writeUInt16LE(time, 12);
      central.writeUInt16LE(date, 14);
      central.writeUInt32LE(e.crc, 16);
      central.writeUInt32LE(e.compressedSize, 20);
      central.writeUInt32LE(e.uncompressedSize, 24);
      central.writeUInt16LE(nameBuf.length, 28);
      central.writeUInt16LE(0, 30); // extra len
      central.writeUInt16LE(0, 32); // comment len
      central.writeUInt16LE(0, 34); // disk number
      central.writeUInt16LE(0, 36); // internal attrs
      central.writeUInt32LE(0, 38); // external attrs
      central.writeUInt32LE(offset, 42); // local header offset

      centralParts.push(central, nameBuf);

      offset += local.length + nameBuf.length + e.compressed.length;
    }

    const centralDir = Buffer.concat(centralParts);
    const localData = Buffer.concat(localParts);

    // ── End of central directory record (22 bytes) ──
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4); // disk number
    eocd.writeUInt16LE(0, 6); // disk with central dir
    eocd.writeUInt16LE(this.entries.length, 8); // entries on this disk
    eocd.writeUInt16LE(this.entries.length, 10); // total entries
    eocd.writeUInt32LE(centralDir.length, 12); // central dir size
    eocd.writeUInt32LE(localData.length, 16); // central dir offset
    eocd.writeUInt16LE(0, 20); // comment length

    return Buffer.concat([localData, centralDir, eocd]);
  }
}

module.exports = { ZipWriter, crc32 };
