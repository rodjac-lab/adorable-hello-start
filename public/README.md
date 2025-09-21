# Gestion des assets statiques

Le dossier `public/lovable-uploads/` contient les médias importés manuellement dans le dépôt. Avec la nouvelle médiathèque (stockage localStorage + compression automatique), ces fichiers statiques doivent rester limités aux visuels réellement utilisés dans le code source.

## Nettoyage des fichiers orphelins

Un script Node est fourni pour supprimer les images non référencées :

```bash
# Lister les fichiers orphelins sans les supprimer
npm run clean:uploads

# Supprimer réellement les fichiers non utilisés
npm run clean:uploads -- --apply
```

Options supplémentaires :

- `--verbose` — affiche les fichiers sources où chaque média est référencé.

Le script examine les fichiers texte (`src/`, `public/`, `scripts/`, etc.) et recherche les occurrences de `lovable-uploads/<nom_du_fichier>`. Les fichiers absents du code sont listés comme orphelins. En mode `--apply`, ils sont supprimés physiquement du dossier `public/lovable-uploads/`.

⚠️ **Attention :** ce script n’analyse pas le contenu du localStorage. Les médias ajoutés via la médiathèque intégrée sont stockés côté navigateur (base64) et ne doivent pas être copiés dans `public/lovable-uploads/`.

## Bonnes pratiques

- Conservez uniquement les assets essentiels (icônes, images de démo) dans `public/lovable-uploads/`.
- Utilisez la médiathèque (`/studio`) pour gérer les visuels du journal : compression automatique, quota et métadonnées.
- Documentez l’origine des images statiques restantes pour faciliter les audits futurs.
