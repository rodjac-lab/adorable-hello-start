import {
  JournalEntryContent,
  getJournalEntries as getJournalEntriesFromStore,
  saveJournalEntry,
  replaceJournalEntries,
  getJournalStats as getJournalStatsFromStore,
  inspectContentStorage,
  resetContentStore,
  recoverContentFromBackup,
  exportContent,
  importContent,
  forceContentMigration,
} from './contentStore';

export type JournalEntry = JournalEntryContent;

export const loadJournalEntries = (): JournalEntry[] => {
  return getJournalEntriesFromStore();
};

export const addJournalEntry = async (entry: JournalEntry): Promise<boolean> => {
  await saveJournalEntry({
    ...entry,
    isCustom: entry.isCustom ?? true,
  });
  return true;
};

export const updateJournalEntry = async (entry: JournalEntry): Promise<boolean> => {
  const existing = getJournalEntriesFromStore().find(item => item.day === entry.day);
  await saveJournalEntry({
    ...existing,
    ...entry,
    isCustom: existing?.isCustom ?? entry.isCustom ?? true,
  });
  return true;
};

export const getJournalStats = () => getJournalStatsFromStore();

export const diagnosticTools = {
  inspectStorage: () => inspectContentStorage(),
  forceMigration: () => {
    const state = forceContentMigration();
    return state.journalEntries;
  },
  resetStorage: () => {
    const state = resetContentStore();
    return state.journalEntries;
  },
  recoverFromBackup: () => {
    const state = recoverContentFromBackup();
    return state.journalEntries;
  },
  exportAll: () => {
    const payload = exportContent();
    const stats = getJournalStats();
    const storage = inspectContentStorage();

    return {
      timestamp: payload.exportedAt,
      entries: payload.data.journalEntries,
      stats,
      storage,
      metadata: {
        version: payload.version,
        totalEntries: payload.data.journalEntries.length,
        entryDays: payload.data.journalEntries.map(entry => entry.day),
      }
    };
  },
  importData: async (data: { entries: JournalEntry[] }) => {
    try {
      if (!Array.isArray(data.entries)) {
        throw new Error('Invalid data format');
      }

      await replaceJournalEntries(
        data.entries.map(entry => ({
          ...entry,
          isCustom: entry.isCustom ?? true,
        }))
      );

      return { success: true, imported: data.entries.length };
    } catch (error) {
      console.error('Import failed', error);
      return { success: false, error: (error as Error).message };
    }
  }
};

export { exportContent, importContent };
