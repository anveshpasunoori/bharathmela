// Draws the category illustrations in the app's palette into public/categories/<CATEGORY>.svg.
// Run: node scripts/category-icons.mjs   (edit a drawing or the palette `C` below, then re-run)
import { mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] ?? new URL("../public/categories", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// App palette (Tailwind orange/amber/stone, brand #c2410c).
const C = {
  line: "#7c2d12", // outlines: orange-900
  brand: "#c2410c",
  main: "#f97316", // orange-500
  mid: "#fb923c", // orange-400
  light: "#fed7aa", // orange-200
  pale: "#ffedd5", // orange-100
  gold: "#f59e0b", // amber-500
  goldLight: "#fcd34d", // amber-300
  leaf: "#65a30d", // lime-600
  leafLight: "#84cc16",
  stone: "#a8a29e",
  white: "#fffbf5",
};
const S = `stroke="${C.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const spark = (x, y, r, fill = C.mid) =>
  `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;
const dot = (x, y, r = 2.4, fill = C.mid) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#ffedd5"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${C.goldLight}" stop-opacity=".9"/><stop offset="1" stop-color="${C.goldLight}" stop-opacity="0"/></radialGradient>
</defs>
<rect x="2" y="2" width="156" height="156" rx="24" fill="url(#bg)" stroke="#fed7aa" stroke-width="1.5"/>
${body}
</svg>
`;

const icons = {
  FOOD: `
<path d="M80 40 Q74 32 80 26 M92 40 Q86 32 92 26 M68 40 Q62 32 68 26" fill="none" stroke="${C.mid}" stroke-width="3" stroke-linecap="round"/>
<path d="M36 104 Q36 60 80 58 Q124 60 124 104 Z" fill="${C.main}" ${S}/>
<path d="M50 92 Q54 74 70 68" fill="none" stroke="${C.light}" stroke-width="4" stroke-linecap="round"/>
<circle cx="80" cy="54" r="6" fill="${C.goldLight}" ${S}/>
<rect x="24" y="104" width="112" height="10" rx="5" fill="${C.light}" ${S}/>
<path d="M34 114 Q80 132 126 114" fill="${C.white}" ${S}/>
${spark(132, 40, 7, C.gold)}${spark(26, 50, 5)}${dot(118, 30)}${dot(30, 134, 2.4, C.gold)}`,

  TUTORING: `
<path d="M28 62 Q52 54 80 66 L80 128 Q52 116 28 124 Z" fill="${C.white}" ${S}/>
<path d="M132 62 Q108 54 80 66 L80 128 Q108 116 132 124 Z" fill="${C.white}" ${S}/>
<path d="M38 76 Q54 72 70 78 M38 88 Q54 84 70 90 M38 100 Q54 96 70 102" fill="none" stroke="${C.light}" stroke-width="3" stroke-linecap="round"/>
<path d="M28 124 Q52 116 80 128 Q108 116 132 124 L132 130 Q108 122 80 134 Q52 122 28 130 Z" fill="${C.main}" ${S}/>
<path d="M80 22 L120 38 L80 54 L40 38 Z" fill="${C.brand}" ${S}/>
<path d="M58 45 L58 58 Q80 68 102 58 L102 45" fill="${C.main}" ${S}/>
<path d="M120 38 L120 56" fill="none" ${S}/><circle cx="120" cy="59" r="4" fill="${C.gold}" ${S}/>
<g transform="rotate(35 112 96)"><rect x="106" y="74" width="12" height="44" rx="2" fill="${C.goldLight}" ${S}/><path d="M106 118 L112 130 L118 118 Z" fill="${C.light}" ${S}/><rect x="106" y="68" width="12" height="8" rx="2" fill="${C.mid}" ${S}/></g>
${spark(138, 22, 6, C.gold)}${spark(22, 40, 5)}${dot(140, 140)}`,

  DANCE_MUSIC: `
<ellipse cx="56" cy="74" rx="24" ry="9" fill="${C.light}" ${S}/>
<path d="M32 74 L36 126 Q56 134 76 126 L80 74" fill="${C.main}" ${S}/>
<path d="M36 92 Q56 100 78 92" fill="none" stroke="${C.light}" stroke-width="3"/>
<ellipse cx="56" cy="74" rx="9" ry="3.5" fill="${C.line}"/>
<ellipse cx="110" cy="88" rx="22" ry="8" fill="${C.light}" ${S}/>
<path d="M88 88 Q84 112 96 126 Q110 134 124 126 Q136 112 132 88" fill="${C.brand}" ${S}/>
<ellipse cx="110" cy="88" rx="8" ry="3" fill="${C.line}"/>
<path d="M98 106 Q110 112 122 106" fill="none" stroke="${C.mid}" stroke-width="3"/>
<path d="M102 30 L102 56 M102 30 L122 26 L122 50" fill="none" ${S}/>
<ellipse cx="97" cy="57" rx="6" ry="4.5" fill="${C.gold}" ${S}/><ellipse cx="117" cy="51" rx="6" ry="4.5" fill="${C.gold}" ${S}/>
<path d="M50 30 L50 50" fill="none" ${S}/><ellipse cx="45" cy="51" rx="6" ry="4.5" fill="${C.main}" ${S}/>
<path d="M50 30 Q58 34 60 42" fill="none" ${S}/>
${spark(140, 66, 6, C.gold)}${spark(24, 108, 5)}${dot(76, 36)}`,

  PUJARI: `
<path d="M56 66 Q40 48 26 54 Q38 68 56 68Z" fill="${C.leaf}" ${S}/>
<path d="M56 66 Q72 48 86 54 Q74 68 56 68Z" fill="${C.leaf}" ${S}/>
<path d="M56 68 Q36 60 30 70 Q44 76 56 70Z" fill="${C.leafLight}" ${S}/>
<path d="M56 68 Q76 60 82 70 Q68 76 56 70Z" fill="${C.leafLight}" ${S}/>
<circle cx="56" cy="52" r="13" fill="#a16207" ${S}/>
<path d="M50 40 L48 32 M56 39 L56 30 M62 40 L64 32" fill="none" ${S}/>
<rect x="40" y="68" width="32" height="9" rx="3" fill="${C.gold}" ${S}/>
<path d="M41 77 Q26 89 27 104 Q29 126 56 129 Q83 126 85 104 Q86 89 71 77 Z" fill="${C.goldLight}" ${S}/>
<path d="M30 98 Q56 108 82 98" fill="none" stroke="${C.brand}" stroke-width="3" stroke-linecap="round"/>
<circle cx="56" cy="90" r="3.5" fill="${C.brand}"/>
<path d="M44 129 L68 129 L73 139 L39 139 Z" fill="${C.gold}" ${S}/>
<circle cx="114" cy="100" r="26" fill="url(#glow)"/>
<path d="M114 80 Q103 96 108 106 Q114 112 120 106 Q125 96 114 80Z" fill="${C.main}" ${S}/>
<path d="M114 93 Q110 100 112 104 Q114 106 116 104 Q118 100 114 93Z" fill="${C.goldLight}"/>
<path d="M90 117 Q92 137 114 138 Q136 137 138 117 Q114 125 90 117 Z" fill="${C.brand}" ${S}/>
<path d="M90 117 Q114 109 138 117" fill="none" ${S}/>
${spark(134, 36, 7, C.gold)}${spark(96, 30, 5)}${dot(140, 66)}${dot(22, 124, 2.4, C.gold)}`,

  EVENT_SERVICES: `
<rect x="28" y="64" width="72" height="54" rx="8" fill="${C.brand}" ${S}/>
<path d="M44 64 L50 52 L76 52 L82 64" fill="${C.main}" ${S}/>
<circle cx="64" cy="91" r="17" fill="${C.light}" ${S}/>
<circle cx="64" cy="91" r="9" fill="${C.line}"/><circle cx="60" cy="87" r="3" fill="${C.white}"/>
<rect x="84" y="72" width="9" height="6" rx="2" fill="${C.goldLight}"/>
<path d="M104 132 L118 92 L144 118 Z" fill="${C.gold}" ${S}/>
<path d="M110 116 L130 124 M114 104 L136 114" fill="none" stroke="${C.brand}" stroke-width="3" stroke-linecap="round"/>
<path d="M126 86 Q130 70 142 66 M136 94 Q148 92 152 80" fill="none" stroke="${C.main}" stroke-width="3" stroke-linecap="round"/>
<path d="M116 80 Q112 64 120 54" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>
${spark(132, 40, 7, C.gold)}${spark(30, 36, 6)}${spark(146, 54, 4, C.brand)}${dot(104, 46, 2.6, C.brand)}${dot(40, 136, 2.4, C.gold)}${dot(92, 30)}`,

  DOMESTIC_HELP: `
<path d="M40 22 L64 98" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
<path d="M40 22 L64 98" fill="none" stroke="${C.goldLight}" stroke-width="2" stroke-linecap="round"/>
<path d="M54 96 L76 90 L90 128 Q70 138 50 136 Z" fill="${C.gold}" ${S}/>
<path d="M60 104 L64 132 M70 100 L76 130 M78 97 L86 126" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>
<path d="M98 88 L136 88 L130 136 L104 136 Z" fill="${C.main}" ${S}/>
<path d="M98 88 Q117 98 136 88" fill="none" ${S}/>
<path d="M102 88 Q117 64 132 88" fill="none" ${S}/>
<path d="M104 112 L130 112" fill="none" stroke="${C.light}" stroke-width="3"/>
<circle cx="112" cy="78" r="6" fill="${C.white}" ${S}/><circle cx="124" cy="70" r="8" fill="${C.white}" ${S}/><circle cx="134" cy="80" r="5" fill="${C.white}" ${S}/>
${spark(128, 40, 8, C.gold)}${spark(104, 28, 5)}${spark(24, 112, 5, C.gold)}${dot(146, 54)}`,

  ROOM_RENTAL: `
<path d="M24 78 L80 34 L136 78" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M36 72 L80 38 L124 72 L124 132 L36 132 Z" fill="${C.white}" ${S}/>
<path d="M24 78 L80 34 L136 78" fill="none" stroke="${C.brand}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="68" y="56" width="24" height="20" rx="2" fill="${C.light}" ${S}/>
<path d="M80 56 L80 76 M68 66 L92 66" fill="none" stroke="${C.line}" stroke-width="2"/>
<path d="M48 132 L48 98 M112 132 L112 108" fill="none" ${S}/>
<rect x="48" y="108" width="64" height="12" rx="3" fill="${C.main}" ${S}/>
<rect x="52" y="98" width="20" height="10" rx="4" fill="${C.pale}" ${S}/>
<path d="M30 132 L130 132" fill="none" ${S}/>
<path d="M126 24 Q114 30 118 42 Q124 52 136 46 Q124 46 122 36 Q122 28 126 24Z" fill="${C.goldLight}" ${S}/>
${spark(104, 22, 5, C.gold)}${spark(30, 40, 5)}${dot(142, 60)}`,

  REALTOR: `
<rect x="84" y="36" width="44" height="100" rx="3" fill="${C.white}" ${S}/>
<rect x="92" y="46" width="11" height="11" rx="1" fill="${C.light}" ${S}/><rect x="109" y="46" width="11" height="11" rx="1" fill="${C.light}" ${S}/>
<rect x="92" y="64" width="11" height="11" rx="1" fill="${C.light}" ${S}/><rect x="109" y="64" width="11" height="11" rx="1" fill="${C.light}" ${S}/>
<rect x="92" y="82" width="11" height="11" rx="1" fill="${C.light}" ${S}/><rect x="109" y="82" width="11" height="11" rx="1" fill="${C.light}" ${S}/>
<path d="M118 136 L118 112" fill="none" ${S}/>
<rect x="100" y="100" width="44" height="20" rx="3" fill="${C.brand}" ${S}/>
<path d="M108 110 L136 110" stroke="${C.white}" stroke-width="3" stroke-linecap="round"/>
<path d="M22 112 Q40 104 58 110 L74 104 Q82 102 82 110 Q82 116 74 118 L50 124 Q36 128 22 124 Z" fill="${C.light}" ${S}/>
<circle cx="52" cy="58" r="12" fill="${C.goldLight}" ${S}/><circle cx="52" cy="58" r="4" fill="${C.pale}" ${S}/>
<path d="M52 70 L52 96 M52 82 L60 82 M52 90 L58 90" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
<path d="M52 70 L52 96 M52 82 L60 82 M52 90 L58 90" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round"/>
<path d="M52 46 L52 34" fill="none" ${S}/>
${spark(30, 36, 6, C.gold)}${spark(140, 24, 6)}${dot(70, 30)}`,

  LEGAL: `
<path d="M80 30 L80 122" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
<path d="M80 30 L80 122" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round"/>
<circle cx="80" cy="30" r="6" fill="${C.gold}" ${S}/>
<path d="M36 44 Q80 36 124 44" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
<path d="M40 46 L26 82 M40 46 L54 82 M120 46 L106 82 M120 46 L134 82" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>
<path d="M22 82 Q40 100 58 82 Z" fill="${C.main}" ${S}/>
<path d="M102 82 Q120 100 138 82 Z" fill="${C.main}" ${S}/>
<path d="M58 132 Q58 118 80 118 Q102 118 102 132 Z" fill="${C.brand}" ${S}/>
<rect x="50" y="130" width="60" height="8" rx="3" fill="${C.gold}" ${S}/>
${spark(138, 118, 6, C.gold)}${spark(22, 118, 5)}${dot(130, 26)}${dot(30, 26, 2.4, C.gold)}`,

  HOME_SERVICES: `
<g transform="rotate(-35 62 62)">
<rect x="57" y="22" width="10" height="58" rx="4" fill="${C.goldLight}" ${S}/>
<circle cx="62" cy="22" r="12" fill="${C.goldLight}" ${S}/>
<rect x="58" y="6" width="8" height="13" fill="#fff6ea"/>
</g>
<g transform="rotate(28 112 60)">
<rect x="104" y="22" width="16" height="26" rx="6" fill="${C.main}" ${S}/>
<rect x="109.5" y="48" width="5" height="30" fill="${C.stone}" ${S}/>
</g>
<path d="M60 80 L60 66 Q60 62 64 62 L96 62 Q100 62 100 66 L100 80" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
<rect x="26" y="80" width="108" height="54" rx="7" fill="${C.brand}" ${S}/>
<rect x="26" y="80" width="108" height="16" rx="7" fill="${C.main}" ${S}/>
<rect x="72" y="90" width="16" height="12" rx="3" fill="${C.goldLight}" ${S}/>
<path d="M38 116 L60 116 M100 116 L122 116" fill="none" stroke="${C.mid}" stroke-width="3" stroke-linecap="round"/>
${spark(136, 34, 7, C.gold)}${spark(26, 52, 5)}${dot(140, 64)}`,

  AUTO: `
<path d="M20 108 L20 92 Q20 82 30 80 L50 76 L66 58 Q71 52 80 52 L108 52 Q116 52 120 58 L132 76 L138 78 Q146 80 146 90 L146 108 Z" fill="${C.main}" ${S}/>
<path d="M70 76 L80 63 Q82 60 86 60 L96 60 L96 76 Z" fill="${C.pale}" ${S}/>
<path d="M104 60 L110 60 Q114 60 116 63 L124 76 L104 76 Z" fill="${C.pale}" ${S}/>
<path d="M20 96 L146 96" fill="none" stroke="${C.brand}" stroke-width="3"/>
<rect x="136" y="84" width="10" height="6" rx="2" fill="${C.goldLight}" ${S}/>
<rect x="20" y="84" width="8" height="6" rx="2" fill="${C.brand}" ${S}/>
<circle cx="50" cy="110" r="14" fill="${C.line}"/><circle cx="50" cy="110" r="6" fill="${C.goldLight}"/>
<circle cx="116" cy="110" r="14" fill="${C.line}"/><circle cx="116" cy="110" r="6" fill="${C.goldLight}"/>
<path d="M14 132 L150 132" fill="none" stroke="${C.light}" stroke-width="3" stroke-linecap="round"/>
<path d="M8 74 L22 74 M4 84 L14 84" fill="none" stroke="${C.mid}" stroke-width="3" stroke-linecap="round"/>
${spark(134, 32, 7, C.gold)}${spark(32, 40, 5)}${dot(150, 54)}`,

  BEAUTY: `
<path d="M60 92 L56 132 Q56 138 62 138 L74 138 Q80 138 80 132 L76 92 Z" fill="${C.gold}" ${S}/>
<circle cx="68" cy="64" r="32" fill="${C.gold}" ${S}/>
<circle cx="68" cy="64" r="23" fill="${C.pale}" ${S}/>
<path d="M54 56 Q58 46 68 44" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round"/>
<rect x="108" y="96" width="24" height="40" rx="3" fill="${C.brand}" ${S}/>
<rect x="108" y="86" width="24" height="12" rx="2" fill="${C.goldLight}" ${S}/>
<path d="M112 86 L112 64 Q120 52 128 60 L128 86 Z" fill="${C.main}" ${S}/>
<g fill="${C.mid}" ${S}><circle cx="132" cy="26" r="6"/><circle cx="142" cy="33" r="6"/><circle cx="138" cy="45" r="6"/><circle cx="126" cy="45" r="6"/><circle cx="122" cy="33" r="6"/></g>
<circle cx="132" cy="36" r="5" fill="${C.goldLight}" ${S}/>
${spark(26, 34, 6, C.gold)}${spark(104, 34, 4)}${dot(26, 120)}`,

  TAX_FINANCE: `
<path d="M34 34 Q34 28 40 28 L86 28 L100 42 L100 122 Q100 128 94 128 L40 128 Q34 128 34 122 Z" fill="${C.white}" ${S}/>
<path d="M86 28 L86 42 L100 42" fill="${C.light}" ${S}/>
<path d="M46 52 L84 52 M46 64 L88 64 M46 76 L70 76" fill="none" stroke="${C.light}" stroke-width="4" stroke-linecap="round"/>
<path d="M46 100 L54 108 L68 92" fill="none" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="82" y="68" width="54" height="72" rx="8" fill="${C.brand}" ${S}/>
<rect x="90" y="76" width="38" height="15" rx="3" fill="${C.pale}" ${S}/>
<path d="M112 83.5 L122 83.5" stroke="${C.line}" stroke-width="2.5" stroke-linecap="round"/>
<g fill="${C.light}"><circle cx="97" cy="102" r="4.5"/><circle cx="109" cy="102" r="4.5"/><circle cx="121" cy="102" r="4.5"/><circle cx="97" cy="115" r="4.5"/><circle cx="109" cy="115" r="4.5"/><circle cx="97" cy="128" r="4.5"/><circle cx="109" cy="128" r="4.5"/></g>
<rect x="116.5" y="110.5" width="9" height="22" rx="4.5" fill="${C.goldLight}"/>
${spark(132, 36, 7, C.gold)}${spark(118, 18, 4)}${dot(24, 120, 2.4, C.gold)}`,

  TRAVEL: `
<path d="M30 66 Q36 40 84 42" fill="none" stroke="${C.mid}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>
<g transform="translate(94 42) rotate(-28)">
<path d="M18 2 L30 -18 L36 -18 L30 4 Z" fill="${C.white}" ${S}/>
<path d="M18 10 L30 30 L36 30 L30 8 Z" fill="${C.white}" ${S}/>
<path d="M4 4 L-2 -8 L4 -8 L10 4 Z" fill="${C.main}" ${S}/>
<rect x="0" y="1" width="46" height="10" rx="5" fill="${C.white}" ${S}/>
<circle cx="38" cy="6" r="1.8" fill="${C.line}"/>
</g>
<path d="M68 76 L68 64 Q68 60 72 60 L88 60 Q92 60 92 64 L92 76" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
<rect x="42" y="76" width="76" height="58" rx="9" fill="${C.main}" ${S}/>
<rect x="56" y="76" width="9" height="58" fill="${C.brand}" ${S}/>
<rect x="95" y="76" width="9" height="58" fill="${C.brand}" ${S}/>
<circle cx="56" cy="139" r="4.5" fill="${C.line}"/><circle cx="104" cy="139" r="4.5" fill="${C.line}"/>
<rect x="72" y="94" width="16" height="10" rx="2" fill="${C.goldLight}" ${S}/>
${spark(138, 70, 6, C.gold)}${spark(24, 40, 5)}${dot(140, 120)}`,

  ART: `
<path d="M30 90 Q26 50 70 42 Q114 36 124 68 Q132 94 106 96 Q92 96 94 108 Q98 126 78 130 Q34 134 30 90 Z" fill="${C.pale}" ${S}/>
<circle cx="52" cy="64" r="9" fill="${C.brand}" ${S}/>
<circle cx="77" cy="56" r="9" fill="${C.gold}" ${S}/>
<circle cx="101" cy="66" r="9" fill="${C.leaf}" ${S}/>
<circle cx="48" cy="92" r="9" fill="${C.main}" ${S}/>
<circle cx="62" cy="114" r="9" fill="${C.goldLight}" ${S}/>
<g transform="rotate(38 120 108)">
<rect x="114" y="78" width="12" height="62" rx="5" fill="${C.mid}" ${S}/>
<rect x="114" y="66" width="12" height="13" rx="2" fill="${C.stone}" ${S}/>
<path d="M114 66 Q120 44 126 66 Z" fill="${C.brand}" ${S}/>
</g>
${spark(136, 32, 7, C.gold)}${spark(24, 36, 5)}${spark(142, 138, 5, C.brand)}${dot(28, 132, 2.4, C.gold)}`,

  CLOTHING: `
<path d="M80 30 Q80 20 88 20 Q96 20 96 27 Q96 33 88 36 L88 42" fill="none" ${S}/>
<path d="M88 42 L54 56 L122 56 Z" fill="none" ${S}/>
<path d="M66 56 L54 70 L62 78 L68 70 L68 80 Q56 108 42 136 L134 136 Q120 108 108 80 L108 70 L114 78 L122 70 L110 56 Q99 66 88 66 Q77 66 66 56Z" fill="${C.brand}" ${S}/>
<path d="M78 60 Q88 74 98 60" fill="${C.goldLight}" ${S}/>
<path d="M68 82 Q88 90 108 82" fill="none" stroke="${C.goldLight}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M44 132 L132 132 L128 122 L48 122Z" fill="${C.gold}" ${S}/>
${dot(76, 102, 2.6, C.goldLight)}${dot(100, 102, 2.6, C.goldLight)}${dot(88, 110, 2.6, C.goldLight)}${dot(66, 114, 2.6, C.goldLight)}${dot(110, 114, 2.6, C.goldLight)}
<path d="M136 78 Q144 78 144 86" fill="none" ${S}/>
<circle cx="142" cy="90" r="4" fill="${C.gold}" ${S}/>
<path d="M132 108 Q132 94 142 94 Q152 94 152 108 Z" fill="${C.goldLight}" ${S}/>
${dot(134, 114, 2.3, C.brand)}${dot(142, 115, 2.3, C.brand)}${dot(150, 114, 2.3, C.brand)}
${spark(30, 40, 7, C.gold)}${spark(136, 36, 5)}${spark(22, 106, 5, C.brand)}`,

  GOODS: `
<path d="M70 54 L70 36" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
<path d="M70 42 Q56 34 52 24 Q66 24 70 40Z" fill="${C.leafLight}" ${S}/>
<path d="M70 40 Q82 28 92 28 Q88 40 70 44Z" fill="${C.leaf}" ${S}/>
<path d="M70 52 Q56 50 48 40 Q62 38 70 50Z" fill="${C.leaf}" ${S}/>
<path d="M54 68 Q54 44 74 44 Q94 44 94 68" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
<path d="M36 64 L112 64 L118 138 L30 138 Z" fill="${C.main}" ${S}/>
<path d="M36 64 L112 64 L113 74 L35 74Z" fill="${C.brand}" ${S}/>
<path d="M62 100 Q62 92 68 92 Q74 92 74 98 Q74 92 80 92 Q86 92 86 100 Q86 108 74 116 Q62 108 62 100Z" fill="${C.white}" ${S}/>
<rect x="106" y="90" width="38" height="48" rx="7" fill="${C.goldLight}" ${S}/>
<rect x="103" y="81" width="44" height="11" rx="3" fill="${C.brand}" ${S}/>
<rect x="112" y="104" width="26" height="18" rx="3" fill="${C.white}" ${S}/>
<path d="M117 113 L133 113" stroke="${C.brand}" stroke-width="2.5" stroke-linecap="round"/>
${spark(136, 36, 7, C.gold)}${spark(26, 40, 5)}${spark(22, 116, 5, C.brand)}${dot(116, 26)}`,
};

for (const [id, body] of Object.entries(icons)) writeFileSync(`${out}/${id}.svg`, svg(body));
console.log(Object.keys(icons).length, "icons");
