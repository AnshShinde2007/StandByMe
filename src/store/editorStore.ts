import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Editor Store — drag/resize/select state for the layout editor
// ─────────────────────────────────────────────────────────────────────────────

interface EditorState {
  isEditing: boolean;
  selectedWidgetId: string | null;
  draggedWidgetId: string | null;
  showWidgetPicker: boolean;
  showThemeEditor: boolean;
  editingSettingsWidgetId: string | null;

  enterEditMode: () => void;
  exitEditMode: () => void;
  selectWidget: (id: string | null) => void;
  setDraggedWidget: (id: string | null) => void;
  openWidgetPicker: () => void;
  closeWidgetPicker: () => void;
  openThemeEditor: () => void;
  closeThemeEditor: () => void;
  openWidgetSettings: (id: string) => void;
  closeWidgetSettings: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isEditing: false,
  selectedWidgetId: null,
  draggedWidgetId: null,
  showWidgetPicker: false,
  showThemeEditor: false,
  editingSettingsWidgetId: null,

  enterEditMode: () => set({ isEditing: true, selectedWidgetId: null }),
  exitEditMode: () =>
    set({
      isEditing: false,
      selectedWidgetId: null,
      draggedWidgetId: null,
      showWidgetPicker: false,
      editingSettingsWidgetId: null,
    }),
  selectWidget: (id) => set({ selectedWidgetId: id }),
  setDraggedWidget: (id) => set({ draggedWidgetId: id }),
  openWidgetPicker: () => set({ showWidgetPicker: true }),
  closeWidgetPicker: () => set({ showWidgetPicker: false }),
  openThemeEditor: () => set({ showThemeEditor: true }),
  closeThemeEditor: () => set({ showThemeEditor: false }),
  openWidgetSettings: (id) => set({ editingSettingsWidgetId: id }),
  closeWidgetSettings: () => set({ editingSettingsWidgetId: null }),
}));
