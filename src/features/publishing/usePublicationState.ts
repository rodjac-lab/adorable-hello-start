import { useCallback, useState } from "react";
import type { ContentStatus } from "@/types/content";
import type { PublicationCollection, PublicationState } from "./publicationState";
import {
  countPublicationByStatus,
  ensurePublicationEntries,
  loadPublicationState,
  resolvePublicationStatus,
  savePublicationState,
  updatePublicationStatus,
} from "./publicationState";

export interface UsePublicationStateResult {
  state: PublicationState;
  syncCollectionEntries: (
    collection: PublicationCollection,
    ids: readonly string[],
    canonicalIds: ReadonlySet<string>,
  ) => void;
  setStatus: (
    collection: PublicationCollection,
    id: string,
    status: ContentStatus,
  ) => void;
  getStatus: (
    collection: PublicationCollection,
    id: string,
    defaultStatus: ContentStatus,
  ) => ContentStatus;
  countByStatus: (
    collection: PublicationCollection,
    status: ContentStatus,
    ids: readonly string[],
    defaultStatus: ContentStatus,
  ) => number;
}

export const usePublicationState = (): UsePublicationStateResult => {
  const [state, setState] = useState<PublicationState>(() => loadPublicationState());

  const syncCollectionEntries = useCallback<UsePublicationStateResult["syncCollectionEntries"]>(
    (collection, ids, canonicalIds) => {
      setState((previous) => {
        const next = ensurePublicationEntries(previous, collection, ids, canonicalIds);
        if (next === previous) {
          return previous;
        }

        savePublicationState(next);
        return next;
      });
    },
  []);

  const setStatus = useCallback<UsePublicationStateResult["setStatus"]>((collection, id, status) => {
    setState((previous) => {
      const next = updatePublicationStatus(previous, collection, id, status);
      if (next === previous) {
        return previous;
      }

      savePublicationState(next);
      return next;
    });
  }, []);

  const getStatus = useCallback<UsePublicationStateResult["getStatus"]>(
    (collection, id, defaultStatus) => {
      return resolvePublicationStatus(state, collection, id, { defaultStatus });
    },
    [state],
  );

  const countByStatus = useCallback<UsePublicationStateResult["countByStatus"]>(
    (collection, status, ids, defaultStatus) => {
      return countPublicationByStatus(state, collection, status, ids, { defaultStatus });
    },
    [state],
  );

  return {
    state,
    syncCollectionEntries,
    setStatus,
    getStatus,
    countByStatus,
  };
};
