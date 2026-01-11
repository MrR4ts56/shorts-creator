import { useState, useCallback, useRef } from 'react';
import { PathPoint, CharacterPath } from '../types';

interface UsePathDrawingOptions {
  onPathUpdate: (characterId: string, path: Partial<CharacterPath>) => void;
  getCharacterPath: (characterId: string) => CharacterPath | undefined;
}

export function usePathDrawing({ onPathUpdate, getCharacterPath }: UsePathDrawingOptions) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const drawingCharacterIdRef = useRef<string | null>(null);

  const startDrawing = useCallback((characterId: string, startX: number, startY: number) => {
    const existingPath = getCharacterPath(characterId);
    const startPoint: PathPoint = {
      x: startX,
      y: startY,
      time: 0,
      effect: 'normal',
      opacity: 1,
    };

    drawingCharacterIdRef.current = characterId;
    setIsDrawing(true);

    if (existingPath && existingPath.points.length > 0) {
      setCurrentPath(existingPath.points);
      lastPointRef.current = existingPath.points[existingPath.points.length - 1];
    } else {
      setCurrentPath([startPoint]);
      lastPointRef.current = { x: startX, y: startY };
    }
  }, [getCharacterPath]);

  const continueDrawing = useCallback((x: number, y: number, speed: number = 100) => {
    if (!isDrawing || !lastPointRef.current) return;

    const lastPoint = lastPointRef.current;
    const distance = Math.sqrt(
      Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
    );

    // Only add point if moved enough distance (reduces noise)
    if (distance < 10) return;

    const lastTime = currentPath.length > 0 ? currentPath[currentPath.length - 1].time : 0;
    const timeDelta = distance / speed;

    const newPoint: PathPoint = {
      x,
      y,
      time: lastTime + timeDelta,
      effect: 'normal',
      opacity: 1,
    };

    setCurrentPath(prev => [...prev, newPoint]);
    lastPointRef.current = { x, y };
  }, [isDrawing, currentPath]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !drawingCharacterIdRef.current) return;

    const characterId = drawingCharacterIdRef.current;
    const existingPath = getCharacterPath(characterId);

    onPathUpdate(characterId, {
      points: currentPath,
      speed: existingPath?.speed || 100,
    });

    setIsDrawing(false);
    setCurrentPath([]);
    lastPointRef.current = null;
    drawingCharacterIdRef.current = null;
  }, [isDrawing, currentPath, onPathUpdate, getCharacterPath]);

  const clearPath = useCallback((characterId: string) => {
    onPathUpdate(characterId, { points: [] });
  }, [onPathUpdate]);

  const addPointToPath = useCallback((characterId: string, point: PathPoint) => {
    const existingPath = getCharacterPath(characterId);
    const points = existingPath?.points || [];

    onPathUpdate(characterId, {
      points: [...points, point],
    });
  }, [getCharacterPath, onPathUpdate]);

  const updatePointEffect = useCallback((
    characterId: string,
    pointIndex: number,
    effect: PathPoint['effect'],
    opacity?: number
  ) => {
    const existingPath = getCharacterPath(characterId);
    if (!existingPath) return;

    const newPoints = [...existingPath.points];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      effect,
      opacity: opacity ?? (effect === 'hiding' ? 0.3 : effect === 'dead' ? 0 : 1),
    };

    onPathUpdate(characterId, { points: newPoints });
  }, [getCharacterPath, onPathUpdate]);

  const removePoint = useCallback((characterId: string, pointIndex: number) => {
    const existingPath = getCharacterPath(characterId);
    if (!existingPath) return;

    const newPoints = existingPath.points.filter((_, i) => i !== pointIndex);

    // Recalculate times
    let accumulatedTime = 0;
    const recalculatedPoints = newPoints.map((point, i) => {
      if (i === 0) return { ...point, time: 0 };

      const prevPoint = newPoints[i - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      accumulatedTime += distance / (existingPath.speed || 100);

      return { ...point, time: accumulatedTime };
    });

    onPathUpdate(characterId, { points: recalculatedPoints });
  }, [getCharacterPath, onPathUpdate]);

  const updateSpeed = useCallback((characterId: string, speed: number) => {
    const existingPath = getCharacterPath(characterId);
    if (!existingPath) return;

    // Recalculate times based on new speed
    let accumulatedTime = 0;
    const recalculatedPoints = existingPath.points.map((point, i) => {
      if (i === 0) return { ...point, time: 0 };

      const prevPoint = existingPath.points[i - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      accumulatedTime += distance / speed;

      return { ...point, time: accumulatedTime };
    });

    onPathUpdate(characterId, { points: recalculatedPoints, speed });
  }, [getCharacterPath, onPathUpdate]);

  return {
    isDrawing,
    currentPath,
    drawingCharacterId: drawingCharacterIdRef.current,
    startDrawing,
    continueDrawing,
    stopDrawing,
    clearPath,
    addPointToPath,
    updatePointEffect,
    removePoint,
    updateSpeed,
  };
}

export type UsePathDrawingReturn = ReturnType<typeof usePathDrawing>;
