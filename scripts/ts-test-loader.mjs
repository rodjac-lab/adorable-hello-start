import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import ts from 'typescript';

const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  esModuleInterop: true,
  resolveJsonModule: true,
  allowSyntheticDefaultImports: true,
};

export async function load(url, context, defaultLoad) {
  const parsed = new URL(url);
  if (parsed.protocol === 'data:') {
    return defaultLoad(url, context, defaultLoad);
  }

  if (parsed.pathname.endsWith('.ts') || parsed.pathname.endsWith('.tsx')) {
    const filename = fileURLToPath(parsed);
    const source = await readFile(filename, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions,
      fileName: filename,
    });

    return {
      format: 'module',
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}

const candidateExtensions = ['', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'];

const tryResolvePath = async (basePath) => {
  for (const extension of candidateExtensions) {
    const candidate = extension ? `${basePath}${extension}` : basePath;
    try {
      await access(candidate, fsConstants.F_OK);
      return candidate;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return null;
};

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const basePath = path.join(process.cwd(), 'src', specifier.slice(2));
    const resolvedPath = await tryResolvePath(basePath);
    if (resolvedPath) {
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentUrl = context.parentURL ?? pathToFileURL(process.cwd()).href;
    const parentPath = fileURLToPath(parentUrl);
    const basePath = path.resolve(path.dirname(parentPath), specifier);
    const resolvedPath = await tryResolvePath(basePath);
    if (resolvedPath) {
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
