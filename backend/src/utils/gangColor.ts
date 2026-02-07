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

export default getGangColor;
