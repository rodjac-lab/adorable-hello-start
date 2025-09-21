#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(projectRoot, "public", "lovable-uploads");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const verbose = args.includes("--verbose");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  ".cache",
  "storybook-static",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".html",
  ".css",
  ".scss",
  ".txt",
  ".yml",
  ".yaml",
  ".svg",
  ".tsv",
  ".csv",
]);

const ensureUploadsDir = async () => {
  try {
    const stat = await fs.promises.stat(uploadsDir);
    if (!stat.isDirectory()) {
      throw new Error(`Le chemin ${uploadsDir} n'est pas un dossier`);
    }
  } catch (error) {
    console.error("❌ Dossier public/lovable-uploads introuvable");
    process.exit(1);
  }
};

const listUploadFiles = async () => {
  const entries = await fs.promises.readdir(uploadsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
};

const collectTextFiles = async (rootDir) => {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.promises.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(projectRoot, fullPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || relativePath.startsWith(path.join("public", "lovable-uploads"))) {
          continue;
        }
        stack.push(fullPath);
      } else {
        const extension = path.extname(entry.name).toLowerCase();
        if (TEXT_EXTENSIONS.has(extension)) {
          files.push(fullPath);
        }
      }
    }
  }

  return files;
};

const cache = new Map();

const readFileCached = async (filePath) => {
  if (!cache.has(filePath)) {
    const content = await fs.promises.readFile(filePath, "utf8");
    cache.set(filePath, content);
  }
  return cache.get(filePath);
};

const findReferences = async (fileName, searchFiles) => {
  const token = `lovable-uploads/${fileName}`;
  const matches = [];

  for (const filePath of searchFiles) {
    const content = await readFileCached(filePath);
    if (content.includes(token)) {
      matches.push(path.relative(projectRoot, filePath));
    }
  }

  return matches;
};

const run = async () => {
  await ensureUploadsDir();

  const uploadFiles = await listUploadFiles();
  if (uploadFiles.length === 0) {
    console.log("✅ Aucun fichier à analyser dans public/lovable-uploads");
    return;
  }

  const searchFiles = await collectTextFiles(projectRoot);
  const orphaned = [];
  const used = [];

  for (const fileName of uploadFiles) {
    const references = await findReferences(fileName, searchFiles);

    if (references.length === 0) {
      orphaned.push(fileName);
    } else {
      used.push({ fileName, references });
      if (verbose) {
        console.log(`🔗 ${fileName} référencé dans ${references.join(", ")}`);
      }
    }
  }

  if (orphaned.length === 0) {
    console.log("✅ Aucun fichier orphelin détecté dans public/lovable-uploads");
    return;
  }

  console.log(`⚠️ ${orphaned.length} fichier(s) orphelin(s) détecté(s):`);
  orphaned.forEach((file) => console.log(` • ${file}`));

  if (apply) {
    await Promise.all(
      orphaned.map(async (file) => {
        const target = path.join(uploadsDir, file);
        await fs.promises.unlink(target);
        console.log(`🧹 Supprimé: ${file}`);
      })
    );
    console.log("✅ Nettoyage terminé");
  } else {
    console.log("ℹ️ Exécutez le script avec --apply pour supprimer les fichiers listés.");
  }
};

run().catch((error) => {
  console.error("❌ Erreur durant le nettoyage des uploads", error);
  process.exit(1);
});
