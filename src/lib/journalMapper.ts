import type { JournalEntryFormData, PersistedJournalEntry } from "@/types/journal";

const formatJournalDate = (date: Date): string =>
  date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const toPersistedJournalEntry = (data: JournalEntryFormData): PersistedJournalEntry => ({
  day: data.day,
  date: formatJournalDate(data.date),
  title: data.title,
  location: data.location,
  story: data.story,
  mood: data.mood,
  mediaAssetIds: data.mediaAssetIds && data.mediaAssetIds.length > 0 ? data.mediaAssetIds : undefined,
  photos: data.photos && data.photos.length > 0 ? data.photos : undefined,
  link: data.link?.trim() ? data.link : undefined,
});

