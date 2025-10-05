export const EDITOR_STORAGE_KEYS = {
  journal: "jordan-journal-entries",
  food: "jordan-food-experiences",
  books: "jordan-book-recommendations",
  map: "jordan-place-references",
} as const;

export type EditorStorageCollection = keyof typeof EDITOR_STORAGE_KEYS;

export const getEditorBackupKey = (collection: EditorStorageCollection, slot: "primary" | "secondary") => {
  const baseKey = EDITOR_STORAGE_KEYS[collection];
  const suffix = slot === "primary" ? "backup" : "backup2";
  return `${baseKey}_${suffix}`;
};

export const getEditorVersionKey = (collection: EditorStorageCollection) => {
  const baseKey = EDITOR_STORAGE_KEYS[collection];
  return `${baseKey}_version`;
};

export const EDITOR_STORAGE_VERSION = "1";
