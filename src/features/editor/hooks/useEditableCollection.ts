import { useCallback, useMemo, useState } from "react";

type DraftUpdater<TDraft> = Partial<TDraft> | ((draft: TDraft) => TDraft);

type EditorMode = "create" | "edit" | null;

export interface UseEditableCollectionOptions<TItem, TKey extends string | number, TDraft> {
  items: TItem[];
  onChange: (items: TItem[]) => void;
  getKey: (item: TItem) => TKey;
  createDraft: (items: TItem[]) => TDraft;
  toDraft: (item: TItem) => TDraft;
  fromDraft: (draft: TDraft, items: TItem[]) => TItem | null;
  sort?: (items: TItem[]) => TItem[];
  validateDraft?: (draft: TDraft) => string[];
}

export interface UseEditableCollectionResult<TItem, TKey extends string | number, TDraft> {
  draft: TDraft | null;
  editingKey: TKey | null;
  errors: string[];
  isEditing: boolean;
  mode: EditorMode;
  sortedItems: TItem[];
  startCreate: () => void;
  startEdit: (key: TKey) => void;
  updateDraft: (updater: DraftUpdater<TDraft>) => void;
  cancelEdit: () => void;
  saveDraft: () => boolean;
  deleteItem: (key: TKey) => void;
}

export const useEditableCollection = <TItem, TKey extends string | number, TDraft>(
  options: UseEditableCollectionOptions<TItem, TKey, TDraft>,
): UseEditableCollectionResult<TItem, TKey, TDraft> => {
  const {
    items,
    sort,
    validateDraft,
    onChange,
    getKey,
    createDraft: createDraftFn,
    toDraft: toDraftFn,
    fromDraft: fromDraftFn,
  } = options;
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [editingKey, setEditingKey] = useState<TKey | null>(null);
  const [mode, setMode] = useState<EditorMode>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    return sort ? sort(copy) : copy;
  }, [items, sort]);

  const resetEditorState = useCallback(() => {
    setDraft(null);
    setEditingKey(null);
    setMode(null);
    setErrors([]);
  }, []);

  const startCreate = useCallback(() => {
    setDraft(createDraftFn(sortedItems));
    setMode("create");
    setEditingKey(null);
    setErrors([]);
  }, [createDraftFn, sortedItems]);

  const startEdit = useCallback(
    (key: TKey) => {
      const item = sortedItems.find((candidate) => getKey(candidate) === key);
      if (!item) {
        return;
      }

      setDraft(toDraftFn(item));
      setMode("edit");
      setEditingKey(key);
      setErrors([]);
    },
    [getKey, sortedItems, toDraftFn],
  );

  const updateDraft = useCallback(
    (updater: DraftUpdater<TDraft>) => {
      setDraft((currentDraft) => {
        if (!currentDraft) {
          return currentDraft;
        }

        const nextDraft =
          typeof updater === "function"
            ? (updater as (draft: TDraft) => TDraft)(currentDraft)
            : { ...currentDraft, ...updater };

        return nextDraft;
      });
      setErrors([]);
    },
    [],
  );

  const deleteItem = useCallback(
    (key: TKey) => {
      const filtered = items.filter((item) => getKey(item) !== key);
      onChange(filtered);
      if (mode !== null && key === editingKey) {
        resetEditorState();
      }
    },
    [editingKey, getKey, items, mode, onChange, resetEditorState],
  );

  const saveDraft = useCallback(() => {
    if (!draft) {
      return false;
    }

    const validationErrors = validateDraft ? validateDraft(draft) : [];
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return false;
    }

    const materialized = fromDraftFn(draft, items);
    if (!materialized) {
      return false;
    }

    const nextItems = (() => {
      const nextKey = getKey(materialized);
      const withoutCurrent =
        mode === "edit" && editingKey !== null
          ? items.filter((item) => getKey(item) !== editingKey)
          : items;

      const withoutDuplicate = withoutCurrent.filter((item) => getKey(item) !== nextKey);
      const merged = [...withoutDuplicate, materialized];
      return sort ? sort(merged) : merged;
    })();

    onChange(nextItems);
    resetEditorState();
    return true;
  }, [draft, editingKey, fromDraftFn, getKey, items, mode, onChange, resetEditorState, sort, validateDraft]);

  const cancelEdit = useCallback(() => {
    resetEditorState();
  }, [resetEditorState]);

  return {
    draft,
    editingKey,
    errors,
    isEditing: mode !== null,
    mode,
    sortedItems,
    startCreate,
    startEdit,
    updateDraft,
    cancelEdit,
    saveDraft,
    deleteItem,
  };
};
