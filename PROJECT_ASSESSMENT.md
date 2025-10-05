# État actuel du projet

## Synthèse rapide
- Les trois phases de refactor engagées (durcissement TypeScript, isolation de la persistance, refonte de l’éditeur et des stores) sont désormais clôturées et documentées. 【F:PROJECT_ASSESSMENT.md†L69-L148】
- Le Studio orchestre un workflow complet : brouillons/publiés, diagnostics médias et synchronisation automatique des collections alimentent les pages publiques. 【F:PROJECT_ASSESSMENT.md†L149-L202】
- La batterie de tests s’exécute via `node --test` avec un loader TypeScript local, couvrant les modules critiques (persistance, publication, médias, cartes). 【F:PROJECT_ASSESSMENT.md†L203-L212】
- Prochaine focale : production de contenu réel et chantiers UX/SEO (recherche, indicateurs Studio, instrumentation avancée) listés dans la section “Plan pour finaliser le site et le Studio”. 【F:PROJECT_ASSESSMENT.md†L214-L245】

## Risques identifiés
1. **Adoption & production de contenu**
   - Les données canoniques restent des exemples : il faudra les remplacer par vos entrées réelles via le Studio en suivant le workflow de publication.
2. **UX & SEO à renforcer**
   - Les améliorations de navigation (recherche globale, progressions d’édition) et le plan SEO n’ont pas encore été traités, ce qui peut freiner la mise en ligne finale. 【F:PROJECT_ASSESSMENT.md†L223-L236】
3. **Monitoring limité**
   - Le logger central suffit pour la mise au point locale mais aucun service externe (Sentry, analytics) n’est câblé pour superviser l’expérience en production.

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
   - Ajouter des tests unitaires ciblés (ex: migrations, repository) avec le runner Node.js (`node --test`).
   - Mettre en place un script npm `npm run lint && npm run typecheck && npm run test` en CI.

# Plan pour finaliser le site et le Studio

1. **Flux de création → publication**
   - Implémenter un mode "brouillon" et "publié" dans le store, avec actions explicites dans le Studio (`Publier`, `Revenir en brouillon`).
   - Synchroniser automatiquement les pages publiques (`Journal`, `Food`, etc.) via un selector qui agrège contenu canonique + custom publié.
2. **Gestion média**
   - ✅ Centraliser la médiathèque dans un module dédié (`mediaStore`) avec sauvegardes, quotas et seeds canoniques.
   - ✅ Refondre `MediaManager` pour gérer l'import compressé, l'édition des métadonnées et le suivi d'usage.
   - ✅ Exposer un hook `useMediaLibrary` pour orchestrer les actions Studio et remonter les erreurs/toasts.
   - ✅ Associer les médias aux entrées Journal/Studio et enrichir les diagnostics.
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

# Journal d'avancement Phase 3

## Étape 1 — Durcissement TypeScript & lint (en cours → ✅)
- ✅ Activation de `strict`, `noImplicitAny`, `noUnusedLocals` et `noUnusedParameters` dans la configuration TypeScript.
- ✅ Création des types partagés `PersistedJournalEntry` et `JournalEntryFormData` (`src/types/journal.ts`).
- ✅ Mutualisation de la transformation formulaire → persistance via `toPersistedJournalEntry` (`src/lib/journalMapper.ts`).
- ✅ Mise à jour des hooks (`useJournalEntries`) et du Studio pour éliminer les usages de `any` et centraliser le mapping.
- ✅ Étape clôturée : la couche de persistance est maintenant isolée (cf. Étape 2).

## Étape 2 — Isolation de la couche de persistance (en cours → ✅)
- ✅ Extraction d'un client `localStorage` typé (`src/storage/localStorageClient.ts`) gérant backups, versioning et erreurs de quota.
- ✅ Découpage de `journalStorage` en modules dédiés (`src/lib/journal/photoProcessing.ts`, `src/lib/journal/journalMigrations.ts`, `src/lib/journal/journalRepository.ts`).
- ✅ Introduction d'une interface générique `ContentRepository` (`src/repositories/ContentRepository.ts`) et d'un repository journal réutilisable.
- ✅ Refonte des diagnostics (export/import, reset, migration forcée) pour s'appuyer sur le repository et le client de persistance.
- ✅ Étape clôturée : la prochaine itération se concentre sur la factorisation de l'éditeur (cf. Étape 3).

## Étape 3 — Factorisation de l'éditeur (terminée ✅)
- ✅ `Editor.tsx` est devenu un point d'entrée minimal qui délègue à `features/editor/EditorPage`.
- ✅ Création de composants mutualisés (`GenericListEditor`, `EntryForm`) et du hook `useEditableCollection<T>` pour orchestrer les opérations CRUD.
- ✅ Les sections Journal/Gastronomie/Lectures consomment désormais le hook partagé avec validations typées et formulaires modulaires.
- ✅ Le chargement initial exploite les jeux de données canoniques (`src/data`) avec fallback localStorage et export TypeScript factorisé.
- ✅ Harmonisation de l'UX : toasts de sauvegarde/export, indicateurs d'état et verrouillage des actions tant que les contenus ne sont pas synchronisés.
- ✅ Préparation du workflow de publication avec `usePublicationState` et les contrôles `PublicationStatusControls` partagés.
- ✅ Branchement complet du workflow de publication dans le Studio : statut par entrée, récapitulatif des brouillons et synchronisation automatique des jeux de données.

## Étape 4 — Nettoyage des stores de contenu (terminée ✅)
- ✅ Déplacement des contenus canoniques (journal, gastronomie, lectures, cartes) dans `src/data/` avec types partagés (`src/types/content.ts`).
- ✅ Unification des structures `FoodExperience` et `ReadingRecommendation` entre le store, le Studio et l'éditeur avec sérialisation cohérente.
- ✅ Rafraîchissement des pages publiques (Food & Recommendations) et du Studio pour consommer les nouvelles données typées.
- ✅ Introduction des statuts de publication (draft/published) persistés dans `localStorage` et filtrage des pages publiques via les sélecteurs unifiés.
- ✅ Studio et content store alignés sur les statuts publiés/brouillons avec sauvegarde automatique des collections et diagnostic consolidé.

## Étape 5 — Instrumentation & tests légers (terminée ✅)
- ✅ Remplacement des journaux `console.*` par le logger centralisé dans les hooks et services critiques (journal, persistance, édition, media, cartes).
- ✅ Ajout de la journalisation détaillée des opérations de géocodage et de compression pour faciliter le diagnostic.
- ✅ Couverture de tests unitaires sur les modules critiques (`publicationState`, client `localStorage`, `journalRepository`) et scripts `test`/`ci` prêts pour la CI via le loader TypeScript `node --test`.
- ✅ Exécution CI rétablie sans dépendance au registre npm grâce au loader TypeScript local (`scripts/ts-test-loader.mjs`) et à la suite `npm run test`.

## Finalisation Studio/Site — Gestion média (terminée ✅)
- ✅ Module `mediaStore` basé sur le client `localStorage` : backups, quotas, seeds par défaut et API de mise à jour.
- ✅ Nouveau `MediaManager` unifié : import compressé, édition, recompression, indicateurs de quota et toasts.
- ✅ Hook `useMediaLibrary` pour orchestrer les opérations Studio et surface d'erreurs cohérente.
- ✅ Tests unitaires pour la persistance média (ordre, normalisation, helpers de taille) exécutés via `node --test`.
- ✅ Journal et éditeur reliés à la médiathèque : sélection des images dans le Studio, stockage des `mediaAssetIds` et résolution automatique côté site public.
- ✅ Tableau de bord d'usage dans l'onglet Médiathèque pour suivre les médias référencés et détecter les visuels orphelins.
- ✅ Association des lieux de la carte aux médias de la bibliothèque, synchronisée avec les statuts de publication et intégrée aux diagnostics d'usage.
