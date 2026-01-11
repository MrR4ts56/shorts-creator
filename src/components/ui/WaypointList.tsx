import { motion } from 'framer-motion';
import {
  Character,
  CharacterPath,
  PathPoint,
  EffectType,
  EFFECT_CONFIG,
  SURVIVOR_EFFECTS,
  KILLER_EFFECTS
} from '../../types';

interface WaypointListProps {
  character: Character;
  path: CharacterPath | undefined;
  survivors: Character[];
  onUpdatePoint: (pointIndex: number, updates: Partial<PathPoint>) => void;
  onDeletePoint: (pointIndex: number) => void;
  onClearPath: () => void;
}

export function WaypointList({
  character,
  path,
  survivors,
  onUpdatePoint,
  onDeletePoint,
  onClearPath,
}: WaypointListProps) {
  const points = path?.points || [];
  const isKiller = character.type === 'killer';
  const availableEffects = isKiller ? KILLER_EFFECTS : SURVIVOR_EFFECTS;

  if (points.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <div className="text-3xl mb-2">📍</div>
        <p className="text-sm">คลิกบน Canvas เพื่อเพิ่มจุดเดิน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{points.length} จุด</span>
        <button
          onClick={onClearPath}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          ล้างทั้งหมด
        </button>
      </div>

      {/* Waypoint List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {points.map((point, index) => (
          <WaypointItem
            key={index}
            index={index}
            point={point}
            character={character}
            isKiller={isKiller}
            availableEffects={availableEffects}
            survivors={survivors}
            onUpdate={(updates) => onUpdatePoint(index, updates)}
            onDelete={() => onDeletePoint(index)}
            isFirst={index === 0}
            isLast={index === points.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface WaypointItemProps {
  index: number;
  point: PathPoint;
  character: Character;
  isKiller: boolean;
  availableEffects: EffectType[];
  survivors: Character[];
  onUpdate: (updates: Partial<PathPoint>) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function WaypointItem({
  index,
  point,
  character,
  isKiller,
  availableEffects,
  survivors,
  onUpdate,
  onDelete,
  isFirst,
  isLast,
}: WaypointItemProps) {
  const currentEffect = point.effect || 'normal';
  const effectConfig = EFFECT_CONFIG[currentEffect];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-300 rounded-lg p-3 space-y-2"
    >
      {/* Header Row */}
      <div className="flex items-center gap-2">
        {/* Color indicator */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: character.color }}
        />

        {/* Waypoint label */}
        <span className="text-sm text-gray-300 flex-1">
          {isFirst ? '🚩 จุดเริ่ม' : isLast ? '🏁 จุดสุดท้าย' : `จุดที่ ${index + 1}`}
        </span>

        {/* Delete button (not for first point) */}
        {!isFirst && (
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Effect Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-14">Action:</span>
        <select
          value={currentEffect}
          onChange={(e) => {
            const effect = e.target.value as EffectType;
            onUpdate({
              effect,
              opacity: EFFECT_CONFIG[effect].opacity,
              // Clear kill target if not kill effect
              killTargetId: effect === 'kill' ? point.killTargetId : undefined,
            });
          }}
          className="flex-1 bg-dark-200 text-white text-sm rounded px-2 py-1.5 border border-gray-700 focus:border-primary focus:outline-none"
        >
          {availableEffects.map(effect => (
            <option key={effect} value={effect}>
              {EFFECT_CONFIG[effect].icon} {EFFECT_CONFIG[effect].label}
            </option>
          ))}
        </select>
      </div>

      {/* Kill Target Selector (only for killer with kill effect) */}
      {isKiller && currentEffect === 'kill' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-14">เป้าหมาย:</span>
          <select
            value={point.killTargetId || ''}
            onChange={(e) => onUpdate({ killTargetId: e.target.value || undefined })}
            className="flex-1 bg-dark-200 text-white text-sm rounded px-2 py-1.5 border border-gray-700 focus:border-red-500 focus:outline-none"
          >
            <option value="">-- เลือกเป้าหมาย --</option>
            {survivors.map(survivor => (
              <option key={survivor.id} value={survivor.id}>
                {survivor.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Duration at this point */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-14">รอ:</span>
        <input
          type="number"
          min="0"
          max="10"
          step="0.5"
          value={point.duration || 0}
          onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) || 0 })}
          className="w-16 bg-dark-200 text-white text-sm rounded px-2 py-1.5 border border-gray-700 focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-gray-500">วินาที</span>
      </div>

      {/* Time info */}
      <div className="text-xs text-gray-600 flex justify-between">
        <span>เวลา: {point.time.toFixed(1)}s</span>
        <span>({Math.round(point.x)}, {Math.round(point.y)})</span>
      </div>
    </motion.div>
  );
}
