# Issue #1 — Audit automatisé du dépôt (version hors-ligne)

Objectif : produire README-AUDIT.md (stack, routes, deps, médias, quick wins) **sans** dépendre d’installations npm.

## Étapes
- [ ] Ajouter deux scripts Node **sans dépendances** :
  - `scripts/audit-repo-node.mjs` (génère README-AUDIT.md)
  - `scripts/recover-content-node.mjs` (sauvegarde contenus dans _recovered/)
- [ ] Exécuter ces scripts avec `node` (pas de npm install).
- [ ] Commiter README-AUDIT.md et le dossier _recovered/.

## Commandes
node scripts/audit-repo-node.mjs
node scripts/recover-content-node.mjs
