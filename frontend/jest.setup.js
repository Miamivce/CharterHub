// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom';

// Mock localStorage and sessionStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: new LocalStorageMock(),
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Intersection Observer
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    return null;
  }

  unobserve() {
    return null;
  }

  disconnect() {
    return null;
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock Vite's import.meta.env
// This needs to be global for modules that use it
global.import = {
  meta: {
    env: {
      DEV: process.env.NODE_ENV === 'development',
      PROD: process.env.NODE_ENV === 'production',
      MODE: process.env.NODE_ENV,
      VITE_PHP_API_URL: 'http://localhost:8000',
      VITE_WP_API_URL: 'http://localhost:8000/wp-json/wp/v2',
    }
  }
};

// Set mock environment variables
process.env.VITE_PHP_API_URL = 'http://localhost:8000';
process.env.VITE_WP_API_URL = 'http://localhost:8000/wp-json/wp/v2';
process.env.NODE_ENV = 'test';

// Suppress console errors and warnings in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}; 