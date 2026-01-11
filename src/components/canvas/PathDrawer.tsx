import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PathPoint, CharacterPath, Character, EFFECT_CONFIG, EffectType } from '../../types';

interface PathDrawerProps {
  paths: CharacterPath[];
  characters: Character[];
  selectedCharacterId: string | null;
  isDrawing: boolean;
  currentDrawingPath: PathPoint[];
  onPointClick?: (characterId: string, pointIndex: number, point: PathPoint) => void;
  showAllPaths?: boolean;
}

export function PathDrawer({
  paths,
  characters,
  selectedCharacterId,
  isDrawing,
  currentDrawingPath,
  onPointClick,
  showAllPaths = true,
}: PathDrawerProps) {
  const getCharacterColor = (characterId: string) => {
    const char = characters.find(c => c.id === characterId);
    return char?.color || '#6366f1';
  };

  const pathsToRender = showAllPaths
    ? paths
    : paths.filter(p => p.characterId === selectedCharacterId);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        {/* Arrow marker for path direction */}
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" opacity="0.7" />
        </marker>

        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render existing paths */}
      {pathsToRender.map(path => (
        <PathLine
          key={path.characterId}
          path={path}
          color={getCharacterColor(path.characterId)}
          isSelected={path.characterId === selectedCharacterId}
          onPointClick={onPointClick}
        />
      ))}

      {/* Render current drawing path */}
      {isDrawing && currentDrawingPath.length > 1 && (
        <PathLine
          path={{
            characterId: selectedCharacterId || '',
            points: currentDrawingPath,
            speed: 100,
          }}
          color={getCharacterColor(selectedCharacterId || '')}
          isSelected={true}
          isDrawing={true}
        />
      )}
    </svg>
  );
}

interface PathLineProps {
  path: CharacterPath;
  color: string;
  isSelected: boolean;
  isDrawing?: boolean;
  onPointClick?: (characterId: string, pointIndex: number, point: PathPoint) => void;
}

function PathLine({ path, color, isSelected, isDrawing, onPointClick }: PathLineProps) {
  const points = path.points;
  if (points.length < 2) return null;

  // Create SVG path string
  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  return (
    <g style={{ color }}>
      {/* Path line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={isDrawing ? "none" : "8 4"}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSelected ? 0.9 : 0.5}
        filter={isSelected ? "url(#glow)" : undefined}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Direction arrows along path */}
      {!isDrawing && points.length > 2 && (
        <>
          {points.slice(0, -1).map((point, i) => {
            if (i % 3 !== 1) return null; // Show arrow every 3 segments
            const nextPoint = points[i + 1];
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;
            const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

            return (
              <g key={`arrow-${i}`} transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                <polygon
                  points="-6,-4 6,0 -6,4"
                  fill={color}
                  opacity={isSelected ? 0.8 : 0.4}
                />
              </g>
            );
          })}
        </>
      )}

      {/* Waypoints */}
      {!isDrawing && points.map((point, i) => (
        <WaypointMarker
          key={`waypoint-${i}`}
          point={point}
          index={i}
          isFirst={i === 0}
          isLast={i === points.length - 1}
          color={color}
          isSelected={isSelected}
          onClick={() => onPointClick?.(path.characterId, i, point)}
        />
      ))}
    </g>
  );
}

interface WaypointMarkerProps {
  point: PathPoint;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
}

function WaypointMarker({
  point,
  index,
  isFirst,
  isLast,
  color,
  isSelected,
  onClick,
}: WaypointMarkerProps) {
  const effect = point.effect || 'normal';
  const effectConfig = EFFECT_CONFIG[effect as EffectType];
  const hasEffect = effect !== 'normal';

  const size = isFirst || isLast ? 14 : hasEffect ? 12 : 8;

  return (
    <g
      className="pointer-events-auto cursor-pointer"
      onClick={onClick}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Outer ring for start/end */}
      {(isFirst || isLast) && (
        <circle
          cx={point.x}
          cy={point.y}
          r={size + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.5}
        />
      )}

      {/* Main circle */}
      <motion.circle
        cx={point.x}
        cy={point.y}
        r={size}
        fill={hasEffect ? '#1f2937' : color}
        stroke={color}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.02, type: 'spring', stiffness: 500 }}
        whileHover={{ scale: 1.3 }}
      />

      {/* Effect icon */}
      {hasEffect && (
        <text
          x={point.x}
          y={point.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          className="pointer-events-none select-none"
        >
          {effectConfig.icon}
        </text>
      )}

      {/* Start/End labels */}
      {isFirst && (
        <text
          x={point.x}
          y={point.y - size - 8}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight="bold"
          className="pointer-events-none"
        >
          START
        </text>
      )}
      {isLast && !isFirst && (
        <text
          x={point.x}
          y={point.y - size - 8}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight="bold"
          className="pointer-events-none"
        >
          END
        </text>
      )}
    </g>
  );
}
