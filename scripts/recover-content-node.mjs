// Sauvetage "hors-ligne" : inventorie les contenus texte et médias sans copier les binaires
import fs from 'fs'
import path from 'path'

const OUT_DIR = '_recovered'
const OUT_FILE = path.join(OUT_DIR, 'RECOVERY.md')
fs.mkdirSync(OUT_DIR, { recursive: true })

function walk(dir, cb) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '_recovered', '.next', 'dist', 'build', '.vercel', '.cache'].includes(entry.name)) continue
      walk(full, cb)
    } else {
      cb(full)
    }
  }
}

const keptContent = []
const skippedMedia = []

walk('.', (file) => {
  const ext = path.extname(file).toLowerCase()
  const isContent = ['.md', '.mdx', '.json'].includes(ext)
  const isMedia = file.startsWith('public/') && ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'].includes(ext)
  if (isContent) {
    let size = 0
    try {
      size = fs.statSync(file).size
    } catch {
      size = 0
    }
    keptContent.push({ file, size })
  } else if (isMedia) {
    skippedMedia.push(file)
  }
})

const now = new Date().toISOString()
const lines = []
lines.push(`# Récupération (${now})\n`)
lines.push(`## Fichiers de contenu détectés (${keptContent.length})`)
if (keptContent.length === 0) {
  lines.push('_Aucun_\n')
} else {
  for (const item of keptContent) {
    lines.push(`- ${item.file} — ${(item.size / 1e6).toFixed(2)} MB`)
  }
  lines.push('')
}
lines.push(`## Médias ignorés (non copiés) (${skippedMedia.length})`)
if (skippedMedia.length === 0) {
  lines.push('_Aucun_\n')
} else {
  for (const file of skippedMedia) {
    lines.push(`- ${file}`)
  }
  lines.push('')
}

fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8')
console.log(`✅ Inventaire sauvegardé dans ${OUT_FILE}`)
