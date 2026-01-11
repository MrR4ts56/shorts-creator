import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPreset } from '../../types';

const PRESET_MAPS: MapPreset[] = [
  {
    id: 'warehouse',
    name: 'โกดัง',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=711&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=356&fit=crop',
  },
  {
    id: 'forest',
    name: 'ป่า',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=711&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&h=356&fit=crop',
  },
  {
    id: 'hospital',
    name: 'โรงพยาบาล',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=711&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=356&fit=crop',
  },
  {
    id: 'school',
    name: 'โรงเรียน',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=711&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=356&fit=crop',
  },
];

interface MapSelectorProps {
  selectedMap: MapPreset | null;
  onSelectMap: (map: MapPreset | null) => void;
}

export function MapSelector({ selectedMap, onSelectMap }: MapSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const customMap: MapPreset = {
        id: 'custom-' + Date.now(),
        name: 'Custom Map',
        imageUrl: url,
        thumbnail: url,
      };
      onSelectMap(customMap);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">เลือกแผนที่</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRESET_MAPS.map((map) => (
          <motion.button
            key={map.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMap(map)}
            className={`relative aspect-shorts rounded-lg overflow-hidden border-2 transition-colors ${
              selectedMap?.id === map.id
                ? 'border-primary ring-2 ring-primary/50'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <img
              src={map.thumbnail}
              alt={map.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <span className="text-white text-sm font-medium">{map.name}</span>
            </div>
            {selectedMap?.id === map.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-500 text-sm">หรือ</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>อัพโหลดแผนที่ของคุณ</span>
        </div>
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
