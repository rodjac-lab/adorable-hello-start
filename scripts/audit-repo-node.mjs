// Audit "hors-ligne" sans npm install ni accès réseau
import fs from 'fs'
import path from 'path'
const cwd = process.cwd()

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')) } catch { return null } }
function exists(p) { return fs.existsSync(p) }
function listFiles(dir, exts=new Set(), max=10000) {
  const out = []
  function walk(d) {
    let entries = []
    try { entries = fs.readdirSync(d, { withFileTypes:true }) } catch { return }
    for (const e of entries) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) {
        if (['.git','node_modules','_recovered','.next','dist','build','.vercel','.cache'].includes(e.name)) continue
        walk(full)
      } else {
        if (exts.size === 0) out.push(full)
        else {
          const ext = path.extname(e.name).toLowerCase()
          if (exts.has(ext)) out.push(full)
        }
        if (out.length >= max) return
      }
    }
  }
  walk(dir)
  return out
}

// 1) package.json / deps
const pkg = readJSON(path.join(cwd,'package.json')) || { scripts:{}, dependencies:{}, devDependencies:{} }
const allDeps = Object.assign({}, pkg.dependencies||{}, pkg.devDependencies||{})
const depNames = Object.keys(allDeps).sort()

// 2) détecter framework
let framework = 'Inconnu'
if ('next' in allDeps) framework = 'Next.js'
else if ('astro' in allDeps) framework = 'Astro'
else if ('vite' in allDeps) framework = 'Vite (React?)'

// 3) routes/pages courantes
const routeExts = new Set(['.tsx','.jsx','.ts','.js','.mdx','.md'])
const appPages = exists('app') ? listFiles('app', routeExts, 5000).filter(f => /[\\/]page\.(tsx|jsx|mdx|ts|js)$/.test(f)) : []
const pagesDir = exists('pages') ? listFiles('pages', routeExts, 5000) : []

// 4) médias lourds
const mediaExts = new Set(['.jpg','.jpeg','.png','.webp','.avif','.gif','.svg'])
const media = exists('public') ? listFiles('public', mediaExts, 20000) : []
const mediaSizes = media.map(f => {
  let s = 0; try { s = fs.statSync(f).size } catch {}
  return { file:f, MB:(s/1e6) }
}).sort((a,b)=>b.MB-a.MB).slice(0,50)

// 5) fichiers “contenu” possibles
const contentFiles = listFiles('.', new Set(['.md','.mdx','.json']), 20000)
  .filter(f => !f.includes('node_modules') && !f.includes('/.git/') && !f.includes('/_recovered/'))

// 6) configs présentes
const configs = ['next.config.js','next.config.ts','tailwind.config.js','tailwind.config.ts','astro.config.mjs','.eslintrc.js','.eslintrc.cjs','tsconfig.json','.prettierrc','contentlayer.config.ts']
  .filter(exists)

// 7) quick wins
const quickWins = [
  'Optimiser les images > 1 MB (WebP/AVIF, variants 800/1200/1600).',
  'Séparer le contenu en MDX (content/etapes) pour édition simple.',
  'Ajouter metas SEO + og:image par page.',
  'Activer lazy + dimensions fixes sur toutes les images.',
  'Sitemap.xml + robots.txt.',
  'Nettoyer dépendances orphelines.',
  'Activer une CI minimale build/lint/typecheck.',
  'Page /galerie avec Masonry + Lightbox.',
  'Recherche client (Fuse.js) sur titre/tags/texte.',
  'Carte itinéraire Leaflet/MapLibre synchronisée avec la timeline.'
]

// 8) sortie README-AUDIT.md
const lines = []
lines.push(`# Audit du dépôt (hors-ligne)`)
lines.push(`\n**Framework détecté** : ${framework}\n`)
lines.push(`## Dépendances (${depNames.length})\n${depNames.map(d=>`- ${d} ${allDeps[d]}`).join('\n') || '_Aucune_'}\n`)
lines.push(`## Configs détectées\n${configs.map(c=>`- ${c}`).join('\n') || '_Aucune_'}\n`)
lines.push(`## Routes/pages (App Router)\n${appPages.map(p=>`- ${p}`).join('\n') || '_Aucune_'}\n`)
lines.push(`## Routes/pages (pages/)\n${pagesDir.map(p=>`- ${p}`).join('\n') || '_Aucune_'}\n`)
lines.push(`## Médias les plus lourds (Top 50)\n${mediaSizes.map(m=>`- ${m.file} — ${m.MB.toFixed(2)} MB`).join('\n') || '_Aucun_'}\n`)
lines.push(`## Fichiers de contenu détectés (.md/.mdx/.json)\n${contentFiles.slice(0,200).map(f=>`- ${f}`).join('\n') || '_Aucun_'}\n`)
lines.push(`## Quick wins\n${quickWins.map((q,i)=>`${i+1}. ${q}`).join('\n')}\n`)
fs.writeFileSync('README-AUDIT.md', lines.join('\n'), 'utf8')
console.log('✅ README-AUDIT.md généré (mode hors-ligne)')
