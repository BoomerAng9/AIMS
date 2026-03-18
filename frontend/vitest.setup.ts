import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => {
        return ({ children, ...props }: { children?: React.ReactNode }) =>
          React.createElement('div', props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
