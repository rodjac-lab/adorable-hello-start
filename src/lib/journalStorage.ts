export type { JournalEntry, JournalStats } from './journal/journalRepository';
export {
  loadJournalEntries,
  saveJournalEntries,
  addJournalEntry,
  updateJournalEntry,
  recoverFromBackup,
  getJournalStats,
  diagnosticTools,
  journalRepository,
} from './journal/journalRepository';
export type { PersistedJournalEntry } from '@/types/journal';
