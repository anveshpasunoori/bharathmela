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

// A 192 × 192 PNG favicon: Google's search results use a square icon in a multiple of 48 px.
await writeFile(new URL("src/app/icon1.png", root), await appIcon(192, { rounded: true }));

// An ICO with 16, 32 and 48 px PNGs inside, for browsers and crawlers that only fetch /favicon.ico.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => sharp(mark, { density: 720 }).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); // ICO type
header.writeUInt16LE(sizes.length, 4); // image count
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4); // planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile(new URL("src/app/favicon.ico", root), Buffer.concat([header, ...images]));
