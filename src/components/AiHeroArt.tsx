/** Flowing blue / purple ribbons on the right of the AI Hub banner (decorative). */
export function AiHeroArt() {
  const ribbons = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg className="ai-hero-art" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="aiRibbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7b8cff" stopOpacity="0.15" />
          <stop offset="0.35" stopColor="#8a5cf6" stopOpacity="0.75" />
          <stop offset="0.65" stopColor="#3b82f6" stopOpacity="0.85" />
          <stop offset="1" stopColor="#22d3c5" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="aiGlow" cx="0.55" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="600" height="220" fill="url(#aiGlow)" />
      {ribbons.map((i) => (
        <path
          key={i}
          d={`M ${60 + i * 6} 230 C ${180 + i * 8} ${150 - i * 6}, ${250 + i * 4} ${-20 + i * 5}, ${420 + i * 10} ${-10 + i * 3}`}
          fill="none"
          stroke="url(#aiRibbon)"
          strokeWidth={10 - i * 0.45}
          strokeLinecap="round"
          opacity={0.35 + (i % 4) * 0.12}
        />
      ))}
    </svg>
  );
}
