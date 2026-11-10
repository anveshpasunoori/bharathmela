// Draws the subcategory icons (Auto Services → Towing…) in the category icons' palette and tile, with bolder
// lines so they read at chip size, into public/subcategories/<CATEGORY>/<SUBCATEGORY>.svg.
// Run: node scripts/subcategory-icons.mjs   (edit a drawing below, then re-run)
// Every subcategory in src/lib/subcategories.ts needs a drawing here; tests/subcategories.ts checks the files.
import { mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] ?? new URL("../public/subcategories", import.meta.url).pathname;

const C = {
  line: "#7c2d12",
  brand: "#c2410c",
  main: "#f97316",
  mid: "#fb923c",
  light: "#fed7aa",
  pale: "#ffedd5",
  gold: "#f59e0b",
  goldLight: "#fcd34d",
  leaf: "#65a30d",
  leafLight: "#84cc16",
  stone: "#a8a29e",
  dark: "#57534e",
  sky: "#7dd3fc",
  white: "#fffbf5",
};
const W = 5; // line width
const st = `stroke="${C.line}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, fill = "none") => `<path d="${d}" fill="${fill}" ${st}/>`;
const R = (x, y, w, h, rx, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${st}/>`;
const O = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${st}/>`;
const E = (cx, cy, rx, ry, fill) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${st}/>`;
const L = (d, color = C.line, w = W) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const T = (x, y, text, size = 34, fill = C.line) =>
  `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${size}" text-anchor="middle" fill="${fill}">${text}</text>`;
// Place a drawing: move to (x, y), scale by s, rotate by r degrees around its own origin.
const at = (x, y, s, body, r = 0) => `<g transform="translate(${x} ${y}) scale(${s})${r ? ` rotate(${r})` : ""}">${body}</g>`;
const spark = (x, y, r, fill = C.gold) =>
  `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#ffedd5"/></linearGradient></defs>
<rect x="2" y="2" width="156" height="156" rx="30" fill="url(#bg)" stroke="#fed7aa" stroke-width="2"/>
${body}
</svg>
`;

// ---------- reusable pieces, drawn around (0, 0) at roughly 100 units wide ----------

const car = (fill = C.main) =>
  P("M-50 14 L-48 -2 Q-46 -12 -34 -14 L-22 -28 Q-17 -33 -8 -33 L16 -33 Q25 -33 31 -26 L40 -14 Q50 -12 50 -2 L50 14 Z", fill) +
  P("M-18 -14 L-10 -25 Q-8 -27 -4 -27 L6 -27 L6 -14 Z", C.sky) +
  P("M12 -27 L17 -27 Q22 -27 26 -22 L32 -14 L12 -14 Z", C.sky) +
  O(-28, 16, 11, C.dark) + O(28, 16, 11, C.dark) + `<circle cx="-28" cy="16" r="4" fill="${C.light}"/><circle cx="28" cy="16" r="4" fill="${C.light}"/>`;
const house = (roof = C.brand, wall = C.white, door = C.main) =>
  P("M-38 -4 L-38 40 L38 40 L38 -4", wall) + P("M-48 0 L0 -40 L48 0 Z", roof) + R(-10, 14, 20, 26, 3, door) + R(18, 6, 12, 12, 2, C.sky);
const wrench = (fill = C.stone) =>
  P("M-6 -34 Q-22 -40 -30 -26 L-20 -18 L-26 -10 L-36 -16 Q-40 2 -22 6 L22 44 Q30 50 36 44 Q42 38 36 30 L-2 -8 Q4 -26 -6 -34 Z", fill);
const drop = (fill = C.dark) => P("M0 -36 Q26 0 26 14 Q26 36 0 36 Q-26 36 -26 14 Q-26 0 0 -36 Z", fill);
const tire = () => O(0, 0, 38, C.dark) + O(0, 0, 18, C.stone) + O(0, 0, 6, C.light) + L("M0 -38 L0 -28 M0 28 L0 38 M-38 0 L-28 0 M28 0 L38 0", C.light, 4);
const book = (fill = C.main) => P("M-40 -26 Q-20 -32 0 -24 L0 30 Q-20 22 -40 28 Z", fill) + P("M40 -26 Q20 -32 0 -24 L0 30 Q20 22 40 28 Z", C.white);
const pencil = () => at(0, 0, 1, R(-7, -36, 14, 56, 2, C.goldLight) + P("M-7 20 L0 36 L7 20 Z", C.light) + R(-7, -42, 14, 8, 2, C.main));
const person = (fill = C.main, skin = "#d6a77a") => O(0, -26, 12, skin) + P("M-22 30 L-20 0 Q-18 -12 0 -12 Q18 -12 20 0 L22 30 Z", fill);
const diya = () =>
  P("M-30 6 Q-28 26 0 26 Q28 26 30 6 Z", C.main) + P("M-30 6 L30 6", "none") + P("M0 -2 Q-10 -16 0 -34 Q10 -16 0 -2 Z", C.goldLight) + `<path d="M0 -8 Q-4 -16 0 -24 Q4 -16 0 -8Z" fill="${C.main}"/>`;
const kalash = () =>
  P("M-24 -6 Q-34 20 -16 34 L16 34 Q34 20 24 -6 Z", C.gold) + R(-18, -14, 36, 10, 3, C.main) +
  P("M-14 -16 Q-26 -30 -32 -22 M0 -16 Q0 -34 -6 -40 M14 -16 Q26 -30 32 -22", "none") + O(0, -26, 10, "#a16207") + L("M-16 10 L16 10", C.brand, 4);
const flame = (fill = C.main) => P("M0 34 Q-28 30 -26 6 Q-24 -10 -10 -22 Q-8 -6 0 -4 Q-2 -24 10 -38 Q26 -18 26 6 Q26 30 0 34 Z", fill) + P("M0 30 Q-12 26 -10 14 Q-8 4 0 -2 Q10 8 10 16 Q10 28 0 30 Z", C.goldLight);
const camera = () => R(-40, -22, 80, 52, 10, C.dark) + R(-18, -32, 24, 12, 4, C.stone) + O(0, 4, 18, C.sky) + O(0, 4, 8, C.dark) + O(28, -12, 4, C.goldLight);
const bulb = () => P("M-22 -6 Q-22 -34 0 -34 Q22 -34 22 -6 Q22 8 10 18 L-10 18 Q-22 8 -22 -6 Z", C.goldLight) + R(-10, 18, 20, 14, 3, C.stone) + L("M-8 -6 L0 4 L8 -6", C.main, 4);
const mic = () => R(-12, -38, 24, 40, 12, C.dark) + L("M-22 -6 Q-22 18 0 18 Q22 18 22 -6 M0 18 L0 32 M-14 34 L14 34");
const hand = (fill = "#d6a77a") =>
  P("M-22 36 L-24 0 Q-26 -10 -18 -10 Q-12 -10 -12 0 L-12 -26 Q-12 -34 -5 -34 Q2 -34 2 -26 L2 -30 Q2 -38 9 -38 Q16 -38 16 -30 L16 -24 Q16 -32 22 -32 Q28 -32 28 -24 L28 10 Q28 32 10 36 Z", fill);
const plate = () => E(0, 14, 44, 14, C.gold) + E(0, 10, 32, 8, C.goldLight);
const note = () => L("M-10 24 L-10 -24 L20 -32 L20 16") + E(-18, 24, 10, 8, C.main) + E(12, 16, 10, 8, C.main);
const plane = (fill = C.white) =>
  P("M-44 0 Q-44 -6 -36 -6 L36 -6 Q48 -6 48 0 Q48 6 36 6 L-36 6 Q-44 6 -44 0 Z", fill) + P("M-2 -6 L-18 -34 L-8 -34 L16 -6 Z", C.main) + P("M-2 6 L-18 34 L-8 34 L16 6 Z", C.main) + P("M-36 -6 L-44 -20 L-36 -20 L-26 -6 Z", C.main);
const doc = (fill = C.white) => P("M-28 -38 L14 -38 L28 -24 L28 38 L-28 38 Z", fill) + P("M14 -38 L14 -24 L28 -24", C.light) + L("M-16 -14 L16 -14 M-16 0 L16 0 M-16 14 L6 14", C.stone, 4);
const shirt = (fill = C.main) => P("M-16 -34 Q0 -24 16 -34 L40 -22 L32 -4 L22 -8 L22 36 L-22 36 L-22 -8 L-32 -4 L-40 -22 Z", fill);
const bed = (fill = C.main) => R(-44, 0, 88, 20, 4, fill) + R(-44, -26, 14, 50, 4, C.brand) + R(-28, -10, 22, 12, 6, C.white) + L("M-44 24 L-44 34 M44 20 L44 34");
const building = (fill = C.light, w = 56, h = 80) => {
  let wins = "";
  for (let y = -h / 2 + 12; y < h / 2 - 14; y += 16) for (let x = -w / 2 + 10; x < w / 2 - 10; x += 16) wins += `<rect x="${x}" y="${y}" width="9" height="9" rx="1.5" fill="${C.sky}"/>`;
  return R(-w / 2, -h / 2, w, h, 4, fill) + wins;
};
const key = () => O(-22, 0, 16, C.gold) + O(-22, 0, 6, C.pale) + P("M-6 -5 L36 -5 L36 6 L30 6 L30 14 L22 14 L22 6 L-6 6 Z", C.gold);
const heart = (fill = C.main) => P("M0 30 Q-38 6 -38 -12 Q-38 -30 -20 -30 Q-6 -30 0 -16 Q6 -30 20 -30 Q38 -30 38 -12 Q38 6 0 30 Z", fill);
const star = (fill = C.gold, r = 30) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  });
  return P(`M${pts.join(" L")} Z`, fill);
};
const coin = (label = "$") => O(0, 0, 24, C.goldLight) + T(0, 11, label, 30, C.brand);
const shield = (fill = C.main) => P("M0 -38 L32 -26 Q32 16 0 38 Q-32 16 -32 -26 Z", fill) + L("M-12 0 L-2 10 L14 -10", C.white, 6);
const box = (fill = C.light) => P("M-36 -12 L0 -26 L36 -12 L36 28 L0 40 L-36 28 Z", fill) + L("M-36 -12 L0 2 L36 -12 M0 2 L0 40") + P("M-18 -19 L18 -5 L18 6", "none");
const truck = (fill = C.main) => R(-50, -24, 60, 40, 4, fill) + P("M10 -12 L32 -12 L46 4 L46 16 L10 16 Z", C.light) + P("M18 -6 L30 -6 L38 4 L18 4 Z", C.sky) + O(-30, 20, 10, C.dark) + O(30, 20, 10, C.dark);
const saree = (fill = C.main, border = C.gold) =>
  P("M-30 -36 Q-12 -40 0 -32 L30 36 L-34 36 Q-40 0 -30 -36 Z", fill) + L("M0 -32 L30 36", border, 8) + L("M-34 36 L30 36", border, 8) + P("M-30 -36 Q-50 -20 -44 6", "none");
const skirt = (fill = C.brand) => P("M-14 -30 L14 -30 L40 36 Q0 46 -40 36 Z", fill) + L("M-36 26 Q0 36 36 26", C.gold, 6) + R(-16, -40, 32, 12, 4, C.gold);
const glass = () => P("M-26 -34 L26 -34 L2 -4 L2 26 L16 34 L-16 34 L-2 26 L-2 -4 Z", C.sky) + O(14, -30, 7, C.leafLight);
const cake = () => R(-36, -4, 72, 36, 6, C.light) + R(-26, -26, 52, 24, 6, C.pale) + L("M-36 10 Q-24 20 -12 10 Q0 20 12 10 Q24 20 36 10", C.main, 5) + L("M0 -26 L0 -40", C.line, 4) + `<path d="M0 -40 Q-5 -48 0 -54 Q5 -48 0 -40Z" fill="${C.main}"/>`;
const envelope = () => R(-40, -26, 80, 54, 6, C.white) + L("M-40 -24 L0 6 L40 -24") + O(0, 6, 9, C.brand);
const laptop = (screen = C.sky) => R(-36, -32, 72, 48, 5, C.dark) + `<rect x="-29" y="-25" width="58" height="34" rx="2" fill="${screen}"/>` + P("M-46 20 L46 20 L40 30 L-40 30 Z", C.stone);
const sofa = (fill = C.main) => R(-44, -8, 88, 30, 8, fill) + R(-34, -28, 68, 26, 8, C.mid) + R(-52, -4, 16, 30, 6, fill) + R(36, -4, 16, 30, 6, fill) + L("M-40 26 L-40 34 M40 26 L40 34");
const scissors = () => O(-18, 22, 11, C.white) + O(18, 22, 11, C.white) + L("M-11 13 L22 -36 M11 13 L-22 -36", C.stone, 7) + L("M-11 13 L22 -36 M11 13 L-22 -36", C.line, 2);
const leaf = (fill = C.leaf) => P("M0 34 Q-34 10 -20 -24 Q-6 -36 18 -34 Q34 -6 14 20 Q8 28 0 34 Z", fill) + L("M0 34 Q4 0 14 -24", C.white, 3);
const pot = () => P("M-26 4 L26 4 L20 36 L-20 36 Z", C.main) + R(-30, -4, 60, 10, 3, C.brand);
const jar = (fill = C.main) => R(-24, -26, 48, 60, 10, fill) + R(-20, -38, 40, 14, 4, C.brand) + R(-16, -4, 32, 20, 3, C.white);
const calendar = () => R(-36, -30, 72, 64, 8, C.white) + `<path d="M-36 -22 Q-36 -30 -28 -30 L28 -30 Q36 -30 36 -22 L36 -10 L-36 -10 Z" fill="${C.main}" ${st}/>` + L("M-18 -38 L-18 -22 M18 -38 L18 -22");
const tag = (label = "$") => P("M-38 -20 L10 -20 L40 0 L10 20 L-38 20 Z", C.goldLight) + O(16, 0, 5, C.white) + T(-12, 11, label, 28, C.brand);
const chart = () => R(-36, -32, 72, 64, 6, C.white) + R(-24, 4, 12, 18, 2, C.mid) + R(-6, -8, 12, 30, 2, C.main) + R(12, -20, 12, 42, 2, C.brand);
const gavel = () => at(0, 0, 1, R(-30, -34, 40, 20, 5, "#a16207") + L("M-10 -16 L28 26", "#7c2d12", 8)) + R(-40, 26, 50, 10, 3, C.dark);
const briefcase = (fill = C.brand) => R(-40, -16, 80, 52, 8, fill) + P("M-14 -16 L-14 -28 L14 -28 L14 -16", "none") + L("M-40 6 L40 6", C.line, 4) + R(-6, 0, 12, 12, 2, C.goldLight);
const passport = () => R(-28, -38, 56, 76, 6, "#1e3a5f") + O(0, -6, 14, "none") + L("M-14 -6 L14 -6 M0 -20 Q-8 -6 0 8 Q8 -6 0 -20", C.goldLight, 3) + L("M-14 22 L14 22", C.goldLight, 4);
const flag = () => L("M-30 -36 L-30 38") + R(-30, -34, 58, 14, 0, "#f97316") + R(-30, -20, 58, 14, 0, C.white) + R(-30, -6, 58, 14, 0, "#16a34a") + O(-1, -13, 4, "#1e3a8a");
const dumbbell = () => R(-44, -16, 14, 32, 4, C.dark) + R(30, -16, 14, 32, 4, C.dark) + R(-54, -10, 10, 20, 3, C.stone) + R(44, -10, 10, 20, 3, C.stone) + R(-30, -5, 60, 10, 3, C.stone);
const bolt = (fill = C.goldLight) => P("M8 -40 L-24 6 L-2 6 L-10 40 L24 -8 L2 -8 Z", fill);
const paw = () => E(0, 14, 18, 15, C.main) + E(-22, -8, 8, 10, C.main) + E(22, -8, 8, 10, C.main) + E(-8, -24, 8, 10, C.main) + E(8, -24, 8, 10, C.main);
const cap = () => P("M0 -26 L44 -8 L0 10 L-44 -8 Z", C.dark) + P("M-24 2 L-24 20 Q0 32 24 20 L24 2", C.dark) + L("M44 -8 L44 16") + O(44, 20, 5, C.gold);
const trophy = () => P("M-24 -34 L24 -34 L22 -6 Q20 12 0 14 Q-20 12 -22 -6 Z", C.gold) + L("M-24 -26 Q-40 -26 -38 -12 Q-36 -2 -22 -4 M24 -26 Q40 -26 38 -12 Q36 -2 22 -4") + R(-6, 14, 12, 12, 2, C.gold) + R(-22, 26, 44, 10, 3, C.brand);
const dancer = (skirtFill = C.brand, pose = 0) =>
  O(0, -34, 9, "#d6a77a") + P("M-8 -24 L8 -24 L10 0 L-10 0 Z", C.main) + P("M-10 0 L10 0 L30 30 Q0 38 -30 30 Z", skirtFill) +
  L(pose === 0 ? "M-8 -20 L-30 -30 L-36 -42 M8 -20 L28 -10 L38 -18" : pose === 1 ? "M-8 -20 L-26 -40 M8 -20 L26 -40" : "M-8 -20 L-30 -12 M8 -20 L32 -26", C.line, 5) +
  L("M-10 30 L-14 40 M10 30 L14 40", C.line, 5);
const stroller = () => P("M-34 -26 Q-34 8 -4 8 L30 8 L30 -6 Q4 -6 -6 -30 Q-24 -36 -34 -26 Z", C.main) + L("M30 8 L38 -26 L46 -26 M-24 8 L-30 26 M22 8 L28 26") + O(-30, 30, 7, C.dark) + O(28, 30, 7, C.dark);
const broom = () => L("M24 -40 L-2 14", "#a16207", 7) + P("M-2 8 L14 18 L0 42 L-30 26 Z", C.goldLight) + L("M-20 22 L-10 38 M-10 18 L0 34", C.gold, 3);
const pan = () => O(-8, 4, 28, C.dark) + O(-8, 4, 20, C.stone) + R(18, -2, 32, 12, 5, "#a16207");
const chefHat = () => P("M-24 14 Q-40 10 -36 -8 Q-32 -22 -18 -18 Q-14 -34 0 -34 Q14 -34 18 -18 Q32 -22 36 -8 Q40 10 24 14 Z", C.white) + R(-24, 14, 48, 18, 3, C.white);
const tooth = (n, x0, y0, w, h, gap, fill) => Array.from({ length: n }, (_, i) => R(x0 + i * (w + gap), y0, w, h, 3, fill)).join("");


const I = {
  FOOD: {
    TIFFIN: at(80, 86, 1, R(-30, -40, 60, 22, 6, C.stone) + R(-30, -14, 60, 22, 6, C.mid) + R(-30, 12, 60, 22, 6, C.stone) + L("M-30 -46 Q0 -64 30 -46 M-36 -29 L-30 -29 M30 -29 L36 -29 M-36 23 L-30 23 M30 23 L36 23")),
    PARTY_ORDERS: at(80, 84, 1, R(-46, -10, 92, 34, 6, C.stone) + R(-38, -18, 76, 14, 4, C.light) + L("M-28 -24 Q-32 -34 -28 -42 M0 -24 Q-4 -34 0 -42 M28 -24 Q24 -34 28 -42", C.mid, 4) + L("M-46 30 L-54 40 M46 30 L54 40")),
    BIRYANI: at(80, 84, 1, P("M-44 0 Q-44 36 0 36 Q44 36 44 0 Z", C.brand) + P("M-44 0 Q0 -22 44 0 Z", C.goldLight) + O(-14, -6, 5, C.main) + O(10, -8, 5, C.leaf) + O(22, -2, 4, C.main) + L("M-50 0 L50 0") + L("M-20 -24 Q-24 -34 -20 -44 M6 -26 Q2 -36 6 -46", C.mid, 4)),
    SOUTH_INDIAN: at(80, 86, 1, P("M-46 10 Q0 30 46 10 Q0 -4 -46 10 Z", C.light) + P("M-34 4 Q-6 -46 30 -2", C.goldLight) + E(-10, 12, 14, 6, C.white) + E(16, 14, 12, 5, C.white) + O(30, 20, 7, C.leafLight)),
    THALI: at(80, 84, 1, O(0, 0, 46, C.stone) + O(0, 0, 38, C.white) + O(-16, -14, 11, C.goldLight) + O(14, -16, 11, C.main) + O(18, 12, 11, C.leafLight) + E(-12, 16, 16, 10, C.pale)),
    SNACKS: at(80, 86, 1, P("M-40 24 L-20 -32 L0 24 Z", C.gold) + P("M-4 26 L20 -26 L44 26 Z", C.goldLight) + L("M-28 0 L-12 0 M10 4 L30 4", C.main, 3)),
    SWEETS: at(80, 86, 1, E(0, 22, 46, 10, C.stone) + O(-22, 4, 14, C.gold) + O(6, 4, 14, C.goldLight) + O(-8, -18, 14, C.main) + O(26, -10, 10, C.pale) + `<circle cx="-22" cy="0" r="2.5" fill="${C.white}"/><circle cx="-8" cy="-22" r="2.5" fill="${C.white}"/>`),
    BAKERY: at(80, 92, 1, cake()),
  },
  TUTORING: {
    MATH: at(80, 80, 1, R(-40, -40, 80, 80, 12, C.white) + T(-18, -6, "+", 36, C.brand) + T(20, -6, "−", 36, C.main) + T(-18, 34, "×", 36, C.main) + T(20, 34, "÷", 36, C.brand)),
    SCIENCE: at(80, 84, 1, P("M-12 -40 L12 -40 M-8 -40 L-8 -10 L-34 30 Q-38 38 -28 38 L28 38 Q38 38 34 30 L8 -10 L8 -40", C.white) + P("M-22 14 L22 14 L32 30 Q34 34 28 34 L-28 34 Q-34 34 -32 30 Z", C.leafLight) + O(-4, 24, 3, C.white) + O(10, 18, 4, C.white)),
    CODING: at(80, 80, 1, laptop(C.dark) + L("M-14 -16 L-22 -8 L-14 0 M14 -16 L22 -8 L14 0 M4 -18 L-4 2", C.leafLight, 4)),
    TEST_PREP: at(80, 80, 1, doc() + L("M-14 -14 L-10 -10 L-2 -18", C.leaf, 4) + at(22, 22, 0.6, pencil(), 35)),
    ABACUS: at(80, 80, 1, R(-42, -36, 84, 72, 6, "none") + L("M-42 -14 L42 -14 M-42 8 L42 8 M-42 30 L42 30", C.stone, 3) + [-14, 8, 30].map((y, r) => [0, 1, 2, 3].map((i) => O(-30 + i * 14 + (r % 2) * 24, y, 7, [C.main, C.gold, C.brand][r])).join("")).join("") + L("M-42 -36 L-42 36 M42 -36 L42 36", "#a16207", 7)),
    READING: at(80, 84, 1, book()),
    INDIAN_LANGUAGES: at(80, 80, 1, R(-42, -34, 84, 64, 12, C.white) + T(-16, 14, "अ", 40, C.brand) + T(18, 14, "అ", 36, C.main) + P("M-14 30 L-22 42 L0 30", C.white)),
    SHLOKAS: at(80, 84, 1, book(C.main) + T(-20, 10, "ॐ", 26, C.brand) + L("M8 -8 L32 -10 M8 4 L32 2 M8 16 L28 14", C.stone, 3)),
    COMPETITIONS: at(80, 84, 1, trophy()),
    COLLEGE: at(80, 84, 1, cap()),
  },
  DANCE_MUSIC: {
    BHARATANATYAM: at(80, 88, 1, dancer(C.brand, 0)),
    KUCHIPUDI: at(80, 82, 1, dancer(C.main, 1) + E(0, 44, 26, 6, C.gold)),
    KATHAK: at(80, 86, 1, dancer(C.mid, 2) + L("M-34 16 Q-44 28 -34 40 M34 16 Q44 28 34 40", C.gold, 4)),
    ODISSI: at(80, 88, 1, dancer(C.leaf, 0) + P("M-10 -42 Q0 -60 10 -42", C.gold)),
    KATHAKALI: at(80, 86, 1, P("M-40 -10 Q0 -64 40 -10 Z", C.gold) + O(0, 8, 26, C.leafLight) + E(-10, 4, 6, 3, C.white) + E(10, 4, 6, 3, C.white) + L("M-8 20 Q0 26 8 20", "#dc2626", 4) + P("M-30 26 Q0 50 30 26", C.white)),
    BOLLYWOOD: at(80, 86, 1, dancer(C.brand, 1) + spark(-34, -36, 9) + spark(36, -30, 7, C.main)),
    CARNATIC: at(80, 84, 1, at(8, -6, 1, R(-38, -7, 76, 14, 6, "#a16207"), -38) + O(-24, 20, 24, "#a16207") + O(-24, 20, 10, C.gold) + O(34, -34, 11, C.gold) + L("M-14 8 L30 -28", C.goldLight, 2)),
    HINDUSTANI: at(80, 82, 1, mic() + at(30, -24, 0.5, note())),
    INSTRUMENTS: at(80, 84, 1, L("M-36 36 L36 -36", "#a16207", 10) + [-20, -6, 8, 22].map((t) => O(-t, t, 3.5, C.dark)).join("") + at(26, 16, 0.5, note())),
    PERCUSSION: at(80, 88, 1, E(-22, -12, 20, 8, C.light) + P("M-42 -12 L-38 26 Q-22 34 -6 26 L-2 -12", C.main) + E(22, -6, 22, 8, C.light) + P("M0 -6 Q-4 22 8 30 Q22 36 36 30 Q48 22 44 -6", C.brand) + O(-22, -12, 6, C.dark) + O(22, -6, 6, C.dark)),
    KEYBOARD: at(80, 84, 1, R(-46, -22, 92, 50, 6, C.white) + L("M-30 -22 L-30 28 M-14 -22 L-14 28 M2 -22 L2 28 M18 -22 L18 28 M34 -22 L34 28", C.stone, 3) + tooth(5, -26, -22, 8, 28, 8, C.dark)),
  },
  PUJARI: {
    GRIHA_PRAVESH: at(80, 90, 1, house(C.brand) + at(0, -14, 0.36, kalash())),
    SATYANARAYANA: at(80, 82, 1, plate() + at(0, -8, 0.6, kalash()) + at(-30, 0, 0.4, diya()) + at(30, 0, 0.4, diya())),
    WEDDING: at(80, 84, 1, O(-14, 6, 22, "none") + O(14, 6, 22, "none") + L("M-14 6 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0", C.gold, 7) + L("M14 6 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0", C.gold, 7) + star(C.sky, 10).replace("<path", `<path transform="translate(-14 -18)"`)),
    HOMAM: at(80, 84, 1, P("M-40 20 L40 20 L30 38 L-30 38 Z", C.brand) + R(-44, 12, 88, 10, 2, C.main) + at(0, -10, 0.8, flame())),
    BABY_CEREMONIES: at(80, 86, 1, P("M-40 -6 Q-40 30 0 30 Q40 30 40 -6 Z", C.mid) + O(-8, -10, 14, "#d6a77a") + P("M-30 -6 Q-8 -20 30 -6", C.pale) + L("M-30 30 L-36 40 M30 30 L36 40") + spark(30, -32, 9)),
    UPANAYANAM: at(80, 82, 1, person(C.white) + L("M-12 -10 L18 26", C.gold, 5) + L("M-24 30 L24 30", C.main, 6)),
    LAST_RITES: at(80, 88, 1, P("M0 -40 Q16 -20 0 0 Q-16 -20 0 -40 Z", C.pale) + P("M0 0 Q-34 -6 -40 -24 Q-14 -24 0 0 Z", C.light) + P("M0 0 Q34 -6 40 -24 Q14 -24 0 0 Z", C.light) + E(0, 22, 40, 10, C.sky) + L("M0 0 L0 12")),
    VEHICLE_PUJA: at(80, 92, 1, car(C.mid) + L("M-40 -14 Q-20 6 0 -14 Q20 6 40 -14", C.gold, 5) + [-30, -15, 0, 15, 30].map((x) => O(x, x % 30 ? -4 : -8, 4, C.main)).join("")),
    ASTROLOGY: at(80, 80, 1, O(0, 0, 40, "#1e3a5f") + star(C.goldLight, 14).replace("<path", `<path transform="translate(-12 -10)"`) + O(16, 14, 8, C.mid) + spark(18, -18, 6, C.white) + spark(-18, 22, 5, C.white)),
    ONLINE_PUJA: at(80, 80, 1, laptop(C.pale) + at(0, -6, 0.5, diya())),
  },
  EVENT_SERVICES: {
    PHOTOGRAPHY: at(80, 84, 1, camera()),
    VIDEOGRAPHY: at(80, 84, 1, R(-44, -22, 60, 44, 8, C.dark) + P("M16 -10 L44 -26 L44 26 L16 10 Z", C.stone) + O(-14, 0, 12, C.sky) + O(-34, -14, 4, "#ef4444")),
    DJ: at(80, 84, 1, R(-46, -28, 92, 56, 8, C.dark) + O(-20, 0, 18, C.stone) + O(-20, 0, 5, C.dark) + O(22, 0, 18, C.stone) + O(22, 0, 5, C.dark) + L("M-20 0 L-6 -14", C.goldLight, 3)),
    BARTENDING: at(80, 84, 1, glass()),
    DECOR: at(80, 84, 1, L("M-40 -36 L-40 38 M40 -36 L40 38", "#a16207", 7) + P("M-46 -36 L46 -36", "none") + L("M-40 -30 Q0 6 40 -30", C.gold, 5) + [-28, -14, 0, 14, 28].map((x) => O(x, -30 + Math.abs(x) * 0.4 + (x === 0 ? 30 : 18), 6, x % 28 ? C.main : C.goldLight)).join("")),
    LIGHTING: at(80, 80, 1, bulb() + L("M-36 -30 L-46 -38 M36 -30 L46 -38 M-40 0 L-52 0 M40 0 L52 0", C.gold, 4)),
    MAKEUP: at(80, 84, 1, at(-14, 0, 1, R(-10, -6, 20, 44, 3, C.dark) + P("M-10 -6 L-10 -26 Q0 -40 10 -26 L10 -6 Z", C.brand)) + at(22, 0, 1, L("M0 40 L0 -4", "#a16207", 7) + P("M-8 -4 Q-10 -30 0 -40 Q10 -30 8 -4 Z", C.light))),
    MEHNDI: at(80, 84, 1, hand("#c08457") + O(2, 6, 8, "none").replace(C.line, "#7c2d12") + L("M-6 -14 Q2 -20 10 -14 M-14 20 Q0 28 14 20", "#7c2d12", 3)),
    DHOL: at(80, 84, 1, at(0, 0, 1, E(-34, 0, 10, 28, C.light) + P("M-34 -28 L34 -28 L34 28 L-34 28", C.main) + E(34, 0, 10, 28, C.light) + L("M-28 -28 L-10 28 M-10 -28 L10 28 M10 -28 L28 28", C.gold, 3)) + L("M44 -24 L54 -42", "#a16207", 5)),
    LIVE_MUSIC: at(80, 84, 1, P("M-10 -6 Q-34 -10 -32 14 Q-30 36 -6 32 Q14 36 18 16 Q22 2 6 -2 L30 -40 L36 -36 L12 2", C.main) + O(-12, 14, 6, C.dark)),
    MC: at(80, 84, 1, mic() + L("M-34 -30 Q-44 -14 -34 2 M34 -30 Q44 -14 34 2", C.main, 4)),
    CHOREOGRAPHY: at(80, 84, 1, at(-18, 0, 0.8, dancer(C.brand, 1)) + at(20, 4, 0.8, dancer(C.main, 2))),
    PLANNING: at(80, 84, 1, R(-32, -36, 64, 76, 6, C.white) + R(-14, -42, 28, 12, 4, C.stone) + L("M-18 -12 L-12 -6 L-2 -18 M-18 10 L-12 16 L-2 4", C.leaf, 4) + L("M6 -12 L20 -12 M6 10 L20 10 M-18 28 L20 28", C.stone, 4)),
    PHOTO_BOOTH: at(80, 84, 1, R(-36, -40, 72, 80, 6, C.brand) + R(-26, -30, 52, 28, 3, C.white) + R(-26, 2, 52, 28, 3, C.white) + O(0, -16, 7, C.mid) + O(0, 16, 7, C.mid)),
    RENTALS: at(80, 86, 1, P("M-46 6 L0 -34 L46 6 Z", C.white) + L("M-40 6 L-40 36 M40 6 L40 36 M0 -34 L0 36") + P("M-46 6 L46 6", "none") + L("M-46 6 Q-34 16 -23 6 Q-12 16 0 6 Q12 16 23 6 Q34 16 46 6", C.main, 5)),
    CATERING: at(80, 88, 1, P("M-42 14 Q-42 -28 0 -28 Q42 -28 42 14 Z", C.stone) + O(0, -32, 6, C.dark) + R(-50, 14, 100, 10, 4, C.light) + L("M-24 2 Q-20 -14 -6 -18", C.white, 4)),
    CAKES: at(80, 92, 1, cake()),
    INVITATIONS: at(80, 84, 1, envelope()),
  },
  DOMESTIC_HELP: {
    NANNY: at(80, 86, 1, stroller()),
    COOK: at(80, 84, 1, at(0, -14, 0.8, chefHat()) + at(0, 28, 0.6, pan())),
    ELDER_CARE: at(80, 84, 1, heart(C.main) + at(0, 0, 0.5, hand(C.pale))),
    POSTPARTUM: at(80, 84, 1, R(-14, -26, 28, 58, 10, C.white) + R(-10, -36, 20, 12, 4, C.sky) + P("M-6 -36 Q0 -50 6 -36", C.light) + L("M-14 -4 L14 -4 M-14 10 L14 10", C.stone, 3) + at(32, -22, 0.4, heart())),
    CLEANING: at(80, 84, 1, broom() + spark(-30, -26, 8, C.sky) + spark(30, -32, 6, C.sky)),
    PET_CARE: at(80, 84, 1, paw()),
  },
  HOME_SERVICES: {
    ELECTRICAL: at(80, 80, 1, bolt()),
    PLUMBING: at(80, 84, 1, L("M-40 -20 L4 -20 Q20 -20 20 -4 L20 14", C.stone, 14) + L("M-40 -20 L4 -20 Q20 -20 20 -4 L20 14", C.line, 2) + R(-46, -32, 12, 24, 3, C.stone) + at(20, 30, 0.4, drop(C.sky))),
    HVAC: at(80, 80, 1, O(0, 0, 40, C.white) + L("M0 -28 L0 28 M-24 -14 L24 14 M-24 14 L24 -14", C.sky, 6) + O(0, 0, 8, C.main)),
    HANDYMAN: at(80, 84, 1, R(-44, -8, 88, 42, 6, C.brand) + P("M-18 -8 L-18 -24 L18 -24 L18 -8", "none") + L("M-44 8 L44 8", C.line, 4) + R(-8, 2, 16, 12, 2, C.goldLight)),
    PAINTING: at(80, 84, 1, R(-40, -40, 70, 26, 8, C.main) + L("M30 -27 L42 -27 L42 -4 L4 -4 L4 10") + R(-2, 10, 12, 32, 4, C.dark)),
    ROOFING: at(80, 88, 1, P("M-50 14 L0 -34 L50 14 Z", C.brand) + L("M-34 -2 L34 -2 M-18 -18 L18 -18", C.mid, 4) + L("M-44 14 L-44 30 L44 30 L44 14", C.stone, 6)),
    FLOORING: at(80, 80, 1, R(-40, -40, 80, 80, 6, C.light) + L("M-40 0 L40 0 M0 -40 L0 40", C.line, 4) + R(-40, -40, 40, 40, 6, C.mid).replace(`rx="6"`, `rx="0"`) + R(0, 0, 40, 40, 0, C.mid)),
    LANDSCAPING: at(80, 86, 1, L("M-44 30 Q0 22 44 30", C.leaf, 8) + at(-14, -6, 0.9, leaf()) + at(22, 2, 0.6, leaf(C.leafLight), 30)),
    PEST_CONTROL: at(80, 82, 1, E(0, 6, 18, 24, C.dark) + O(0, -24, 10, C.dark) + L("M-18 -4 L-36 -14 M-18 10 L-38 10 M-16 24 L-34 34 M18 -4 L36 -14 M18 10 L38 10 M16 24 L34 34 M-6 -32 L-14 -44 M6 -32 L14 -44") + O(0, 0, 46, "none").replace(C.line, "#dc2626") + L("M-32 -32 L32 32", "#dc2626", 6)),
    REMODELING: at(80, 84, 1, R(-38, -10, 76, 46, 4, C.pale) + L("M-38 6 L38 6 M-38 20 L38 20 M-10 -10 L-10 6 M14 6 L14 20 M-22 20 L-22 36", C.mid, 3) + at(16, -26, 0.8, R(-24, -10, 30, 16, 4, C.stone) + L("M-4 6 L-4 30", "#a16207", 7))),
    PAVERS: at(80, 82, 1, [0, 1, 2].map((r) => [0, 1, 2].map((c) => R(-42 + c * 28 + (r % 2 ? 14 : 0) - (r % 2 ? 14 : 0), -36 + r * 26, 26, 22, 4, (r + c) % 2 ? C.light : C.mid)).join("")).join("")),
    APPLIANCE: at(80, 80, 1, R(-34, -40, 68, 80, 8, C.white) + O(0, 10, 20, C.sky) + O(0, 10, 12, "none") + O(-20, -28, 4, C.main) + O(-8, -28, 4, C.gold)),
    ASSEMBLY: at(80, 84, 1, R(-42, -36, 84, 52, 6, C.dark) + `<rect x="-36" y="-30" width="72" height="40" rx="2" fill="${C.sky}"/>` + L("M-20 34 L20 34 M0 16 L0 34") + at(34, 26, 0.6, L("M-20 20 L20 -20", C.stone, 10) + L("M-20 20 L20 -20", C.line, 2))),
    SMART_HOME: at(80, 88, 1, L("M-40 -12 Q0 -46 40 -12", C.main, 7) + L("M-26 2 Q0 -22 26 2", C.main, 7) + L("M-12 16 Q0 6 12 16", C.main, 7) + O(0, 30, 6, C.brand)),
    MOVING: at(80, 86, 1, truck() + at(-22, -6, 0.32, box())),
  },
  AUTO: {
    MECHANIC: at(80, 92, 1, car(C.mid)) + at(110, 52, 0.55, wrench(), 45),
    OIL_CHANGE: at(80, 82, 1, drop(C.goldLight) + `<path d="M-10 4 Q-14 18 -2 24" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round"/>`),
    TIRES: at(80, 80, 1, tire()),
    BRAKES: at(80, 82, 1, R(-40, -24, 80, 54, 6, C.dark) + R(-30, -34, 14, 10, 2, C.stone) + R(16, -34, 14, 10, 2, C.stone) + T(-18, 10, "+", 30, C.goldLight) + T(18, 10, "−", 30, C.goldLight)),
    BODY_SHOP: at(76, 94, 1, car(C.mid)) + at(118, 46, 0.6, R(-16, -10, 22, 28, 5, C.stone) + L("M6 -2 L26 -10 M6 8 L26 16", C.line, 4) + L("M-16 18 L-24 38", C.line, 6)),
    COLLISION: at(80, 94, 1, car(C.mid) + L("M44 -20 L36 -10 L46 -4 L38 6", C.white, 5) + L("M44 -20 L36 -10 L46 -4 L38 6", C.line, 2)) + spark(130, 48, 10, C.gold) + spark(120, 30, 6, C.main),
    DETAILING: at(80, 96, 1, car(C.main)) + O(46, 50, 10, C.sky) + O(64, 38, 6, C.sky) + spark(118, 42, 10, C.white) + spark(104, 28, 6, C.goldLight),
    WINDSHIELD: at(80, 84, 1, P("M-46 30 L-34 -26 Q-32 -34 -22 -34 L22 -34 Q32 -34 34 -26 L46 30 Z", C.sky) + L("M-20 22 L6 -12", C.white, 4) + L("M-10 30 L14 0", C.white, 4) + L("M-46 30 L46 30", C.dark, 6)),
    TOWING: at(86, 92, 1, R(-44, -14, 50, 30, 4, C.main) + P("M6 -26 L26 -26 L40 -8 L40 16 L6 16 Z", C.light) + P("M12 -20 L24 -20 L32 -8 L12 -8 Z", C.sky) + L("M-40 -14 L-56 -38 L-64 -20", C.line, 5) + O(-26, 18, 9, C.dark) + O(26, 18, 9, C.dark)),
    CAR_SALES: at(72, 96, 0.9, car(C.main)) + at(114, 46, 0.6, tag()),
    CAR_BUYING: at(70, 96, 0.9, car(C.mid)) + at(116, 50, 0.6, key(), -30),
    DRIVING_LESSONS: at(80, 82, 1, O(0, 0, 40, C.white) + O(0, 0, 40, "none") + O(0, 0, 10, C.dark) + L("M-10 0 L-38 0 M10 0 L38 0 M0 10 L0 38", C.dark, 7)) + at(122, 120, 0.5, R(-24, -24, 48, 48, 6, C.white) + T(0, 14, "L", 40, "#dc2626")),
  },
  BEAUTY: {
    THREADING: at(80, 80, 1, P("M-40 -6 Q-20 -30 0 -18", "none") + L("M-40 -4 Q-20 -28 4 -16", C.dark, 8) + L("M10 -16 Q26 -26 40 -12", C.dark, 8) + E(-18, 14, 14, 9, C.white) + O(-18, 14, 5, C.dark) + E(22, 14, 14, 9, C.white) + O(22, 14, 5, C.dark) + L("M-40 40 L40 -40", C.main, 2)),
    FACIALS: at(80, 82, 1, E(0, 0, 32, 40, "#d6a77a") + O(-12, -6, 8, C.leafLight) + O(12, -6, 8, C.leafLight) + L("M-10 18 Q0 24 10 18") + spark(34, -34, 8, C.white)),
    BRIDAL_MAKEUP: at(80, 86, 1, P("M-36 10 L-36 -24 L-18 -6 L0 -34 L18 -6 L36 -24 L36 10 Z", C.gold) + R(-38, 10, 76, 14, 3, C.goldLight) + O(0, -12, 5, "#dc2626")),
    MEHNDI: at(80, 84, 1, hand("#c08457") + L("M-6 -14 Q2 -20 10 -14 M-14 20 Q0 28 14 20", "#7c2d12", 3) + O(2, 6, 7, "none")),
    HAIRCUT: at(80, 82, 1, scissors() + at(30, -20, 0.6, R(-6, -30, 12, 60, 3, C.mid))),
    NAILS: at(80, 84, 1, R(-14, -10, 28, 46, 6, C.brand) + R(-8, -24, 16, 14, 2, C.dark) + R(-5, -44, 10, 20, 3, C.dark)),
    SAREE_DRAPING: at(80, 84, 1, saree(C.brand, C.gold)),
    YOGA: at(80, 86, 1, O(0, -32, 10, "#d6a77a") + P("M-10 -20 L10 -20 L12 8 L-12 8 Z", C.main) + P("M-12 8 Q-40 10 -40 22 Q-20 30 0 24 Q20 30 40 22 Q40 10 12 8 Z", C.mid) + L("M-10 -16 L-30 0 M10 -16 L30 0", C.line, 5)),
    FITNESS: at(80, 80, 1, dumbbell(), -20),
  },
  ROOM_RENTAL: {
    PRIVATE_ROOM: at(80, 86, 1, bed()) + at(118, 40, 0.42, key()),
    SHARED_ROOM: at(56, 84, 0.6, bed(C.main)) + at(108, 96, 0.6, bed(C.mid)),
    PAYING_GUEST: at(72, 92, 0.9, bed()) + at(118, 44, 0.42, plate() + O(0, 0, 14, C.goldLight)),
    ENTIRE_APARTMENT: at(80, 80, 1, building(C.light, 64, 88)),
    CONDO: at(80, 80, 1, building(C.mid, 46, 100) + at(36, 22, 0.6, building(C.light, 40, 70))),
    TOWNHOUSE: at(46, 88, 0.55, house(C.brand)) + at(80, 88, 0.55, house(C.main)) + at(114, 88, 0.55, house(C.mid)),
    HOUSE: at(80, 88, 1, house(C.brand)),
    IN_LAW: at(80, 84, 1, R(-44, -36, 88, 40, 4, C.white) + P("M-44 4 L44 4", "none") + R(-44, 4, 88, 34, 4, C.light) + L("M-30 4 L-30 14 L-18 14 L-18 24 L-6 24 L-6 38", C.brand, 4) + R(12, 10, 18, 28, 2, C.main)),
  },
  REALTOR: {
    BUYING: at(80, 92, 1, house(C.brand)) + at(116, 44, 0.5, key()),
    SELLING: at(66, 96, 0.8, house(C.main)) + at(114, 50, 1, L("M-18 -26 L-18 40", "#a16207", 5) + R(-18, -24, 36, 22, 3, C.white) + T(0, -7, "SOLD", 11, "#dc2626")),
    FIRST_TIME: at(80, 92, 1, house(C.mid)) + at(116, 42, 0.5, heart(C.brand)),
    NEW_CONSTRUCTION: at(80, 86, 1, L("M-36 40 L-36 -6 L0 -36 L36 -6 L36 40 M-36 -6 L36 -6 M-36 16 L36 16 M-12 -6 L-12 40 M12 -6 L12 40", "#a16207", 5)),
    INVESTMENT: at(80, 80, 1, chart() + L("M-24 -2 L-6 -14 L8 -6 L28 -28 M18 -28 L28 -28 L28 -18", C.leaf, 5)),
    RENTALS: at(80, 86, 1, calendar() + at(0, 12, 0.5, key())),
    PROPERTY_MGMT: at(80, 84, 1, R(-32, -36, 64, 76, 6, C.white) + R(-14, -42, 28, 12, 4, C.stone) + at(0, 6, 0.44, house(C.brand))),
    COMMERCIAL: at(80, 80, 1, building(C.stone, 80, 76) + R(-12, 18, 24, 20, 2, C.main)),
    RELOCATION: at(76, 98, 0.7, house(C.main)) + at(110, 48, 0.6, plane(), -25),
  },
  LEGAL: {
    IMMIGRATION: at(80, 82, 1, passport()),
    FAMILY: at(54, 88, 0.8, person(C.brand)) + at(104, 88, 0.8, person(C.main)) + at(80, 104, 0.5, person(C.goldLight)),
    ESTATE: at(80, 82, 1, P("M-30 -36 L30 -36 L30 30 Q30 40 20 40 L-30 40 Z", C.white) + R(-36, -42, 72, 12, 6, C.light) + L("M-18 -16 L18 -16 M-18 -2 L18 -2 M-18 12 L6 12", C.stone, 4) + O(18, 26, 9, "#dc2626")),
    REAL_ESTATE: at(70, 84, 1, doc()) + at(108, 104, 0.5, house(C.brand)),
    BUSINESS: at(80, 86, 1, briefcase()),
    EMPLOYMENT: at(80, 82, 1, R(-30, -38, 60, 76, 8, C.white) + R(-10, -44, 20, 10, 3, C.stone) + O(0, -10, 12, "#d6a77a") + P("M-20 26 Q-20 8 0 8 Q20 8 20 26 Z", C.main)),
    TAX: at(80, 82, 1, doc() + T(6, 30, "%", 26, C.brand)),
    CRIMINAL: at(80, 84, 1, gavel()),
    PERSONAL_INJURY: at(80, 80, 1, R(-40, -14, 80, 28, 14, C.goldLight) + R(-16, -14, 32, 28, 0, C.light) + `<circle cx="-6" cy="-5" r="2.5" fill="${C.line}"/><circle cx="6" cy="5" r="2.5" fill="${C.line}"/><circle cx="6" cy="-5" r="2.5" fill="${C.line}"/><circle cx="-6" cy="5" r="2.5" fill="${C.line}"/>`, -35),
    BANKRUPTCY: at(80, 84, 1, E(0, 0, 40, 30, C.light) + O(24, -8, 4, C.line) + R(-8, -36, 16, 8, 2, C.dark) + L("M-4 -30 L4 -10 L-6 4 L4 26", C.line, 4) + L("M-30 22 L-30 34 M24 22 L24 34", C.line, 6)),
    IP: at(80, 80, 1, bulb() + T(0, -1, "©", 22, C.brand)),
    NRI: at(70, 90, 0.8, house(C.main)) + at(116, 56, 0.6, flag()),
  },
  TAX_FINANCE: {
    TAX_FILING: at(80, 82, 1, doc() + L("M-12 26 L-4 32 L14 16", C.leaf, 5)),
    ITIN: at(80, 82, 1, R(-44, -28, 88, 56, 8, C.white) + O(-22, -2, 10, "#d6a77a") + P("M-36 20 Q-36 8 -22 8 Q-8 8 -8 20 Z", C.main) + L("M4 -10 L32 -10 M4 4 L32 4 M4 16 L22 16", C.stone, 4)),
    FBAR: at(80, 84, 1, P("M-40 -10 L0 -34 L40 -10 Z", C.light) + L("M-28 -6 L-28 26 M-10 -6 L-10 26 M10 -6 L10 26 M28 -6 L28 26", C.stone, 7) + R(-44, 26, 88, 10, 2, C.main)) + at(118, 44, 0.42, flag()),
    BOOKKEEPING: at(80, 82, 1, R(-32, -40, 64, 80, 8, C.dark) + `<rect x="-24" y="-32" width="48" height="18" rx="2" fill="${C.leafLight}"/>` + [0, 1, 2].map((r) => [0, 1, 2].map((c) => R(-24 + c * 18, -6 + r * 15, 12, 10, 2, c === 2 && r === 2 ? C.main : C.stone)).join("")).join("")),
    BUSINESS_TAX: at(80, 86, 1, briefcase(C.main) + T(0, 30, "%", 22, C.white)),
    MORTGAGE: at(76, 92, 0.9, house(C.brand)) + at(118, 46, 0.6, coin()),
    INSURANCE: at(80, 80, 1, shield()),
  },
  TRAVEL: {
    TICKETS: at(80, 82, 1, P("M-46 -24 L46 -24 L46 -8 Q38 -8 38 0 Q38 8 46 8 L46 24 L-46 24 L-46 8 Q-38 8 -38 0 Q-38 -8 -46 -8 Z", C.white) + L("M-16 -24 L-16 24", C.stone, 3) + at(16, 0, 0.45, plane(C.main))),
    TOURS: at(80, 86, 1, P("M-48 32 L-14 -22 L6 8 L20 -10 L48 32 Z", C.mid) + P("M-14 -22 L-22 -10 L-14 -6 L-6 -10 Z", C.white) + O(30, -30, 10, C.goldLight)),
    COMPANION: at(56, 96, 0.7, person(C.main)) + at(84, 96, 0.7, person(C.stone)) + at(104, 52, 0.55, plane(), -20),
    VISA: at(80, 82, 1, passport()) + at(116, 112, 0.5, O(0, 0, 30, C.white) + L("M-12 0 L-2 10 L14 -10", C.leaf, 8)),
    AIRPORT: at(72, 100, 0.85, car(C.goldLight)) + at(104, 46, 0.6, plane(), -20),
    NOTARY: at(70, 82, 1, doc()) + at(108, 104, 0.7, R(-22, 8, 44, 14, 4, C.brand) + R(-8, -24, 16, 34, 6, C.dark)),
  },
  ART: {
    PAINTINGS: at(80, 82, 1, R(-42, -36, 84, 70, 4, C.gold) + `<rect x="-32" y="-26" width="64" height="50" fill="${C.pale}"/>` + P("M-32 24 L-10 -4 L4 12 L14 2 L32 24 Z", C.main) + O(16, -12, 6, C.brand)),
    RANGOLI: at(80, 80, 1, [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<g transform="rotate(${a})">${E(0, -24, 9, 16, a % 90 ? C.gold : C.main)}</g>`).join("") + O(0, 0, 10, C.brand)),
    FESTIVAL_DECOR: at(80, 84, 1, R(-44, 10, 88, 10, 2, "#a16207") + R(-44, 32, 88, 8, 2, "#a16207") + at(-22, -6, 0.5, person(C.brand)) + at(22, -6, 0.5, person(C.main)) + at(0, 24, 0.4, diya())),
    HANDMADE: at(80, 84, 1, O(-8, 6, 30, C.main) + L("M-34 -6 Q-8 20 18 -6 M-30 20 Q-8 -10 16 22", C.light, 3) + L("M22 -14 L44 -40", C.stone, 4) + L("M30 -14 L48 -36", C.stone, 4)),
    GIFTS: at(80, 86, 1, R(-38, -10, 76, 48, 4, C.main) + R(-44, -24, 88, 16, 4, C.brand) + L("M0 -24 L0 38", C.goldLight, 8) + P("M0 -24 Q-26 -46 -20 -28 Q-14 -22 0 -24 Q14 -22 20 -28 Q26 -46 0 -24 Z", C.goldLight)),
    ART_CLASSES: at(80, 84, 1, P("M0 -38 Q40 -38 40 -2 Q40 14 26 12 Q14 10 14 22 Q14 38 -2 38 Q-40 38 -40 0 Q-40 -38 0 -38 Z", C.light) + O(-18, -14, 7, C.brand) + O(6, -22, 7, C.leaf) + O(22, -6, 7, C.sky) + O(-22, 12, 7, C.gold)),
  },
  CLOTHING: {
    SAREES: at(80, 84, 1, saree(C.main, C.gold)),
    LEHENGAS: at(80, 84, 1, skirt(C.brand)),
    MENS_WEAR: at(80, 84, 1, P("M-16 -38 Q0 -30 16 -38 L36 -26 L30 -8 L22 -12 L24 38 L-24 38 L-22 -12 L-30 -8 L-36 -26 Z", C.white) + L("M0 -32 L0 0", C.gold, 4) + O(0, -20, 2, C.gold) + O(0, -10, 2, C.gold)),
    KIDS_WEAR: at(80, 84, 1, P("M-14 -34 L14 -34 L18 -14 L40 34 Q0 42 -40 34 L-18 -14 Z", C.mid) + L("M-34 24 Q0 32 34 24", C.gold, 5) + L("M-14 -34 L-24 -20 M14 -34 L24 -20")),
    JEWELRY: at(80, 78, 1, L("M-36 -30 Q-34 14 0 22 Q34 14 36 -30", C.gold, 7) + O(0, 28, 10, "#dc2626") + O(-22, 6, 5, C.goldLight) + O(22, 6, 5, C.goldLight)),
    TAILORING: at(80, 84, 1, R(-44, 20, 88, 14, 3, C.stone) + P("M-34 20 L-34 -26 Q-34 -34 -26 -34 L30 -34 Q38 -34 38 -26 L38 -6 L14 -6 L14 20", C.main) + L("M24 -6 L24 12", C.line, 4) + O(-20, -18, 5, C.white)),
    OUTFIT_RENTAL: at(80, 74, 1, L("M0 -36 Q8 -40 8 -32 Q8 -26 0 -22 L-38 0 L38 0 L0 -22", C.dark, 5) + shirt(C.main).replace("<path", `<path transform="translate(0 30) scale(.6)"`)) + at(118, 112, 0.5, tag()),
  },
  GARAGE_SALE: {
    FURNITURE: at(80, 86, 1, sofa()),
    ELECTRONICS: at(80, 84, 1, R(-44, -32, 88, 56, 6, C.dark) + `<rect x="-37" y="-25" width="74" height="42" rx="2" fill="${C.sky}"/>` + L("M-16 36 L16 36 M0 24 L0 36")),
    KITCHEN: at(80, 86, 1, pan()),
    KIDS: at(80, 84, 1, O(-22, -28, 11, C.mid) + O(22, -28, 11, C.mid) + O(0, -8, 26, C.mid) + E(0, 30, 26, 18, C.mid) + `<circle cx="-9" cy="-12" r="3.5" fill="${C.line}"/><circle cx="9" cy="-12" r="3.5" fill="${C.line}"/>` + E(0, 0, 8, 5, C.light)),
    CLOTHES: at(80, 84, 1, shirt()),
    INDIAN: at(80, 84, 1, diya()) + at(80, 116, 0.9, L("M-30 0 L30 0", C.gold, 4)),
    BOOKS: at(80, 82, 1, R(-36, -30, 18, 66, 3, C.main) + R(-16, -38, 18, 74, 3, C.brand) + R(6, -24, 16, 60, 3, C.gold) + at(34, 6, 1, R(-8, -30, 16, 60, 3, C.mid), 14)),
    TOOLS: at(80, 80, 1, wrench(), 20) + at(80, 80, 0.8, R(-30, -36, 40, 18, 4, C.dark) + L("M-10 -18 L-10 40", "#a16207", 8), -30),
    CAR: at(80, 88, 1, O(-30, 14, 18, "none") + O(30, 14, 18, "none") + L("M-30 14 L-6 -14 L18 -14 M-6 -14 L6 14 L30 14 L18 -14 L14 -28 L24 -28 M-14 -22 L0 -22", C.brand, 5)),
  },
  // Creators: what their content is about, each with a small "play" badge.
  CREATORS: Object.fromEntries(
    Object.entries({
      FOOD: at(76, 90, 1, plate() + L("M-12 -8 Q-18 -18 -12 -28 M2 -8 Q-4 -18 2 -28 M16 -8 Q10 -18 16 -28", C.mid, 4)),
      BEAUTY_FASHION: at(76, 86, 0.95, saree(C.main, C.gold)),
      DANCE_MUSIC: at(74, 86, 1.1, note()),
      COMEDY: at(76, 84, 1, O(0, 0, 36, C.goldLight) + `<circle cx="-12" cy="-8" r="4" fill="${C.line}"/><circle cx="12" cy="-8" r="4" fill="${C.line}"/>` + P("M-20 8 Q0 32 20 8 Z", C.brand)),
      FAMILY_KIDS: at(58, 90, 0.85, person(C.main)) + at(92, 98, 0.62, person(C.mid)) + at(76, 114, 0.4, heart(C.brand)),
      LIFESTYLE: at(76, 88, 0.95, camera()),
      WEDDINGS: at(76, 86, 1, O(-14, 6, 22, "none") + O(14, 6, 22, "none") + L("M-14 6 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0", C.gold, 6) + L("M14 6 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0", C.gold, 6) + P("M14 -22 L20 -30 L26 -22 L20 -16 Z", C.sky)),
      DEVOTIONAL: at(76, 92, 1.1, diya()),
      TECH_CAREERS: at(76, 88, 0.95, laptop()),
      REAL_ESTATE_FINANCE: at(68, 96, 0.8, house(C.brand)) + at(104, 70, 0.6, coin()),
      FITNESS: at(76, 86, 1, R(-46, -18, 14, 36, 4, C.dark) + R(32, -18, 14, 36, 4, C.dark) + R(-34, -10, 10, 20, 3, C.stone) + R(24, -10, 10, 20, 3, C.stone) + L("M-24 0 L24 0", C.stone, 8)),
      TRAVEL: at(76, 86, 0.95, plane(), -25),
    }).map(([id, body]) => [id, body + at(124, 40, 0.5, O(0, 0, 24, C.brand) + `<path d="M-7 -11 L11 0 L-7 11 Z" fill="${C.white}"/>`)]),
  ),
  GOODS: {
    PICKLES: at(80, 84, 1, jar(C.main) + L("M-10 4 L10 4", C.brand, 4)),
    PLANTS: at(80, 82, 1, pot() + at(-10, -18, 0.6, leaf(), -20) + at(12, -20, 0.6, leaf(C.leafLight), 20)),
    POOJA_ITEMS: at(80, 82, 1, plate() + at(-14, -2, 0.5, diya()) + O(16, 4, 7, "#dc2626") + O(28, 8, 5, C.gold)),
    HOMEMADE: at(80, 84, 1, R(-40, -4, 40, 30, 8, C.pale) + L("M-30 8 L-10 8", C.light, 3) + R(8, -14, 30, 44, 4, C.light) + L("M23 -14 L23 -24") + `<path d="M23 -24 Q17 -34 23 -42 Q29 -34 23 -24Z" fill="${C.main}"/>`),
    OTHER: at(80, 84, 1, box() + T(0, 22, "?", 28, C.brand)),
  },
};

let n = 0;
for (const [category, subs] of Object.entries(I)) {
  mkdirSync(`${out}/${category}`, { recursive: true });
  for (const [id, body] of Object.entries(subs)) {
    writeFileSync(`${out}/${category}/${id}.svg`, svg(body));
    n++;
  }
}
console.log(`Wrote ${n} icons to ${out}`);
