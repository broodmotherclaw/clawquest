import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Hex } from '../utils/api';
import { hexToPixel, getHexCorners } from '../utils/hexMath';

interface HexGridProps {
  hexes: Hex[];
  onHexClick: (hex: Hex) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPan: (pan: { x: number; y: number }) => void;
}

export const HexGrid: React.FC<HexGridProps> = ({
  hexes,
  onHexClick,
  zoom,
  pan,
  onPan
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    renderHexGrid();
  }, [hexes, zoom, pan]);

  const renderHexGrid = () => {
    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear existing content
    svg.selectAll('*').remove();

    // Create main group with zoom and pan
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${width/2 + pan.x}, ${height/2 + pan.y}) scale(${zoom})`);

    // Calculate hex size based on zoom
    const hexSize = 20;

    // Render hexes
    mainGroup.selectAll('.hex')
      .data(hexes)
      .enter()
      .append('polygon')
      .attr('class', 'hex')
      .attr('points', (d: Hex) => {
        const { x, y } = hexToPixel(d.q, d.r, hexSize);
        const center = { x, y };
        return getHexCorners(center, hexSize);
      })
      .attr('fill', (d: Hex) => d.owner.color)
      .attr('stroke', '#00aaff')
      .attr('stroke-width', '2')
      .attr('opacity', '0.8')
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: Hex) => {
        event.stopPropagation();
        onHexClick(d);
      })
      .on('mouseover', function() {
        d3.select(this)
          .attr('opacity', '1')
          .style('filter', 'drop-shadow(0 0 10px currentColor)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', '0.8')
          .style('filter', 'none');
      });

    // Render gang logos on hexes
    hexes.forEach(hex => {
      if (hex.gang) {
        const { x, y } = hexToPixel(hex.q, hex.r, hexSize);

        const logoGroup = mainGroup.append('g')
          .attr('transform', `translate(${x}, ${y}) scale(0.3)`);

        // Parse and append SVG logo
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(hex.gang.logoSvg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        logoGroup.node()?.appendChild(svgElement);
      }
    });

    // Add click handler for panning
    svg.on('mousedown', (event: MouseEvent) => {
      event.preventDefault();
      const startX = event.clientX - pan.x;
      const startY = event.clientY - pan.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        onPan({
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        });
      };

      const handleMouseUp = () => {
        svg.on('mousemove', null);
        svg.on('mouseup', null);
      };

      svg.on('mousemove', handleMouseMove);
      svg.on('mouseup', handleMouseUp);
    });

    // Handle mouse wheel for zooming
    svg.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      // Zoom handling will be done by parent component
    });
  };

  return (
    <svg
      ref={svgRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#050510'
      }}
    />
  );
};
