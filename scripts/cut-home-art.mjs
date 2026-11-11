// Cuts the home page art sheets into the files the home page uses (see src/lib/home-art.ts).
//
//   node scripts/cut-home-art.mjs cards <sheet>   the 1536×1024 sheet of cards: six category photos, three
//                                                 event photos and the request banner's skyline
//   node scripts/cut-home-art.mjs hero <sheet>    the 1672×941 sheet: hero on top, request banner at the bottom
//
// Regions are measured on the original sheet and scaled to the file's real size. Crops stay inside each
// card's rounded corners and clear of the icons, badges and date chips drawn over the photos.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const [mode, src] = process.argv.slice(2);
if (!src || !["cards", "hero"].includes(mode)) {
  console.error("Usage: node scripts/cut-home-art.mjs cards|hero <sheet image>");
  process.exit(1);
}
const ref = mode === "cards" ? { w: 1536, h: 1024 } : { w: 1672, h: 941 };
const { width, height } = await sharp(src).metadata();
const sx = width / ref.w;
const sy = height / ref.h;
const box = (left, top, right, bottom) => ({
  left: Math.round(left * sx),
  top: Math.round(top * sy),
  width: Math.round((right - left) * sx),
  height: Math.round((bottom - top) * sy),
});

mkdirSync("public/home/categories", { recursive: true });
mkdirSync("public/home/events", { recursive: true });
const cut = (region, out, resize) =>
  sharp(src)
    .extract(region)
    .resize({ ...resize, kernel: "lanczos3" })
    .webp({ quality: 86 })
    .toFile(out)
    .then(() => console.log("wrote", out));

if (mode === "cards") {
  // Category photos: the part above the round icon badge.
  const categories = [
    ["FOOD", 36, 278],
    ["TUTORING", 304, 527],
    ["HOME_SERVICES", 552, 759],
    ["EVENT_SERVICES", 784, 989],
    ["PUJARI", 1015, 1236],
    ["ROOM_RENTAL", 1260, 1504],
  ];
  for (const [id, l, r] of categories) await cut(box(l, 28, r, 150), `public/home/categories/${id}.webp`, { width: 640 });
  // Event photos, to the right of the date chips.
  const events = [
    ["dance", 908, 1058],
    ["diyas", 1134, 1282],
    ["temple", 1356, 1506],
  ];
  for (const [name, l, r] of events) await cut(box(l, 682, r, 790), `public/home/events/${name}.webp`, { width: 480 });
  // The request banner's green temple skyline, below the button.
  await cut(box(330, 792, 828, 884), "public/home/request-skyline.webp", { width: 1200 });
} else {
  await cut(box(0, 0, 1672, 452), "public/home/hero.webp", { width: 2400, withoutEnlargement: true });
  await cut(box(0, 760, 1672, 941), "public/home/request-banner.webp", { width: 2000, withoutEnlargement: true });
}
