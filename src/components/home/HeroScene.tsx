// A sunrise over palm-lined backwaters with festival kites. Decorative only.

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

      {/* Paper kites over the backwaters */}
      <g strokeLinecap="round">
        <path d="M555 111Q587 182 624 214T680 297" fill="none" stroke="#99552f" strokeWidth="1.5" opacity=".55" />
        <path d="M554 62l39 29-38 36-42-30z" fill="#e95e28" />
        <path d="M554 62l1 65-42-30z" fill="#f7ae49" />
        <path d="M514 97l79-6M554 63l1 64" stroke="#fff0cd" strokeWidth="1.5" />
        <path d="M662 130q12 32 38 51t31 50" fill="none" stroke="#407054" strokeWidth="1.2" opacity=".55" />
        <path d="M655 92l26 19-17 31-28-24z" fill="#287955" />
        <path d="M655 92l9 50-28-24z" fill="#75a65f" />
        <path d="M637 118l44-7M655 92l9 50" stroke="#fff0cd" strokeWidth="1" />
      </g>

      <Palm x={420} y={380} h={170} flip />
      <Palm x={455} y={384} h={120} color="#3B7A45" />
      <Palm x={720} y={384} h={150} />
      <Palm x={250} y={382} h={110} flip color="#467E4B" />

      {/* Backwater reflections */}
      <rect x="0" y="380" width="760" height="140" fill="url(#hs-water)" />
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
