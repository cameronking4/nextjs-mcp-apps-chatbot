"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateUUID } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export type SidePanelMode = "closed" | "docked" | "floating" | "minimized";

export interface SidePanelPosition {
  x: number;
  y: number;
}

export interface SidePanelSize {
  width: number;
  height: number;
}

export interface SidePanelChat {
  id: string;
  initialPrompt: string;
  messages: ChatMessage[];
  createdAt: Date;
}

interface SidePanelContextValue {
  // State
  mode: SidePanelMode;
  chat: SidePanelChat | null;
  position: SidePanelPosition;
  size: SidePanelSize;
  
  // Actions
  openSideChat: (prompt: string) => void;
  minimize: () => void;
  restore: () => void;
  close: () => void;
  setMode: (mode: SidePanelMode) => void;
  setPosition: (position: SidePanelPosition) => void;
  setSize: (size: SidePanelSize) => void;
  updateMessages: (messages: ChatMessage[]) => void;
  
  // For save functionality
  markAsSaved: () => void;
  isSaved: boolean;
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

const DEFAULT_POSITION: SidePanelPosition = { x: 100, y: 100 };
const DEFAULT_SIZE: SidePanelSize = { width: 450, height: 600 };
const MIN_SIZE: SidePanelSize = { width: 320, height: 400 };
const MAX_SIZE: SidePanelSize = { width: 800, height: 900 };
const STORAGE_KEY_MODE = "side-panel-mode";
const STORAGE_KEY_POSITION = "side-panel-position";
const STORAGE_KEY_SIZE = "side-panel-size";

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SidePanelMode>("closed");
  const [chat, setChat] = useState<SidePanelChat | null>(null);
  const [position, setPositionState] = useState<SidePanelPosition>(DEFAULT_POSITION);
  const [size, setSizeState] = useState<SidePanelSize>(DEFAULT_SIZE);
  const [isSaved, setIsSaved] = useState(false);
  const [previousMode, setPreviousMode] = useState<SidePanelMode>("docked");

  // Load persisted mode preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
      if (savedMode === "docked" || savedMode === "floating") {
        setPreviousMode(savedMode);
      }
      
      const savedPosition = localStorage.getItem(STORAGE_KEY_POSITION);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            setPositionState(parsed);
          }
        } catch {
          // Ignore invalid JSON
        }
      }

      const savedSize = localStorage.getItem(STORAGE_KEY_SIZE);
      if (savedSize) {
        try {
          const parsed = JSON.parse(savedSize);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") {
            setSizeState({
              width: Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, parsed.width)),
              height: Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, parsed.height)),
            });
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  }, []);

  // Persist mode preference
  const setMode = useCallback((newMode: SidePanelMode) => {
    setModeState(newMode);
    if (newMode === "docked" || newMode === "floating") {
      setPreviousMode(newMode);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODE, newMode);
      }
    }
  }, []);

  // Persist position
  const setPosition = useCallback((newPosition: SidePanelPosition) => {
    setPositionState(newPosition);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(newPosition));
    }
  }, []);

  // Persist size (with min/max constraints)
  const setSize = useCallback((newSize: SidePanelSize) => {
    const constrainedSize = {
      width: Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, newSize.width)),
      height: Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, newSize.height)),
    };
    setSizeState(constrainedSize);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify(constrainedSize));
    }
  }, []);

  // Open a new side chat with a prompt
  const openSideChat = useCallback((prompt: string) => {
    // Create new chat, replacing any existing one
    const newChat: SidePanelChat = {
      id: generateUUID(),
      initialPrompt: prompt,
      messages: [],
      createdAt: new Date(),
    };
    
    setChat(newChat);
    setIsSaved(false);
    
    // Open in previous preferred mode (docked or floating)
    setModeState(previousMode);
  }, [previousMode]);

  // Minimize the panel
  const minimize = useCallback(() => {
    if (mode !== "closed" && mode !== "minimized") {
      setModeState("minimized");
    }
  }, [mode]);

  // Restore from minimized state
  const restore = useCallback(() => {
    if (mode === "minimized" && chat) {
      setModeState(previousMode);
    }
  }, [mode, chat, previousMode]);

  // Close the panel (discard if not saved)
  const close = useCallback(() => {
    setModeState("closed");
    // Don't clear chat immediately - keep for minimized restore
    // Only clear when opening a new one
  }, []);

  // Update messages in current chat
  const updateMessages = useCallback((messages: ChatMessage[]) => {
    setChat((prev) => prev ? { ...prev, messages } : null);
  }, []);

  // Mark current chat as saved
  const markAsSaved = useCallback(() => {
    setIsSaved(true);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      chat,
      position,
      size,
      openSideChat,
      minimize,
      restore,
      close,
      setMode,
      setPosition,
      setSize,
      updateMessages,
      markAsSaved,
      isSaved,
    }),
    [
      mode,
      chat,
      position,
      size,
      openSideChat,
      minimize,
      restore,
      close,
      setMode,
      setPosition,
      setSize,
      updateMessages,
      markAsSaved,
      isSaved,
    ]
  );

  return (
    <SidePanelContext.Provider value={value}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error("useSidePanel must be used within a SidePanelProvider");
  }
  return context;
}
