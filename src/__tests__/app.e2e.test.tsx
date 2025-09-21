import { render, screen } from '@testing-library/react';
import App from '@/App';
import { describe, it, beforeEach, expect } from 'vitest';

describe('Application – scénarios utilisateur principaux', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('affiche le héros d’accueil avec son image descriptive', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { name: /jordanie/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /lever de soleil sur les tombeaux nabatéens de pétra/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /récupérer mes données/i })).toHaveAttribute('href', '/journal');
  });

  it('pré-remplit le journal avec les entrées exportées', async () => {
    window.history.pushState({}, '', '/journal');
    render(<App />);

    expect(await screen.findByText(/Jour 1 — Arrivée à Amman/i)).toBeInTheDocument();
    expect(screen.getByText(/Route vers Pétra/i)).toBeInTheDocument();
  });

  it('charge la galerie lorsque l’URL change', async () => {
    window.history.pushState({}, '', '/gallery');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /galerie/i })).toBeInTheDocument();
  });
});
