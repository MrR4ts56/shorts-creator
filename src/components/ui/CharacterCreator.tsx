import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character, DEFAULT_COLORS } from '../../types';

interface CharacterCreatorProps {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (type: 'survivor' | 'killer') => void;
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onRemove: (id: string) => void;
}

export function CharacterCreator({
  characters,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: CharacterCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedCharacter = characters.find(c => c.id === selectedId);
  const survivors = characters.filter(c => c.type === 'survivor');
  const killers = characters.filter(c => c.type === 'killer');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedId) {
      const url = URL.createObjectURL(file);
      onUpdate(selectedId, { imageUrl: url });
    }
  };

  return (
    <div className="space-y-6">
      {/* Survivors Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            ผู้รอดชีวิต ({survivors.length}/5)
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAdd('survivor')}
            disabled={survivors.length >= 5}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            + เพิ่ม
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {survivors.map((char) => (
              <CharacterBubble
                key={char.id}
                character={char}
                isSelected={selectedId === char.id}
                onClick={() => onSelect(char.id)}
              />
            ))}
          </AnimatePresence>
          {survivors.length === 0 && (
            <p className="text-gray-500 text-sm">ยังไม่มีผู้รอดชีวิต</p>
          )}
        </div>
      </div>

      {/* Killer Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            ฆาตกร ({killers.length}/1)
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAdd('killer')}
            disabled={killers.length >= 1}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            + เพิ่ม
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {killers.map((char) => (
              <CharacterBubble
                key={char.id}
                character={char}
                isSelected={selectedId === char.id}
                onClick={() => onSelect(char.id)}
              />
            ))}
          </AnimatePresence>
          {killers.length === 0 && (
            <p className="text-gray-500 text-sm">ยังไม่มีฆาตกร</p>
          )}
        </div>
      </div>

      {/* Character Editor */}
      <AnimatePresence>
        {selectedCharacter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-dark-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">แก้ไขตัวละคร</h4>
                <button
                  onClick={() => onRemove(selectedCharacter.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ลบ
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">ชื่อ</label>
                <input
                  type="text"
                  value={selectedCharacter.name}
                  onChange={(e) => onUpdate(selectedCharacter.id, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ขนาด: {selectedCharacter.size}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={selectedCharacter.size}
                  onChange={(e) => onUpdate(selectedCharacter.id, { size: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">สีขอบ</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdate(selectedCharacter.id, { color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedCharacter.color === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">รูปหน้า</label>
                <div className="flex items-center gap-3">
                  {selectedCharacter.imageUrl ? (
                    <div className="relative">
                      <img
                        src={selectedCharacter.imageUrl}
                        alt="Character"
                        className="w-16 h-16 rounded-full object-cover border-2"
                        style={{ borderColor: selectedCharacter.color }}
                      />
                      <button
                        onClick={() => onUpdate(selectedCharacter.id, { imageUrl: null })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </motion.button>
                  )}
                  <span className="text-sm text-gray-500">
                    {selectedCharacter.imageUrl ? 'คลิกรูปเพื่อลบ' : 'อัพโหลดรูปหน้า'}
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CharacterBubble({
  character,
  isSelected,
  onClick,
}: {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
        isSelected ? 'bg-dark-200' : 'hover:bg-dark-200/50'
      }`}
    >
      <div
        className="rounded-full flex items-center justify-center overflow-hidden border-4"
        style={{
          width: 50,
          height: 50,
          borderColor: character.color,
          backgroundColor: character.imageUrl ? 'transparent' : '#374151',
        }}
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl">
            {character.type === 'killer' ? '🔪' : '😊'}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-300 max-w-[60px] truncate">
        {character.name}
      </span>
      {isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
        />
      )}
    </motion.button>
  );
}
