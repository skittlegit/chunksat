"use client";

import { create } from "zustand";

interface TimelineStore {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setTime: (t: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 50,
  setTime: (t) => set({ currentTime: Math.max(0, Math.min(720, t)) }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (s) => set({ playbackSpeed: s }),
}));
