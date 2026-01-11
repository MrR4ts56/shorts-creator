export interface Character {
  id: string;
  name: string;
  type: 'survivor' | 'killer';
  imageUrl: string | null;
  color: string;
  size: number;
}

export interface PathPoint {
  x: number;
  y: number;
  time: number;
  duration?: number; // How long to stay at this point (seconds)
  effect?: EffectType;
  opacity?: number;
  killTargetId?: string; // For killer: which survivor to kill at this point
}

export interface CharacterPath {
  characterId: string;
  points: PathPoint[];
  speed: number;
}

export interface MapPreset {
  id: string;
  name: string;
  imageUrl: string;
  thumbnail: string;
}

export interface Project {
  id: string;
  name: string;
  canvasSize: { width: number; height: number };
  map: MapPreset | null;
  characters: Character[];
  paths: CharacterPath[];
  duration: number;
  killerDelay: number; // Seconds before killer starts (hide phase duration)
  startPause: number; // Seconds to pause at start (blur screen, no action)
  endPause: number; // Seconds to pause at end (blur screen, no action)
}

export type Phase = 'setup' | 'editor' | 'render';

export type EffectType = 'normal' | 'hiding' | 'dead' | 'escaped' | 'fallen' | 'kill';

export const EFFECT_CONFIG: Record<EffectType, { label: string; icon: string; opacity: number; forKiller?: boolean }> = {
  normal: { label: 'ปกติ', icon: '🚶', opacity: 1 },
  hiding: { label: 'ซ่อนตัว', icon: '👻', opacity: 0.3 },
  dead: { label: 'ตาย', icon: '💀', opacity: 0 },
  escaped: { label: 'หนีรอด', icon: '🏃', opacity: 1 },
  fallen: { label: 'ล้ม', icon: '😵', opacity: 1 },
  kill: { label: 'สังหาร', icon: '🔪', opacity: 1, forKiller: true },
};

export const SURVIVOR_EFFECTS: EffectType[] = ['normal', 'hiding', 'escaped', 'fallen'];
export const KILLER_EFFECTS: EffectType[] = ['normal', 'kill', 'dead'];

export const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const CANVAS_SIZES = {
  preview: { width: 360, height: 640 },
  export: { width: 1080, height: 1920 },
};
