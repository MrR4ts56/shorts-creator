import { motion, AnimatePresence } from 'framer-motion';
import { PathPoint, EFFECT_CONFIG, EffectType } from '../../types';

interface EffectPickerProps {
  isOpen: boolean;
  position: { x: number; y: number };
  currentEffect: PathPoint['effect'];
  onSelect: (effect: EffectType) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function EffectPicker({
  isOpen,
  position,
  currentEffect,
  onSelect,
  onClose,
  onDelete,
}: EffectPickerProps) {
  const effects = Object.entries(EFFECT_CONFIG) as [EffectType, typeof EFFECT_CONFIG[EffectType]][];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute z-50 bg-dark-200 rounded-xl shadow-xl border border-gray-700 p-2 min-w-[160px]"
            style={{
              left: Math.min(position.x, window.innerWidth - 200),
              top: position.y + 20,
            }}
          >
            <div className="text-xs text-gray-500 px-2 py-1 mb-1">เลือก Effect</div>

            {effects.map(([key, config]) => (
              <motion.button
                key={key}
                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentEffect === key
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm">{config.label}</span>
                {currentEffect === key && (
                  <svg className="w-4 h-4 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </motion.button>
            ))}

            {onDelete && (
              <>
                <div className="h-px bg-gray-700 my-2" />
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300"
                >
                  <span className="text-lg">🗑️</span>
                  <span className="text-sm">ลบจุดนี้</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
