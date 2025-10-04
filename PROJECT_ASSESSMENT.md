# État actuel du projet

## Synthèse rapide
- La phase 1 du refactoring est documentée comme terminée avec suppression du code mort, introduction d'un logger, d'un ErrorBoundary et sécurisation des secrets. 【F:PHASE1_COMPLETE.md†L1-L90】
- Le strict mode TypeScript reste désactivé, ce qui limite la détection d'erreurs en amont. 【F:tsconfig.json†L8-L18】
- Les modules critiques (éditeur, persistance) sont encore monolithiques avec duplication et logs verbeux, symptôme d'une phase 2/3 incomplète. 【F:src/pages/Editor.tsx†L1-L120】【F:src/lib/journalStorage.ts†L1-L120】
- Le Studio créateur existe mais s'appuie sur les mêmes APIs locales et n'a pas encore de flux de publication/validation complet. 【F:src/pages/Studio.tsx†L1-L120】

## Risques identifiés
1. **Dette technique persistante**
   - `Editor.tsx`, `journalStorage.ts` et `contentStore.ts` restent des fichiers >500 lignes avec responsabilités multiples, ce qui complique l'évolution. 【F:src/pages/Editor.tsx†L1-L120】【F:src/lib/contentStore.ts†L1-L120】
   - Les hooks comme `useJournalEntries` gardent des `console.log` bruités et acceptent des `any` en entrée, faute de typage strict. 【F:src/hooks/useJournalEntries.ts†L1-L120】
2. **Robustesse insuffisante**
   - Persistance localStorage non factorisée (gestion d'erreurs, quotas, migrations) et absence de fallback serveur.
   - Les données canoniques sont en dur dans `contentStore`/`contentStore.ts` et dupliquées entre modules (ex: expériences culinaires). 【F:src/lib/contentStore.ts†L33-L120】【F:src/store/contentStore.ts†L1-L120】
3. **Expérience Studio à finaliser**
   - Pas de workflow clair pour passer d'un contenu créé dans le studio à une publication sur les pages publiques.
   - Pas de stratégie média (optimisation, stockage) ni de support multi-auteurs.

# Plan proposé pour la Phase 3 du refactoring

## Objectif général
Consolider l'architecture afin de rendre la création de contenu stable, typée et prête pour des itérations rapides dans le Studio.

## Étapes recommandées
1. **Durcir le socle TypeScript & lint**
   - Activer `strict`, `noImplicitAny`, `noUnusedLocals` et `noUnusedParameters`, puis corriger les erreurs remontées, en priorité dans `useJournalEntries`, `journalStorage` et l'éditeur. 【F:tsconfig.json†L8-L18】【F:src/hooks/useJournalEntries.ts†L1-L120】
   - Introduire des types dédiés pour les formulaires (`JournalEntryFormData`, `PersistedJournalEntry`) pour bannir `any`.
2. **Isoler la couche persistance**
   - Extraire un module `storage/localStorageClient.ts` qui gère sérialisation, quotas et migrations (utiliser `CURRENT_VERSION` déjà présent). 【F:src/lib/journalStorage.ts†L1-L120】
   - Scinder `journalStorage.ts` en services : `photoProcessing.ts`, `journalRepository.ts`, `journalMigrations.ts`.
   - Ajouter une interface `ContentRepository` pour préparer une future API backend.
3. **Factoriser l'éditeur**
   - Transformer `Editor.tsx` en conteneur + sous-composants génériques (`GenericListEditor`, `EntryForm`). 【F:src/pages/Editor.tsx†L1-L120】
   - Mutualiser les champs et validations via un hook `useEditableCollection<T>`.
4. **Nettoyer les stores de contenu**
   - Déplacer les données canoniques dans `src/data/` et exposer des adapters depuis `contentStore`. 【F:src/lib/contentStore.ts†L1-L120】【F:src/store/contentStore.ts†L1-L120】
   - Unifier la structure `FoodExperience`/`ReadingRecommendation` pour éviter duplication entre `lib` et `store`.
5. **Instrumentation & tests légers**
   - Remplacer les `console.log` restants par le logger central. 【F:src/hooks/useJournalEntries.ts†L19-L50】
   - Ajouter des tests unitaires ciblés (ex: migrations, repository) avec Vitest + React Testing Library.
   - Mettre en place un script npm `npm run lint && npm run typecheck && npm run test` en CI.

# Plan pour finaliser le site et le Studio

1. **Flux de création → publication**
   - Implémenter un mode "brouillon" et "publié" dans le store, avec actions explicites dans le Studio (`Publier`, `Revenir en brouillon`).
   - Synchroniser automatiquement les pages publiques (`Journal`, `Food`, etc.) via un selector qui agrège contenu canonique + custom publié.
2. **Gestion média**
   - Finaliser `MediaManager` : upload, compression asynchrone (Web Worker) et association aux entrées.
   - Mettre en place un quota visuel et un diagnostic dans l'onglet Studio > Diagnostics.
3. **Améliorations UX**
   - Ajouter un indicateur de progression (steps) et de validation des champs dans l'éditeur.
   - Implémenter une recherche globale (Fuse.js déjà listé en quick win) pour naviguer dans les contenus.
4. **Contenu & SEO**
   - Préparer des templates MD/JSON exportables depuis le Studio pour accélérer la production via Lovable Studio.
   - Ajouter métadonnées SEO par page, sitemap et pré-chargement des images critiques (cf. audit). 【F:README-AUDIT.md†L64-L108】
5. **Stabilité & Monitoring**
   - Ajouter un `ErrorBoundary` spécifique autour des zones critiques (Studio, Map) avec relance.
   - Prévoir instrumentation (Sentry ou console logger) pour suivre erreurs de persistance.

## Livrables attendus
- Architecture modulée (`storage/`, `repositories/`, `features/editor/`).
- Tests de persistance et hooks clés.
- Pages publiques alimentées dynamiquement par les données du Studio.
- Documentation de l'orchestration (README technique + guide Studio).
