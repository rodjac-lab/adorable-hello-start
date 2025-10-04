export interface ContentRepository<Entry, Stats = unknown> {
  load(): Entry[];
  save(entries: Entry[]): Promise<boolean>;
  add(entry: Entry): Promise<boolean>;
  update(entry: Entry): Promise<boolean>;
  stats(): Stats;
}

export interface RecoverableRepository<Entry> {
  recover(): Entry[];
}

export interface ImportableRepository<Entry, ImportResult = { success: boolean; imported?: number; error?: string }> {
  importData(data: { entries: Entry[] }): Promise<ImportResult>;
}

export interface ResettableRepository {
  reset(): Entry[];
}
