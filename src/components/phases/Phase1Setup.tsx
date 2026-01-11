import { motion } from 'framer-motion';
import { MapSelector } from '../ui/MapSelector';
import { CharacterCreator } from '../ui/CharacterCreator';
import { GameCanvas } from '../canvas/GameCanvas';
import { UseProjectReturn } from '../../hooks/useProject';

interface Phase1SetupProps {
  project: UseProjectReturn['project'];
  selectedCharacterId: UseProjectReturn['selectedCharacterId'];
  setSelectedCharacterId: UseProjectReturn['setSelectedCharacterId'];
  setMap: UseProjectReturn['setMap'];
  addCharacter: UseProjectReturn['addCharacter'];
  updateCharacter: UseProjectReturn['updateCharacter'];
  removeCharacter: UseProjectReturn['removeCharacter'];
  canProceedToEditor: boolean;
  onNext: () => void;
}

export function Phase1Setup({
  project,
  selectedCharacterId,
  setSelectedCharacterId,
  setMap,
  addCharacter,
  updateCharacter,
  removeCharacter,
  canProceedToEditor,
  onNext,
}: Phase1SetupProps) {
  return (
    <div className="min-h-screen bg-dark-300 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Shorts Creator
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          สร้าง YouTube Shorts แนว Hide and Seek
        </motion.p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <StepIndicator number={1} label="ตั้งค่า" active />
          <div className="flex-1 h-px bg-gray-700" />
          <StepIndicator number={2} label="วาด Path" />
          <div className="flex-1 h-px bg-gray-700" />
          <StepIndicator number={3} label="Render" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Map Selection */}
          <section className="p-6 bg-dark-200 rounded-2xl">
            <MapSelector
              selectedMap={project.map}
              onSelectMap={setMap}
            />
          </section>

          {/* Character Creation */}
          <section className="p-6 bg-dark-200 rounded-2xl">
            <CharacterCreator
              characters={project.characters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              onAdd={addCharacter}
              onUpdate={updateCharacter}
              onRemove={removeCharacter}
            />
          </section>
        </motion.div>

        {/* Right: Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Preview
            </h3>
            <GameCanvas
              map={project.map}
              characters={project.characters}
              selectedCharacterId={selectedCharacterId}
              onSelectCharacter={setSelectedCharacterId}
            />

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              disabled={!canProceedToEditor}
              className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                canProceedToEditor
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canProceedToEditor ? (
                <span className="flex items-center justify-center gap-2">
                  ไปขั้นตอนถัดไป
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              ) : (
                <span>เลือกแผนที่และสร้างตัวละครก่อน</span>
              )}
            </motion.button>

            {/* Requirements Checklist */}
            <div className="mt-4 space-y-2">
              <ChecklistItem
                checked={project.map !== null}
                label="เลือกแผนที่"
              />
              <ChecklistItem
                checked={project.characters.length > 0}
                label="สร้างตัวละครอย่างน้อย 1 ตัว"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active = false,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
          active
            ? 'bg-primary text-white'
            : 'bg-gray-700 text-gray-400'
        }`}
      >
        {number}
      </div>
      <span className={active ? 'text-white' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  );
}

function ChecklistItem({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          checked ? 'bg-green-500' : 'bg-gray-700'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={checked ? 'text-gray-300' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  );
}
