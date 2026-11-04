"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  albumTitle: string;
  albumId: string;
};

type RepeatMode = "off" | "all" | "one";

type PlayerContextValue = {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  currentTime: number;
  duration: number;
  hasFullAccess: boolean;
  queue: PlayerTrack[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children, hasFullAccess = true }: { children: ReactNode; hasFullAccess?: boolean }) {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const playTrack = useCallback((track: PlayerTrack, q?: PlayerTrack[]) => {
    const newQueue = q && q.length > 0 ? q : [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    setQueue(newQueue);
    setQueueIndex(idx >= 0 ? idx : 0);
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const playQueue = useCallback((tracks: PlayerTrack[], startIndex = 0) => {
    if (!tracks.length) return;
    const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
    setQueue(tracks);
    setQueueIndex(idx);
    setCurrentTrack(tracks[idx]);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const next = useCallback(() => {
    if (!queue.length) return;
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeat === "all") nextIdx = 0;
        else { setIsPlaying(false); return; }
      }
    }
    setQueueIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, [queue, queueIndex, shuffle, repeat]);

  const prev = useCallback(() => {
    if (!queue.length) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeat === "all") prevIdx = queue.length - 1;
      else prevIdx = 0;
    }
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, [queue, queueIndex, repeat]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        playQueue,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        currentTime,
        duration,
        hasFullAccess,
        queue,
        queueIndex,
        shuffle,
        repeat,
        next,
        prev,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}