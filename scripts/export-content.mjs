#!/usr/bin/env node
/**
 * Exporte un snapshot JSON du store Journal vers src/content/journal-snapshot.json
 * et régénère les fichiers SEO (sitemap.xml et robots.txt).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const snapshotDir = path.join(projectRoot, 'src', 'content');
const snapshotPath = path.join(snapshotDir, 'journal-snapshot.json');
const publicDir = path.join(projectRoot, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const robotsPath = path.join(publicDir, 'robots.txt');
const exportPath = process.env.STUDIO_EXPORT_PATH
  ? path.resolve(projectRoot, process.env.STUDIO_EXPORT_PATH)
  : path.join(projectRoot, 'studio', 'export.json');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Impossible de lire ${filePath}:`, error.message);
    return null;
  }
};

const normaliseEntries = (entries = []) => {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => ({
      day: Number(entry.day),
      date: typeof entry.date === 'string' ? entry.date : '',
      title: typeof entry.title === 'string' ? entry.title : '',
      location: typeof entry.location === 'string' ? entry.location : '',
      story: typeof entry.story === 'string' ? entry.story : '',
      mood: typeof entry.mood === 'string' ? entry.mood : '',
      photos: Array.isArray(entry.photos)
        ? entry.photos.filter((photo) => typeof photo === 'string' && photo.length > 0)
        : [],
      link: typeof entry.link === 'string' && entry.link.length > 0 ? entry.link : undefined,
    }))
    .filter((entry) => entry.day && entry.title && entry.date && entry.location && entry.story && entry.mood)
    .sort((a, b) => a.day - b.day);
};

const buildSnapshot = (entries) => {
  const days = entries.map((entry) => entry.day);
  return {
    generatedAt: new Date().toISOString(),
    entries,
    stats: {
      totalEntries: entries.length,
      days,
      firstDay: days[0] ?? null,
      lastDay: days.length > 0 ? days[days.length - 1] : null,
    },
  };
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const generateSitemap = (siteUrl) => {
  const baseUrl = siteUrl.replace(/\/$/, '');
  const routes = ['/', '/journal', '/food', '/gallery', '/recommendations'];
  const urls = routes
    .map((route) => {
      return `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.7'}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const generateRobots = (siteUrl) => {
  const baseUrl = siteUrl.replace(/\/$/, '');
  return `User-agent: *\nAllow: /\nDisallow: /studio\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
};

const main = () => {
  ensureDir(snapshotDir);
  ensureDir(publicDir);

  const existingSnapshot = readJsonIfExists(snapshotPath) || { entries: [] };
  let source = existingSnapshot;
  let usedSource = 'snapshot existant';

  const exportData = readJsonIfExists(exportPath);
  if (exportData) {
    if (Array.isArray(exportData)) {
      source = { entries: exportData };
      usedSource = exportPath;
    } else if (Array.isArray(exportData.entries)) {
      source = exportData;
      usedSource = exportPath;
    } else {
      console.warn(`⚠️ Le fichier ${exportPath} ne contient pas de propriété "entries" valide.`);
    }
  } else {
    console.warn('⚠️ Aucun export studio détecté, réutilisation du snapshot existant.');
  }

  const entries = normaliseEntries(source.entries);
  const snapshot = buildSnapshot(entries);

  writeJson(snapshotPath, snapshot);
  console.log(`✅ Snapshot généré (${entries.length} entrées) à partir de ${usedSource}`);

  const siteUrl = process.env.SITE_URL || 'https://example.com';
  const sitemap = generateSitemap(siteUrl);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`🗺️  Sitemap mis à jour dans ${path.relative(projectRoot, sitemapPath)}`);

  const robots = generateRobots(siteUrl);
  fs.writeFileSync(robotsPath, robots, 'utf8');
  console.log(`🤖 robots.txt mis à jour dans ${path.relative(projectRoot, robotsPath)}`);
};

main();
