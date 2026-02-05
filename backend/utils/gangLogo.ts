// Neon color palette for TRON style
const NEON_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#00aaff', // Blue
  '#9900ff', // Purple
  '#00ff66', // Green
  '#ff6600', // Orange
  '#ff0066', // Pink
  '#66ff00'  // Lime
];

// Shape types
type ShapeType = 'circle' | 'triangle' | 'hexagon' | 'star' | 'diamond';

function getRandomShape(): ShapeType {
  const shapes: ShapeType[] = ['circle', 'triangle', 'hexagon', 'star', 'diamond'];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function getRandomColor(): string {
  return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
}

function getRandomPosition(): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * 80) + 10,
    y: Math.floor(Math.random() * 80) + 10
  };
}

function getRandomSize(): number {
  return Math.floor(Math.random() * 30) + 20;
}

function generateShapeSVG(shape: ShapeType, color: string, size: number): string {
  const cx = 50;
  const cy = 50;

  switch (shape) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${size}" fill="${color}" opacity="0.8"/>`;

    case 'triangle':
      const h = size * Math.sqrt(3) / 2;
      return `<polygon points="${cx},${cy - h} ${cx - size},${cy + h/2} ${cx + size},${cy + h/2}" fill="${color}" opacity="0.8"/>`;

    case 'hexagon':
      const hexPoints = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      return `<polygon points="${hexPoints}" fill="${color}" opacity="0.8"/>`;

    case 'star':
      const starPoints = Array.from({ length: 10 }, (_, i) => {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? size : size / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      return `<polygon points="${starPoints}" fill="${color}" opacity="0.8"/>`;

    case 'diamond':
      return `<polygon points="${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}" fill="${color}" opacity="0.8"/>`;

    default:
      return '';
  }
}

function getInitials(name: string): string {
  const words = name.toUpperCase().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2);
  }
  return words.map(word => word[0]).join('').substring(0, 2);
}

export function generateGangLogo(name: string): string {
  const numShapes = Math.floor(Math.random() * 2) + 2; // 2-3 shapes
  let shapes = '';

  for (let i = 0; i < numShapes; i++) {
    const shape = getRandomShape();
    const color = getRandomColor();
    const size = getRandomSize();

    shapes += generateShapeSVG(shape, color, size);
  }

  const initials = getInitials(name);

  const svg = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#050510"/>
  ${shapes}
  <text x="50" y="55" text-anchor="middle" fill="#ffffff" font-size="28" font-family="Arial, sans-serif" font-weight="bold">${initials}</text>
</svg>`.trim();

  return svg;
}
