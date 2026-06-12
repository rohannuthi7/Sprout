import { create } from 'zustand';
import type { FlashCardData } from '../types';

interface UndoAction {
  label: string;
  onUndo: () => Promise<void>;
  expiresAt: number;
}

interface UIStore {
  // Flashcard stack
  flashcardStack: FlashCardData[];
  setFlashcardStack: (cards: FlashCardData[]) => void;
  removeTopCard: () => void;

  // Undo toast
  undoAction: UndoAction | null;
  showUndo: (action: UndoAction) => void;
  clearUndo: () => void;

  // Inline edit state for draft reply
  editingDraftFor: string | null; // threadId
  setEditingDraft: (threadId: string | null) => void;

  // Loading states
  isSending: boolean;
  setIsSending: (val: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  flashcardStack: [],
  setFlashcardStack: (cards) => set({ flashcardStack: cards }),
  removeTopCard: () =>
    set((state) => ({ flashcardStack: state.flashcardStack.slice(1) })),

  undoAction: null,
  showUndo: (action) => set({ undoAction: action }),
  clearUndo: () => set({ undoAction: null }),

  editingDraftFor: null,
  setEditingDraft: (threadId) => set({ editingDraftFor: threadId }),

  isSending: false,
  setIsSending: (val) => set({ isSending: val }),
}));
