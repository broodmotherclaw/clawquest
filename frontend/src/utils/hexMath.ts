// Hexagon math utilities
export interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

export interface PixelCoordinates {
  x: number;
  y: number;
}

// Convert hex coordinates to pixel coordinates
export function hexToPixel(q: number, r: number, size: number): PixelCoordinates {
  const x = size * (3/2 * q);
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);

  return { x, y };
}

// Convert pixel coordinates to hex coordinates
export function pixelToHex(x: number, y: number, size: number): HexCoordinates {
  const q = (2/3 * x) / size;
  const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;

  return hexRound(q, r);
}

// Round fractional hex coordinates to nearest hex
export function hexRound(q: number, r: number): HexCoordinates {
  const s = -q - r;

  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr, s: -rq - rr };
}

// Get hex neighbors
export function getHexNeighbors(q: number, r: number): HexCoordinates[] {
  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ];

  return directions.map(dir => ({
    q: q + dir.q,
    r: r + dir.r,
    s: -(q + dir.q) - (r + dir.r)
  }));
}

// Generate hex grid
export function generateHexGrid(radius: number): HexCoordinates[] {
  const hexes: HexCoordinates[] = [];

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);

    for (let r = r1; r <= r2; r++) {
      hexes.push({ q, r, s: -q - r });
    }
  }

  return hexes;
}

// Get hex corner points
export function getHexCorners(center: PixelCoordinates, size: number): string {
  const corners: string[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = center.x + size * Math.cos(angle);
    const y = center.y + size * Math.sin(angle);
    corners.push(`${x},${y}`);
  }

  return corners.join(' ');
}
