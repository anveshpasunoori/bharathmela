// Render platform icons from the same storefront pin used in the site header.
// Run: node scripts/app-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const mark = await readFile(new URL("src/app/icon.svg", root));

async function appIcon(size, { rounded = false, scale = 0.77 } = {}) {
  const markSize = Math.round(size * scale);
  const pin = await sharp(mark, { density: 720 }).resize(markSize, markSize).png().toBuffer();
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#FFF3DA"/></svg>`,
  );
  return sharp(background).composite([{ input: pin, gravity: "center" }]).png().toBuffer();
}

for (const [path, size, options] of [
  ["public/icons/icon-192.png", 192, { rounded: true }],
  ["public/icons/icon-512.png", 512, { rounded: true }],
  ["public/icons/icon-maskable-512.png", 512, { scale: 0.76 }],
  ["src/app/apple-icon.png", 180, {}],
]) {
  await writeFile(new URL(path, root), await appIcon(size, options));
}

// An ICO directory with a single embedded 32 × 32 PNG for legacy favicon clients.
const faviconSize = 32;
const favicon = await sharp(mark).resize(faviconSize, faviconSize).png().toBuffer();
const directory = Buffer.alloc(22);
directory.writeUInt16LE(1, 2); // ICO type
directory.writeUInt16LE(1, 4); // image count
directory[6] = faviconSize;
directory[7] = faviconSize;
directory.writeUInt16LE(1, 10); // planes
directory.writeUInt16LE(32, 12); // bits per pixel
directory.writeUInt32LE(favicon.length, 14);
directory.writeUInt32LE(directory.length, 18);
await writeFile(new URL("src/app/favicon.ico", root), Buffer.concat([directory, favicon]));
