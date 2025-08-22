import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock console.log pour éviter le spam dans les tests
global.console = {
  ...global.console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};