import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  from?: number;
  onComplete: () => void;
}

export function Countdown({ from = 3, onComplete }: CountdownProps) {
  const [count, setCount] = useState(from);
  const onCompleteRef = useRef(onComplete);

  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (count === 0) {
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              className="text-9xl font-bold text-white"
              style={{
                textShadow: '0 0 40px rgba(99, 102, 241, 0.8), 0 0 80px rgba(99, 102, 241, 0.4)',
              }}
            >
              {count}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mt-4"
            >
              {count === 3 && 'เตรียมตัว...'}
              {count === 2 && 'พร้อม...'}
              {count === 1 && 'ไป!'}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-6xl font-bold text-primary"
            style={{
              textShadow: '0 0 40px rgba(99, 102, 241, 0.8)',
            }}
          >
            START!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
