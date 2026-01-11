import { useState, useCallback } from 'react';
import { Character, CharacterPath, MapPreset, Project, Phase, CANVAS_SIZES, DEFAULT_COLORS, PathPoint } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultProject = (): Project => ({
  id: generateId(),
  name: 'Untitled Project',
  canvasSize: CANVAS_SIZES.preview,
  map: null,
  characters: [],
  paths: [],
  duration: 30, // Increased default duration
  killerDelay: 5, // Default 5 seconds before killer starts
  startPause: 0, // Seconds to pause at start
  endPause: 0, // Seconds to pause at end
});

export function useProject() {
  const [project, setProject] = useState<Project>(createDefaultProject);
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const setMap = useCallback((map: MapPreset | null) => {
    setProject(prev => ({ ...prev, map }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setProject(prev => ({ ...prev, duration: Math.max(5, Math.min(120, duration)) }));
  }, []);

  const setKillerDelay = useCallback((killerDelay: number) => {
    setProject(prev => ({ ...prev, killerDelay: Math.max(0, Math.min(30, killerDelay)) }));
  }, []);

  const setStartPause = useCallback((startPause: number) => {
    setProject(prev => ({ ...prev, startPause: Math.max(0, Math.min(30, startPause)) }));
  }, []);

  const setEndPause = useCallback((endPause: number) => {
    setProject(prev => ({ ...prev, endPause: Math.max(0, Math.min(30, endPause)) }));
  }, []);

  const addCharacter = useCallback((type: 'survivor' | 'killer') => {
    const existingCount = project.characters.filter(c => c.type === type).length;

    if (type === 'survivor' && existingCount >= 5) return null;
    if (type === 'killer' && existingCount >= 1) return null;

    const usedColors = project.characters.map(c => c.color);
    const availableColor = DEFAULT_COLORS.find(c => !usedColors.includes(c)) || DEFAULT_COLORS[0];

    const newCharacter: Character = {
      id: generateId(),
      name: type === 'killer' ? 'Killer' : `Survivor ${existingCount + 1}`,
      type,
      imageUrl: null,
      color: type === 'killer' ? '#1f1f1f' : availableColor,
      size: type === 'killer' ? 50 : 40,
    };

    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
    }));

    return newCharacter;
  }, [project.characters]);

  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id),
      paths: prev.paths.filter(p => p.characterId !== id),
    }));
    if (selectedCharacterId === id) {
      setSelectedCharacterId(null);
    }
  }, [selectedCharacterId]);

  const updatePath = useCallback((characterId: string, path: Partial<CharacterPath>) => {
    setProject(prev => {
      const existingIndex = prev.paths.findIndex(p => p.characterId === characterId);

      if (existingIndex >= 0) {
        const newPaths = [...prev.paths];
        newPaths[existingIndex] = { ...newPaths[existingIndex], ...path };
        return { ...prev, paths: newPaths };
      } else {
        const newPath: CharacterPath = {
          characterId,
          points: [],
          speed: 100,
          ...path,
        };
        return { ...prev, paths: [...prev.paths, newPath] };
      }
    });
  }, []);

  const updatePathPoint = useCallback((characterId: string, pointIndex: number, updates: Partial<PathPoint>) => {
    setProject(prev => {
      const pathIndex = prev.paths.findIndex(p => p.characterId === characterId);
      if (pathIndex < 0) return prev;

      const newPaths = [...prev.paths];
      const newPoints = [...newPaths[pathIndex].points];

      if (pointIndex < 0 || pointIndex >= newPoints.length) return prev;

      newPoints[pointIndex] = { ...newPoints[pointIndex], ...updates };
      newPaths[pathIndex] = { ...newPaths[pathIndex], points: newPoints };

      return { ...prev, paths: newPaths };
    });
  }, []);

  const getCharacterPath = useCallback((characterId: string) => {
    return project.paths.find(p => p.characterId === characterId);
  }, [project.paths]);

  const resetProject = useCallback(() => {
    setProject(createDefaultProject());
    setPhase('setup');
    setSelectedCharacterId(null);
  }, []);

  const canProceedToEditor = project.map !== null && project.characters.length > 0;
  const canProceedToRender = project.paths.some(p => p.points.length > 1);

  return {
    project,
    phase,
    setPhase,
    selectedCharacterId,
    setSelectedCharacterId,
    setMap,
    setDuration,
    setKillerDelay,
    setStartPause,
    setEndPause,
    addCharacter,
    updateCharacter,
    removeCharacter,
    updatePath,
    updatePathPoint,
    getCharacterPath,
    resetProject,
    canProceedToEditor,
    canProceedToRender,
  };
}

export type UseProjectReturn = ReturnType<typeof useProject>;
