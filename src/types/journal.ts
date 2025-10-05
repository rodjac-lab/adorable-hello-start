export interface PersistedJournalEntry {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
  mediaAssetIds?: string[];
  photos?: string[];
  link?: string;
}

export interface JournalEntryFormData {
  day: number;
  date: Date;
  title: string;
  location: string;
  story: string;
  mood: string;
  mediaAssetIds?: string[];
  photos?: string[];
  link?: string;
}

export interface JournalEntryWithSource extends PersistedJournalEntry {
  source: 'canonical' | 'custom';
}
