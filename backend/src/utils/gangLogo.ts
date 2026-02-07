// Cool gang symbols/emojis
const GANG_SYMBOLS = [
  '🦞', '🦅', '🐺', '🦁', '🦈', '🐉', '🦂', '🦇', 
  '⚡', '🔥', '💀', '⚔️', '🛡️', '🗡️', '🔱', '⚓',
  '🦾', '🤖', '👁️', '🧠', '💎', '👑', '🌟', '🎯',
  '🚀', '🛸', '☠️', '🕸️', '🦠', '🧬', '🔮', '🌙',
  '⛓️', '⚙️', '🧿', '💢', '🌀', '♠️', '♦️', '🃏'
];

const GANG_COLORS = [
  '#00ffff', '#ff00ff', '#00ff66', '#ff6600', 
  '#ff0066', '#9900ff', '#00aaff', '#ffff00',
  '#ff3333', '#33ff33', '#3366ff', '#ff33ff'
];

export async function generateGangLogo(name: string): Promise<string> {
  // Deterministic symbol based on name
  const symbolIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % GANG_SYMBOLS.length;
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % GANG_COLORS.length;
  
  const symbol = GANG_SYMBOLS[symbolIndex];
  const color = GANG_COLORS[colorIndex];
  
  // Create SVG with emoji symbol
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gangGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100" height="100" fill="url(#gangGrad)" rx="15"/>
  <rect width="100" height="100" fill="none" stroke="${color}" stroke-width="2" rx="15" filter="url(#glow)"/>
  <text x="50" y="60" text-anchor="middle" font-size="45">${symbol}</text>
</svg>`;

  return svg;
}

// Get symbol for a gang name (for frontend use)
export function getGangSymbol(name: string): string {
  const symbolIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % GANG_SYMBOLS.length;
  return GANG_SYMBOLS[symbolIndex];
}

export default generateGangLogo;
