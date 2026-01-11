import { useState, useCallback, useRef, useEffect } from 'react';
import { Character, CharacterPath, PathPoint } from '../types';

interface CharacterState {
  x: number;
  y: number;
  opacity: number;
  effect: PathPoint['effect'];
  isVisible: boolean;
  isShaking: boolean;
  isDead: boolean;
}

interface UseAnimationOptions {
  paths: CharacterPath[];
  characters: Character[];
  duration: number;
  killerDelay?: number;
  startPause?: number;
  endPause?: number;
  onComplete?: () => void;
}

export function useAnimation({ paths, characters, duration, killerDelay = 0, startPause = 0, endPause = 0, onComplete }: UseAnimationOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [characterStates, setCharacterStates] = useState<Record<string, CharacterState>>({});
  const killedCharactersRef = useRef<Set<string>>(new Set());

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Get killer character ID
  const killerCharacter = characters.find(c => c.type === 'killer');
  const killerId = killerCharacter?.id;

  // Calculate animation duration (without pauses)
  const animationDuration = Math.max(
    duration,
    ...paths.map(p => {
      if (p.points.length === 0) return 0;
      const lastPoint = p.points[p.points.length - 1];
      const isKillerPath = p.characterId === killerId;
      const pathDuration = lastPoint.time + (lastPoint.duration || 0);
      // Add killer delay to killer's path duration
      return isKillerPath ? pathDuration + killerDelay : pathDuration;
    })
  );

  // Total duration includes start pause, animation, and end pause
  const totalDuration = startPause + animationDuration + endPause;

  // Check if currently in pause phase
  const isInStartPause = (time: number) => time < startPause;
  const isInEndPause = (time: number) => time >= startPause + animationDuration;
  const isInPausePhase = (time: number) => isInStartPause(time) || isInEndPause(time);

  // Get the effective animation time (subtracting startPause)
  const getAnimationTime = (time: number) => Math.max(0, time - startPause);

  // Get position of a character at a given time
  const getPositionAtTime = useCallback((
    path: CharacterPath,
    time: number,
    isKiller: boolean
  ): { x: number; y: number; atWaypoint: number | null; arrivedAtKillPoint: boolean; killTargetId?: string } => {
    const points = path.points;

    // For killer, apply delay
    const effectiveTime = isKiller ? Math.max(0, time - killerDelay) : time;

    if (points.length === 0) {
      return { x: 0, y: 0, atWaypoint: null, arrivedAtKillPoint: false };
    }

    if (points.length === 1) {
      return {
        x: points[0].x,
        y: points[0].y,
        atWaypoint: 0,
        arrivedAtKillPoint: points[0].effect === 'kill',
        killTargetId: points[0].killTargetId
      };
    }

    // Find which segment we're in
    for (let i = 0; i < points.length - 1; i++) {
      const pointDuration = points[i].duration || 0;
      const nextPointTime = points[i + 1].time;

      // At this waypoint (waiting period)
      if (effectiveTime >= points[i].time && effectiveTime < points[i].time + pointDuration) {
        return {
          x: points[i].x,
          y: points[i].y,
          atWaypoint: i,
          arrivedAtKillPoint: points[i].effect === 'kill',
          killTargetId: points[i].killTargetId
        };
      }

      // Moving between points
      if (effectiveTime >= points[i].time + pointDuration && effectiveTime < nextPointTime) {
        const segmentStartTime = points[i].time + pointDuration;
        const segmentDuration = nextPointTime - segmentStartTime;
        const progress = segmentDuration > 0 ? (effectiveTime - segmentStartTime) / segmentDuration : 0;

        // Smooth interpolation
        const smoothProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const x = points[i].x + (points[i + 1].x - points[i].x) * smoothProgress;
        const y = points[i].y + (points[i + 1].y - points[i].y) * smoothProgress;

        // Check if moving toward a kill point
        const isApproachingKill = points[i + 1].effect === 'kill';

        return {
          x,
          y,
          atWaypoint: null,
          arrivedAtKillPoint: false,
          killTargetId: isApproachingKill ? points[i + 1].killTargetId : undefined
        };
      }
    }

    // At or past last point
    const lastIndex = points.length - 1;
    const lastPoint = points[lastIndex];
    const lastPointEndTime = lastPoint.time + (lastPoint.duration || 0);

    if (effectiveTime >= lastPoint.time && effectiveTime < lastPointEndTime) {
      return {
        x: lastPoint.x,
        y: lastPoint.y,
        atWaypoint: lastIndex,
        arrivedAtKillPoint: lastPoint.effect === 'kill',
        killTargetId: lastPoint.killTargetId
      };
    }

    // Past everything
    return {
      x: lastPoint.x,
      y: lastPoint.y,
      atWaypoint: lastIndex,
      arrivedAtKillPoint: lastPoint.effect === 'kill',
      killTargetId: lastPoint.killTargetId
    };
  }, [killerDelay]);

  // Find upcoming kill time for a survivor
  const getKillInfo = useCallback((
    killerPath: CharacterPath | undefined,
    targetId: string,
    currentGlobalTime: number
  ): { willBeKilled: boolean; timeUntilKill: number; isBeingApproached: boolean } => {
    if (!killerPath) return { willBeKilled: false, timeUntilKill: Infinity, isBeingApproached: false };

    const effectiveTime = Math.max(0, currentGlobalTime - killerDelay);

    for (const point of killerPath.points) {
      if (point.effect === 'kill' && point.killTargetId === targetId) {
        const killTime = point.time;
        const timeUntilKill = killTime - effectiveTime;

        // Is being approached if killer is within 3 seconds of the kill
        const isBeingApproached = timeUntilKill > 0 && timeUntilKill <= 3;

        return {
          willBeKilled: true,
          timeUntilKill,
          isBeingApproached
        };
      }
    }

    return { willBeKilled: false, timeUntilKill: Infinity, isBeingApproached: false };
  }, [killerDelay]);

  const updateStates = useCallback((time: number) => {
    const newStates: Record<string, CharacterState> = {};
    const killed = killedCharactersRef.current;

    // Get animation time (subtracting startPause)
    const animTime = getAnimationTime(time);
    const inPause = isInPausePhase(time);

    // Get killer's path
    const killerPath = paths.find(p => p.characterId === killerId);

    // Check for kills - mark killed when killer's effective time passes kill waypoint
    // Only process kills if not in pause phase
    if (killerPath && killerId && !isInStartPause(time)) {
      const effectiveKillerTime = Math.max(0, animTime - killerDelay);

      for (const point of killerPath.points) {
        if (point.effect === 'kill' && point.killTargetId) {
          // Kill happens when killer reaches the waypoint time
          if (effectiveKillerTime >= point.time) {
            killed.add(point.killTargetId);
          }
        }
      }
    }

    // Update all character states
    paths.forEach(path => {
      const character = characters.find(c => c.id === path.characterId);
      if (!character) return;

      const isKiller = character.type === 'killer';
      // Killer becomes visible after killerDelay from animation start
      const isKillerVisible = animTime >= killerDelay;

      // Check if this survivor is dead
      const isDead = killed.has(path.characterId);

      // For killer
      if (isKiller) {
        if (!isKillerVisible || isInStartPause(time)) {
          // Killer is invisible before delay or during start pause
          const firstPoint = path.points[0];
          newStates[path.characterId] = {
            x: firstPoint?.x || 0,
            y: firstPoint?.y || 0,
            opacity: 0,
            effect: 'normal',
            isVisible: false,
            isShaking: false,
            isDead: false,
          };
        } else {
          const pos = getPositionAtTime(path, animTime, true);
          const effectiveKillerTime = Math.max(0, animTime - killerDelay);

          // Check if killer has reached a 'dead' waypoint
          let killerIsDead = false;
          for (const point of path.points) {
            if (point.effect === 'dead' && effectiveKillerTime >= point.time) {
              killerIsDead = true;
              break;
            }
          }

          // Determine current effect
          let currentEffect: PathPoint['effect'] = 'normal';
          if (killerIsDead) {
            currentEffect = 'dead';
          } else if (pos.arrivedAtKillPoint) {
            currentEffect = 'kill';
          }

          newStates[path.characterId] = {
            x: pos.x,
            y: pos.y,
            opacity: 1,
            effect: currentEffect,
            isVisible: true,
            isShaking: false,
            isDead: killerIsDead,
          };
        }
      } else {
        // For survivors
        // During start pause, stay at initial position
        if (isInStartPause(time)) {
          const firstPoint = path.points[0];
          newStates[path.characterId] = {
            x: firstPoint?.x || 0,
            y: firstPoint?.y || 0,
            opacity: 1,
            effect: 'normal',
            isVisible: true,
            isShaking: false,
            isDead: false,
          };
        } else {
          const pos = getPositionAtTime(path, animTime, false);
          const currentPoint = path.points[pos.atWaypoint ?? 0];

          // Check if being approached by killer
          const killInfo = getKillInfo(killerPath, path.characterId, animTime);

          if (isDead) {
            newStates[path.characterId] = {
              x: pos.x,
              y: pos.y,
              opacity: 1,
              effect: 'dead',
              isVisible: true,
              isShaking: false,
              isDead: true,
            };
          } else {
            newStates[path.characterId] = {
              x: pos.x,
              y: pos.y,
              opacity: currentPoint?.opacity ?? 1,
              effect: currentPoint?.effect ?? 'normal',
              isVisible: true,
              isShaking: killInfo.isBeingApproached,
              isDead: false,
            };
          }
        }
      }
    });

    // Also update characters without paths
    characters.forEach(char => {
      if (!newStates[char.id]) {
        const isDead = killed.has(char.id);
        const isKiller = char.type === 'killer';
        const isVisible = isKiller ? (animTime >= killerDelay && !isInStartPause(time)) : !isInStartPause(time);

        // Check if being approached
        const killInfo = getKillInfo(killerPath, char.id, animTime);

        newStates[char.id] = {
          x: 0,
          y: 0,
          opacity: isVisible ? 1 : 0,
          effect: isDead ? 'dead' : 'normal',
          isVisible,
          isShaking: !isDead && killInfo.isBeingApproached,
          isDead,
        };
      }
    });

    setCharacterStates(newStates);
  }, [paths, characters, killerId, killerDelay, startPause, getPositionAtTime, getKillInfo, getAnimationTime, isInStartPause, isInPausePhase]);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedTimeRef.current * 1000;
    }

    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const clampedTime = Math.min(elapsed, totalDuration);

    setCurrentTime(clampedTime);
    updateStates(clampedTime);

    if (elapsed < totalDuration) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
      setIsPaused(false);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      onComplete?.();
    }
  }, [totalDuration, updateStates, onComplete]);

  const play = useCallback(() => {
    if (isPlaying && !isPaused) return;

    killedCharactersRef.current = new Set(); // Reset killed characters
    setIsPlaying(true);
    setIsPaused(false);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, isPaused, animate]);

  const pause = useCallback(() => {
    if (!isPlaying || isPaused) return;

    setIsPaused(true);
    pausedTimeRef.current = currentTime;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, [isPlaying, isPaused, currentTime]);

  const resume = useCallback(() => {
    if (!isPaused) return;

    setIsPaused(false);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPaused, animate]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    killedCharactersRef.current = new Set();
    pausedTimeRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;

    updateStates(0);
  }, [updateStates]);

  const seekTo = useCallback((time: number) => {
    // Reset killed characters when seeking backwards
    if (time < currentTime) {
      killedCharactersRef.current = new Set();
    }

    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setCurrentTime(clampedTime);
    pausedTimeRef.current = clampedTime;
    updateStates(clampedTime);

    if (isPlaying && !isPaused) {
      startTimeRef.current = null;
    }
  }, [totalDuration, updateStates, isPlaying, isPaused, currentTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize states
  useEffect(() => {
    if (!isPlaying) {
      updateStates(currentTime);
    }
  }, [paths, characters, isPlaying, currentTime, updateStates]);

  // Current pause phase state
  const currentPausePhase = isInPausePhase(currentTime);

  return {
    isPlaying,
    isPaused,
    currentTime,
    totalDuration,
    characterStates,
    isPausePhase: currentPausePhase,
    play,
    pause,
    resume,
    stop,
    seekTo,
  };
}

export type UseAnimationReturn = ReturnType<typeof useAnimation>;
