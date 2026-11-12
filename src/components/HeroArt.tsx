// Stylised glass office building with a network overlay — stands in for the
// photo in the mockup so the app ships without external image assets.
export function HeroArt() {
  const cols = 9;
  const rows = 8;
  return (
    <svg className="hero-art" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="fade" x1="0" x2="1">
          <stop offset="0" stopColor="#0b2a33" stopOpacity="1" />
          <stop offset="0.35" stopColor="#0b2a33" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fb8c0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0f4a52" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="glass2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fe3e0" stopOpacity="0.5" />
          <stop offset="1" stopColor="#14606a" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* main tower */}
      <polygon points="250,20 470,45 470,230 250,230" fill="url(#glass)" />
      <polygon points="470,45 560,70 560,230 470,230" fill="url(#glass2)" />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={256 + c * 23.5}
            y={30 + r * 24 + c * 2.6}
            width={19}
            height={18}
            fill={(r * 7 + c * 3) % 5 === 0 ? '#9ff3ea' : '#2b8f99'}
            opacity={(r * 7 + c * 3) % 5 === 0 ? 0.55 : 0.35}
          />
        )),
      )}
      {Array.from({ length: rows }).map((_, r) =>
        [0, 1, 2].map((c) => (
          <rect key={`s${r}-${c}`} x={476 + c * 27} y={56 + r * 22 + c * 6} width={22} height={16} fill="#5cc9c9" opacity={0.3} />
        )),
      )}
      {/* network overlay */}
      <g stroke="#00e6c3" strokeOpacity="0.55" strokeWidth="1" fill="none">
        <path d="M200 60 L300 100 L380 70 L460 120 L540 90" />
        <path d="M230 160 L320 140 L400 175 L500 150 L580 180" />
        <path d="M300 100 L320 140 M380 70 L400 175 M460 120 L500 150" />
      </g>
      <g fill="#00e6c3">
        {[
          [200, 60], [300, 100], [380, 70], [460, 120], [540, 90],
          [230, 160], [320, 140], [400, 175], [500, 150], [580, 180],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" />
        ))}
      </g>
      <rect x="0" y="0" width="600" height="220" fill="url(#fade)" />
    </svg>
  );
}
