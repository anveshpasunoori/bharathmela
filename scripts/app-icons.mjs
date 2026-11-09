// Draws the installable-app icons from the BM logo: public/icons/icon-192.png and icon-512.png (rounded),
// icon-maskable-512.png (full-bleed, logo inside Android's safe zone) and src/app/apple-icon.png (iOS rounds it).
// Run: node scripts/app-icons.mjs
import sharp from "sharp";

const logo = (size, { rounded = true, scale = 1 } = {}) => {
  const font = Math.round(size * 0.44 * scale);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#c2410c"/>
<text x="50%" y="50%" dy="0.35em" font-family="Helvetica, Arial, sans-serif" font-size="${font}" font-weight="700" fill="#ffffff" text-anchor="middle">BM</text>
</svg>`);
};

const out = new URL("..", import.meta.url).pathname;
await sharp(logo(192)).png().toFile(`${out}public/icons/icon-192.png`);
await sharp(logo(512)).png().toFile(`${out}public/icons/icon-512.png`);
await sharp(logo(512, { rounded: false, scale: 0.78 })).png().toFile(`${out}public/icons/icon-maskable-512.png`);
await sharp(logo(180, { rounded: false })).png().toFile(`${out}src/app/apple-icon.png`);
console.log("Wrote app icons");
