// Gang color palette - each gang gets a consistent color based on its name
const GANG_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#00ff66', // Green
  '#ff6600', // Orange
  '#ff0066', // Pink
  '#9900ff', // Purple
  '#00aaff', // Light Blue
  '#ffff00', // Yellow
  '#ff3333', // Red
  '#33ff33', // Lime
  '#3366ff', // Blue
  '#ff33ff', // Hot Pink
  '#00ffcc', // Teal
  '#ffcc00', // Gold
  '#cc00ff', // Violet
  '#33ccff', // Sky Blue
];

// Get a consistent color for a gang based on its name
export function getGangColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % GANG_COLORS.length;
  return GANG_COLORS[index];
}

// Get gang color with opacity for hexagons
export function getGangColorWithOpacity(name: string, opacity: number = 1): string {
  const color = getGangColor(name);
  if (opacity === 1) return color;
  
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default getGangColor;
