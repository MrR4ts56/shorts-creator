import { motion } from 'framer-motion';
import { Character, CharacterPath } from '../../types';

interface CharacterResult {
  character: Character;
  status: 'survived' | 'dead' | 'escaped';
}

interface ResultScreenProps {
  characters: Character[];
  paths: CharacterPath[];
  onReplay: () => void;
  onEdit: () => void;
  onNewProject: () => void;
}

export function ResultScreen({
  characters,
  paths,
  onReplay,
  onEdit,
  onNewProject,
}: ResultScreenProps) {
  // Find all kill targets from killer's path
  const killerPath = paths.find(p => {
    const character = characters.find(c => c.id === p.characterId);
    return character?.type === 'killer';
  });

  const killedCharacterIds = new Set<string>();
  if (killerPath) {
    for (const point of killerPath.points) {
      if (point.effect === 'kill' && point.killTargetId) {
        killedCharacterIds.add(point.killTargetId);
      }
    }
  }

  // Determine results based on kills and final effects
  const results: CharacterResult[] = characters
    .filter(c => c.type === 'survivor')
    .map(character => {
      const path = paths.find(p => p.characterId === character.id);
      const lastPoint = path?.points[path.points.length - 1];
      const finalEffect = lastPoint?.effect || 'normal';

      // Check if killed by killer
      if (killedCharacterIds.has(character.id)) {
        return { character, status: 'dead' as const };
      }

      // Check survivor's own effect
      if (finalEffect === 'dead') {
        return { character, status: 'dead' as const };
      }
      if (finalEffect === 'escaped') {
        return { character, status: 'escaped' as const };
      }

      return { character, status: 'survived' as const };
    });

  const survivors = results.filter(r => r.status === 'survived' || r.status === 'escaped');
  const dead = results.filter(r => r.status === 'dead');

  const killer = characters.find(c => c.type === 'killer');

  // Check if killer is dead
  const killerIsDead = killerPath?.points.some(p => p.effect === 'dead') ?? false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-b from-dark-300/95 to-black/95 z-50 flex flex-col items-center justify-center p-8"
    >
      {/* Title */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold text-white mb-2 text-center"
      >
        GAME OVER
      </motion.h1>

      <motion.p
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 mb-8"
      >
        {survivors.length > 0
          ? `${survivors.length} คนรอดชีวิต!`
          : 'ไม่มีใครรอด...'}
      </motion.p>

      {/* Results Grid */}
      <div className="w-full max-w-lg space-y-6 mb-8">
        {/* Survivors */}
        {survivors.length > 0 && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">✅</span> รอดชีวิต
            </h2>
            <div className="flex flex-wrap gap-3">
              {survivors.map(({ character, status }, i) => (
                <motion.div
                  key={character.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1, type: 'spring' }}
                  className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-2"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center"
                    style={{
                      borderColor: character.color,
                      backgroundColor: character.imageUrl ? 'transparent' : '#374151',
                    }}
                  >
                    {character.imageUrl ? (
                      <img src={character.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '😊'
                    )}
                  </div>
                  <span className="text-white text-sm">{character.name}</span>
                  {status === 'escaped' && <span className="text-xs">🏃</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dead */}
        {dead.length > 0 && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">💀</span> เสียชีวิต
            </h2>
            <div className="flex flex-wrap gap-3">
              {dead.map(({ character }, i) => (
                <motion.div
                  key={character.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, type: 'spring' }}
                  className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-2"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center bg-gray-800"
                    style={{
                      borderColor: '#6b7280',
                    }}
                  >
                    💀
                  </div>
                  <span className="text-gray-400 text-sm line-through">{character.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Killer */}
        {killer && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-4 border-t border-gray-700"
          >
            <h2 className={`${killerIsDead ? 'text-gray-400' : 'text-purple-400'} font-semibold mb-3 flex items-center gap-2`}>
              <span className="text-2xl">{killerIsDead ? '💀' : '🔪'}</span> ฆาตกร
            </h2>
            <div className={`flex items-center gap-3 ${killerIsDead ? 'bg-gray-500/20 border-gray-500/30' : 'bg-purple-500/20 border-purple-500/30'} border rounded-xl p-3`}>
              <div
                className="w-12 h-12 rounded-full border-3 overflow-hidden flex items-center justify-center"
                style={{
                  borderColor: killerIsDead ? '#6b7280' : killer.color,
                  backgroundColor: killerIsDead ? '#1f2937' : (killer.imageUrl ? 'transparent' : '#374151'),
                }}
              >
                {killerIsDead ? (
                  <span className="text-2xl">💀</span>
                ) : killer.imageUrl ? (
                  <img src={killer.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  '🔪'
                )}
              </div>
              <div>
                <div className={`font-medium ${killerIsDead ? 'text-gray-400 line-through' : 'text-white'}`}>{killer.name}</div>
                <div className={`text-sm ${killerIsDead ? 'text-gray-500' : 'text-purple-300'}`}>
                  {killerIsDead ? 'ถูกกำจัด!' : `ฆ่าไป ${dead.length} คน`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-wrap justify-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReplay}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-lg shadow-primary/30"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            เล่นซ้ำ
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="px-6 py-3 bg-dark-200 hover:bg-dark-100 text-white rounded-xl font-medium border border-gray-700"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            แก้ไข
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewProject}
          className="px-6 py-3 bg-dark-200 hover:bg-dark-100 text-gray-300 rounded-xl font-medium border border-gray-700"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            โปรเจคใหม่
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
