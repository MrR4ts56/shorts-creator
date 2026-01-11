import { motion } from 'framer-motion';
import { Character, MapPreset, CANVAS_SIZES } from '../../types';

interface GameCanvasProps {
  map: MapPreset | null;
  characters: Character[];
  selectedCharacterId: string | null;
  onSelectCharacter?: (id: string | null) => void;
  showCharacters?: boolean;
  showNames?: boolean;
  isRenderMode?: boolean;
}

export function GameCanvas({
  map,
  characters,
  selectedCharacterId,
  onSelectCharacter,
  showCharacters = true,
  showNames = true,
  isRenderMode = false,
}: GameCanvasProps) {
  const { width, height } = CANVAS_SIZES.preview;

  return (
    <div
      className="relative bg-dark-300 rounded-xl overflow-hidden shadow-2xl mx-auto select-none"
      style={{ width, height, userSelect: 'none' }}
    >
      {/* Map Background */}
      {map ? (
        <img
          src={map.imageUrl}
          alt={map.name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
          style={{ userSelect: 'none' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">เลือกแผนที่</p>
          </div>
        </div>
      )}

      {/* Overlay for better visibility */}
      {map && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}

      {/* Characters */}
      {showCharacters && characters.map((char, index) => (
        <CharacterSprite
          key={char.id}
          character={char}
          isSelected={selectedCharacterId === char.id}
          onClick={() => onSelectCharacter?.(char.id)}
          initialPosition={{
            x: width / 2 + (index - characters.length / 2) * 60,
            y: height - 100,
          }}
          showName={showNames}
          isRenderMode={isRenderMode}
        />
      ))}

      {/* Canvas Info */}
      {!isRenderMode && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-gray-300 pointer-events-none">
          {width} × {height}
        </div>
      )}
    </div>
  );
}

interface CharacterSpriteProps {
  character: Character;
  isSelected: boolean;
  onClick?: () => void;
  initialPosition: { x: number; y: number };
  position?: { x: number; y: number };
  opacity?: number;
  effect?: string;
  showName?: boolean;
  isRenderMode?: boolean;
  isShaking?: boolean;
}

export function CharacterSprite({
  character,
  isSelected,
  onClick,
  initialPosition,
  position,
  opacity = 1,
  effect,
  showName = true,
  isRenderMode = false,
  isShaking = false,
}: CharacterSpriteProps) {
  const pos = position || initialPosition;
  const size = character.size;

  // Effect-based styling
  const isDead = effect === 'dead';
  const isEscaped = effect === 'escaped';
  const isHiding = effect === 'hiding' && !isDead;
  const isFallen = effect === 'fallen';

  // Shake animation keyframes
  const shakeAnimation = isShaking ? {
    x: [pos.x - size / 2 - 3, pos.x - size / 2 + 3, pos.x - size / 2 - 3, pos.x - size / 2 + 3, pos.x - size / 2],
  } : {};

  // Don't render if escaped
  if (isEscaped) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: initialPosition.x - size / 2, y: initialPosition.y - size / 2 }}
      animate={{
        x: pos.x - size / 2,
        y: pos.y - size / 2,
        opacity: isDead ? 1 : opacity,
        scale: isFallen ? 0.8 : 1,
        rotate: isFallen ? 15 : 0,
        ...shakeAnimation,
      }}
      transition={isShaking ? {
        x: {
          repeat: Infinity,
          duration: 0.1,
          ease: 'linear',
        },
        default: {
          type: 'tween',
          duration: 0.3,
          ease: 'easeOut',
        },
      } : {
        type: 'tween',
        duration: 0.3,
        ease: 'easeOut',
      }}
      whileHover={!isRenderMode ? { scale: 1.1 } : undefined}
      whileTap={!isRenderMode ? { scale: 0.95 } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`absolute select-none ${isRenderMode ? '' : 'cursor-pointer'} ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        width: size,
        height: size,
        userSelect: 'none',
        filter: (isHiding && !isDead) ? 'blur(1px)' : undefined,
      }}
    >
      {/* Selection Ring */}
      {isSelected && !isRenderMode && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 rounded-full border-2 border-white"
          style={{
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.5)',
          }}
        />
      )}

      {/* Character Body */}
      <div
        className="w-full h-full rounded-full overflow-hidden border-4 flex items-center justify-center"
        style={{
          borderColor: isDead ? '#6b7280' : character.color,
          backgroundColor: isDead ? '#1f2937' : (character.imageUrl ? 'transparent' : '#374151'),
          boxShadow: isDead ? '0 4px 12px rgba(0,0,0,0.5)' : `0 4px 12px ${character.color}40`,
          opacity: isDead ? 1 : (isHiding ? 0.4 : 1),
        }}
      >
        {isDead ? (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ fontSize: size * 0.5 }}
            className="pointer-events-none"
          >
            💀
          </motion.span>
        ) : character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
            style={{ userSelect: 'none' }}
          />
        ) : (
          <span style={{ fontSize: size * 0.4 }} className="pointer-events-none">
            {character.type === 'killer' ? '🔪' : '😊'}
          </span>
        )}
      </div>

      {/* Killer Icon */}
      {character.type === 'killer' && !isRenderMode && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
          <span className="text-xs">🔪</span>
        </div>
      )}

      {/* Name Tag */}
      {showName && !isRenderMode && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <span
            className="px-2 py-0.5 bg-black/70 rounded text-xs text-white"
            style={{ borderBottom: `2px solid ${character.color}` }}
          >
            {character.name}
          </span>
        </div>
      )}

      {/* Hiding ghost effect */}
      {isHiding && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <span className="text-lg">👻</span>
        </motion.div>
      )}
    </motion.div>
  );
}
