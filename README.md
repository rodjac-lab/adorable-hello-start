# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6a119594-68d2-479c-b2aa-bc0034880cb6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6a119594-68d2-479c-b2aa-bc0034880cb6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6a119594-68d2-479c-b2aa-bc0034880cb6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Workflow de gestion du contenu

1. **Activer le studio** : démarrez l'application (`npm run dev`) et ouvrez l'interface d'édition intégrée pour mettre à jour les contenus du journal (textes, photos, liens...).
2. **Remplir ou mettre à jour les fiches** : vérifiez que chaque jour possède un titre, une date et une humeur. Utilisez l'outil de diagnostic pour contrôler les sauvegardes locales.
3. **Exporter les données** : une fois le contenu validé, exécutez `npm run export-content`. La commande génère `src/content/journal-snapshot.json`, met à jour `public/sitemap.xml` et `public/robots.txt`. Définissez `SITE_URL` si vous souhaitez personnaliser l'URL du sitemap.
4. **Contrôler la carte & la navigation** : lancez les tests (`npx vitest run`) afin de vérifier l'affichage du journal exporté et la navigation des pages clés, en particulier la carte interactive.
5. **Désactiver le studio avant déploiement** : assurez-vous de quitter le mode édition pour éviter d'exposer les outils de diagnostic, puis lancez le build ou la publication.
