import { useRef, useEffect, useCallback } from 'react';
import { Hex } from '../types';

interface HexGridProps {
  hexes: Hex[];
  onHexClick: (hex: Hex) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPan: (pan: { x: number; y: number }) => void;
  onZoom?: (delta: number) => void;
  hexSize?: number;
}

// Hexagon math helpers
function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = size * (3 / 2 * r);
  return { x, y };
}

// Extract emoji symbol from gang logo SVG
function getGangSymbol(logoSvg?: string): string {
  if (!logoSvg) return '🦞';
  // Try to find emoji in SVG
  const emojiMatch = logoSvg.match(/<text[^>]*>([^<]+)<\/text>/);
  if (emojiMatch) return emojiMatch[1].trim();
  return '🦞';
}

function getHexCorners(center: { x: number; y: number }, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = (Math.PI / 180) * angle_deg;
    const x = center.x + size * Math.cos(angle_rad);
    const y = center.y + size * Math.sin(angle_rad);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

export function HexGrid({ hexes, onHexClick, zoom, pan, onPan, onZoom, hexSize = 25 }: HexGridProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    
    onPan({
      x: pan.x + dx,
      y: pan.y + dy,
    });
    
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [pan, onPan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Handle wheel for zoom - zoom towards mouse pointer
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!onZoom) return;
    
    const zoomFactor = e.deltaY > 0 ? -0.1 : 0.1;
    onZoom(zoomFactor);
  }, [onZoom]);

  // Get color for hex - always use agent color (not gang color)
  const getHexColor = (hex: Hex): string => {
    // Use agent color
    if (hex.owner?.color) return hex.owner.color;
    if (hex.color) return hex.color;
    if (hex.ownerId) return '#00ffff';
    return '#1a1a2e'; // Unclaimed gray-blue
  };

  // Group hexes by claimed status for rendering order
  const unclaimedHexes = hexes.filter(h => !h.ownerId);
  const claimedHexes = hexes.filter(h => h.ownerId);

  return (
    <svg
      ref={svgRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        background: 'radial-gradient(ellipse at center, rgba(0, 20, 40, 0.3) 0%, rgba(5, 5, 16, 1) 100%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Grid pattern */}
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0, 255, 255, 0.03)" strokeWidth="1"/>
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Main transform group */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Center the grid */}
        <g transform={`translate(0, 0)`}>
          {/* Unclaimed hexes (rendered first, below) */}
          {unclaimedHexes.map((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
            return (
              <g key={`${hex.q},${hex.r}`}>
                <polygon
                  points={getHexCorners({ x, y }, hexSize - 1)}
                  fill="#1a1a2e"
                  stroke="rgba(0, 255, 255, 0.15)"
                  strokeWidth="1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onHexClick(hex)}
                />
              </g>
            );
          })}

          {/* Claimed hexes (rendered second, on top) */}
          {claimedHexes.map((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
            const color = getHexColor(hex);
            const hasGang = !!hex.gangId;
            
            return (
              <g key={`${hex.q},${hex.r}`}>
                {/* Hexagon */}
                <polygon
                  points={getHexCorners({ x, y }, hexSize - 1)}
                  fill={color}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1"
                  filter={hasGang ? 'url(#glow)' : undefined}
                  opacity={0.85}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => onHexClick(hex)}
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('opacity', '1');
                    e.currentTarget.setAttribute('stroke-width', '2');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('opacity', '0.85');
                    e.currentTarget.setAttribute('stroke-width', '1');
                  }}
                />
                
                {/* Gang symbol indicator */}
                {hasGang && hex.gang && (
                  <g transform={`translate(${x - hexSize*0.25}, ${y - hexSize*0.25})`}>
                    <rect
                      width={hexSize * 0.5}
                      height={hexSize * 0.5}
                      rx={4}
                      fill="rgba(0,0,0,0.7)"
                      stroke={hex.gang.color || '#00ffff'}
                      strokeWidth={1}
                    />
                    <text
                      x={hexSize * 0.25}
                      y={hexSize * 0.35}
                      textAnchor="middle"
                      fontSize={hexSize * 0.35}
                      fill="#fff"
                    >
                      {getGangSymbol(hex.gang.logoSvg) || '🦞'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* Instructions overlay */}
      <text
        x="20"
        y="30"
        fill="rgba(0, 255, 255, 0.5)"
        fontSize="12"
        fontFamily="'Rajdhani', sans-serif"
      >
        🖱️ Drag to pan • 🔍 Scroll to zoom • 👆 Click to interact
      </text>
    </svg>
  );
}

export default HexGrid;
