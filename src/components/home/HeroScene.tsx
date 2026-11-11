// The hero's painted backdrop, drawn in SVG so it stays sharp at any size and weighs a few kilobytes: a
// sunrise over a South Indian temple gopuram, palms, a temple tank with lotuses, and birds. Decorative only.

const TIERS = 8;

function Gopuram({ x, base, width, tierH, tone }: { x: number; base: number; width: number; tierH: number; tone: "near" | "far" }) {
  const light = tone === "near" ? "#E9B57A" : "#EFC896";
  const mid = tone === "near" ? "#D49556" : "#E1AE78";
  const dark = tone === "near" ? "#A8652E" : "#C68E58";
  const niche = tone === "near" ? "#7A4520" : "#A87645";
  const tiers = Array.from({ length: TIERS }, (_, i) => {
    const w = width * (1 - i * 0.085);
    const nw = width * (1 - (i + 1) * 0.085);
    const y = base - (i + 1) * tierH;
    return { i, w, nw, y };
  });
  const top = base - TIERS * tierH;
  const topW = width * (1 - TIERS * 0.085);
  return (
    <g>
      {/* Gateway base */}
      <rect x={x - width / 2 - 6} y={base} width={width + 12} height={tierH * 2.2} fill={mid} />
      <rect x={x - width / 2 - 6} y={base} width={width + 12} height={4} fill={dark} />
      <path d={`M${x - 11} ${base + tierH * 2.2} v-${tierH * 1.4} a11 11 0 0 1 22 0 v${tierH * 1.4}z`} fill={niche} />
      {tiers.map(({ i, w, nw, y }) => (
        <g key={i}>
          <path d={`M${x - w / 2} ${y + tierH} L${x - nw / 2} ${y} H${x + nw / 2} L${x + w / 2} ${y + tierH}z`} fill={i % 2 ? light : mid} />
          {/* Shaded right side for depth */}
          <path d={`M${x + w / 4} ${y + tierH} L${x + nw / 4} ${y} H${x + nw / 2} L${x + w / 2} ${y + tierH}z`} fill={dark} opacity={0.35} />
          <rect x={x - w / 2 - 2} y={y + tierH - 3} width={w + 4} height={3} fill={dark} />
          {Array.from({ length: Math.max(2, Math.round(nw / 14)) }, (_, k) => k).map((k, _, arr) => {
            const span = nw * 0.8;
            const nx = x - span / 2 + (span / (arr.length - 1 || 1)) * k;
            return <rect key={k} x={nx - 2.2} y={y + tierH * 0.28} width={4.4} height={tierH * 0.45} rx={2} fill={niche} opacity={0.75} />;
          })}
        </g>
      ))}
      {/* Barrel-vault crown and kalasams */}
      <path d={`M${x - topW / 2 - 4} ${top} q0 -${tierH * 1.4} ${topW / 2 + 4} -${tierH * 1.6} q${topW / 2 + 4} ${tierH * 0.2} ${topW / 2 + 4} ${tierH * 1.6}z`} fill={mid} />
      <path d={`M${x - topW / 2 - 8} ${top} h${topW + 16}`} stroke={dark} strokeWidth={3} />
      {[-0.32, 0, 0.32].map((f) => (
        <g key={f}>
          <ellipse cx={x + topW * f} cy={top - tierH * 1.55 - 5} rx={3.2} ry={4.5} fill="#D4A017" />
          <path d={`M${x + topW * f} ${top - tierH * 1.55 - 14} v5`} stroke="#D4A017" strokeWidth={1.6} />
        </g>
      ))}
    </g>
  );
}

function Palm({ x, y, h, flip = false, color = "#2F6B3A" }: { x: number; y: number; h: number; flip?: boolean; color?: string }) {
  const s = flip ? -1 : 1;
  const tx = x + s * h * 0.18;
  const ty = y - h;
  const frond = (a: number, len: number) => {
    const rad = (a * Math.PI) / 180;
    const ex = tx + Math.cos(rad) * len;
    const ey = ty + Math.sin(rad) * len;
    const cx = tx + Math.cos(rad) * len * 0.5;
    const cy = ty + Math.sin(rad) * len * 0.5 - len * 0.28;
    return `M${tx} ${ty} Q${cx} ${cy} ${ex} ${ey} Q${cx} ${cy + len * 0.12} ${tx} ${ty}z`;
  };
  return (
    <g>
      <path d={`M${x} ${y} Q${x + s * h * 0.05} ${y - h * 0.55} ${tx} ${ty}`} stroke="#6B4A2E" strokeWidth={h * 0.045} fill="none" strokeLinecap="round" />
      {[-170, -140, -110, -70, -40, -10, 15, 160].map((a, i) => (
        <path key={a} d={frond(a, h * (i % 2 ? 0.42 : 0.5))} fill={color} opacity={i % 2 ? 0.85 : 1} />
      ))}
    </g>
  );
}

function Lotus({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={16} ry={3.5} fill="#2F6B3A" opacity={0.8} />
      <path d="M0 2c-3-3-4-7-2-11 4 3 5 8 2 11z" fill="#F3A0B5" />
      <path d="M-1 3c-5-1-8-5-8-9 4 0 8 4 8 9z" fill="#EE8AA3" />
      <path d="M1 3c5-1 8-5 8-9-4 0-8 4-8 9z" fill="#EE8AA3" />
    </g>
  );
}

export function HeroScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 760 520" preserveAspectRatio="xMaxYMax slice" aria-hidden className={className}>
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4E2" />
          <stop offset="0.55" stopColor="#FFD9A8" />
          <stop offset="1" stopColor="#F9B36E" />
        </linearGradient>
        <radialGradient id="hs-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF7D6" />
          <stop offset="0.45" stopColor="#FFD58A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFC27A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B983" />
          <stop offset="0.4" stopColor="#8DBFB0" />
          <stop offset="1" stopColor="#4F8F82" />
        </linearGradient>
      </defs>

      <rect width="760" height="520" fill="url(#hs-sky)" />
      <circle cx="560" cy="250" r="170" fill="url(#hs-sun)" />
      <circle cx="560" cy="250" r="46" fill="#FFF1C9" opacity="0.9" />

      {/* Birds */}
      <g fill="none" stroke="#7A4A2A" strokeWidth="2" strokeLinecap="round" className="anim-float" opacity="0.7">
        <path d="M330 120q8-8 16 0q8-8 16 0" />
        <path d="M375 92q6-6 12 0q6-6 12 0" />
        <path d="M300 150q5-5 10 0q5-5 10 0" />
      </g>

      {/* Distant hills and trees */}
      <path d="M0 360 C120 320 210 330 300 345 S520 320 620 335 S720 330 760 340 V400 H0z" fill="#9DBB8A" opacity="0.7" />
      <path d="M0 375 C140 350 260 360 380 368 S620 352 760 362 V410 H0z" fill="#6F9C68" opacity="0.8" />

      {/* Temple: a far shrine, the great gopuram, and the compound wall */}
      <Gopuram x={665} base={352} width={70} tierH={13} tone="far" />
      <rect x="420" y="338" width="320" height="30" fill="#D9A56C" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={426 + i * 20} y="330" width="10" height="10" fill="#C68E58" />
      ))}
      <Gopuram x={545} base={330} width={130} tierH={23} tone="near" />

      <Palm x={420} y={380} h={170} flip />
      <Palm x={455} y={384} h={120} color="#3B7A45" />
      <Palm x={720} y={384} h={150} />
      <Palm x={250} y={382} h={110} flip color="#467E4B" />

      {/* Temple tank with reflections */}
      <rect x="0" y="380" width="760" height="140" fill="url(#hs-water)" />
      <g opacity="0.18" transform="translate(0 760) scale(1 -1)">
        <Gopuram x={545} base={380} width={130} tierH={23} tone="near" />
      </g>
      <g stroke="#FFF3DC" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M470 420h60M500 440h90M430 456h50M560 466h70M620 430h40" />
      </g>
      <Lotus x={330} y={448} s={1.2} />
      <Lotus x={390} y={476} />
      <Lotus x={690} y={462} s={1.1} />

      {/* Near bank */}
      <path d="M0 470 C80 455 160 470 230 488 S330 510 380 520 H0z" fill="#3E7A47" />
      <path d="M0 492 C70 482 140 494 200 506 S260 516 290 520 H0z" fill="#2E6237" />
    </svg>
  );
}

// The saffron, white and green ribbon along the bottom of the hero.
export function HeroWave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M0 62 C360 18 720 96 1080 46 S1380 20 1440 30 V90 H0z" fill="#F47721" opacity="0.9" />
      <path d="M0 70 C360 30 720 104 1080 56 S1380 32 1440 42 V90 H0z" fill="#FFFFFF" />
      <path d="M0 78 C360 44 720 112 1080 66 S1380 46 1440 54 V90 H0z" fill="#145638" />
      <path d="M0 86 C360 60 720 118 1080 80 S1380 66 1440 70 V90 H0z" fill="var(--page)" />
    </svg>
  );
}
