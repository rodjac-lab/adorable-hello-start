# Vision produit — carnet de voyage Jordanie

## Objectif
Créer un site web immersif relatant mes vacances en Jordanie. Le site doit combiner récit personnel, découverte culturelle et outils interactifs pour préparer ou revivre le voyage.

## Expérience attendue
- **Journal de bord** : écrire des notes quotidiennes, illustrer chaque étape avec photos/vidéos, conserver l’historique des modifications.
- **Carte interactive** : visualiser l’itinéraire, afficher les lieux visités, relier les points à des extraits du journal et à des médias.
- **Gastronomie** : présenter les plats découverts, recettes associées et bonnes adresses.
- **Lectures & ressources** : partager livres, articles et podcasts qui ont accompagné le voyage.
- **Galerie médias** : parcourir facilement les photos et vidéos sans qu’elles soient codées en dur.

## Contraintes clés
- **Pas de contenu en dur** : textes et images doivent être gérés via une interface d’édition interne au site (studio/admin) puis exportables avant publication.
- **Mode édition masquable** : l’interface de saisie doit pouvoir être cachée pour le mode public.
- **Performance & accessibilité** : chargements rapides, responsive design, attention au contraste et aux textes alternatifs.
- **Réutilisation des données** : toutes les sections (journal, carte, gastronomie, lectures, galerie) doivent puiser dans un même stockage de contenu.

## Roadmap prioritaire
1. **Centraliser le contenu** (store unique + import/export JSON).
2. **Studio d’édition** pour créer/éditer les entrées (journal, lieux, plats, lectures, médias).
3. **Population initiale** : fournir un itinéraire et quelques contenus par défaut.
4. **Stabiliser la carte** : différencier mode édition / lecture et persister les coordonnées.
5. **Optimiser médias & SEO** : images adaptées, métadonnées, sitemap/robots.

## Succès
Le site est publiable sans modification du code source pour ajouter ou mettre à jour le contenu. L’expérience lecteur est riche et cohérente, tandis que l’édition reste simple via l’UI interne.
