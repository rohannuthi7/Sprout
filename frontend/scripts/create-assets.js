// Generates solid-color placeholder PNG files for all Expo asset slots.
// Uses only Node.js built-ins (zlib + fs). Safe to re-run; overwrites existing files.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function solidPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; ihdrData[9] = 2; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  // One scanline (filter=0 then RGB×w), tiled for all rows
  const line = Buffer.allocUnsafe(1 + w * 3);
  line[0] = 0;
  for (let x = 0; x < w; x++) { line[1 + x*3] = r; line[2 + x*3] = g; line[3 + x*3] = b; }
  const raw = Buffer.allocUnsafe(h * line.length);
  for (let y = 0; y < h; y++) line.copy(raw, y * line.length);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', zlib.deflateSync(raw, { level: 1 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dir, { recursive: true });

// Sprout deepGreen #40534D
const [R, G, B] = [0x40, 0x53, 0x4d];

const files = [
  { name: 'icon.png',          w: 1024, h: 1024 },
  { name: 'splash.png',        w: 1024, h: 1024 },
  { name: 'adaptive-icon.png', w: 1024, h: 1024 },
  { name: 'favicon.png',       w:   64, h:   64 },
];

for (const { name, w, h } of files) {
  fs.writeFileSync(path.join(dir, name), solidPNG(w, h, R, G, B));
  console.log(`✓ assets/${name} (${w}×${h})`);
}
console.log('Done.');
