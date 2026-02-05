import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Intelligent Internet',
  tagline: 'Blueprint for the Intelligence Age',
  favicon: 'img/logo-only.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://ii.inc',
  // Serve the generated site from https://ii.inc/web/*
  baseUrl: '/ii-agent-prod',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'intelligent-internet', // Usually your GitHub org/user name.
  projectName: 'ii-agent-prod', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/intelligent-internet/ii-agent-prod/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/intelligent-internet/ii-agent-prod/tree/main/docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'setup',
        path: 'setup',
        routeBasePath: 'setup',
        sidebarPath: './setup/sidebars.ts',
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/logo-only.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Intelligent Internet',
      logo: {
        alt: 'Intelligent Internet logo',
        src: 'img/logo-only.png',
      },
      items: [
        {type: 'doc', docId: 'welcome', position: 'left', label: 'Welcome'},
        {type: 'doc', docId: 'getting-started', position: 'left', label: 'Getting Started'},
        {type: 'doc', docId: 'core-infrastructure', position: 'left', label: 'Core Infrastructure'},
        {
          href: 'https://ii.inc/web',
          label: 'ii.inc',
          position: 'right',
        },
        {
          href: 'https://x.com/ii_posts',
          label: 'X',
          position: 'right',
        },
        {
          href: 'https://github.com/intelligent-internet',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Welcome',
              to: '/docs/welcome',
            },
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Required Variables',
              to: '/docs/required-environment-variables',
            },
            {
              label: 'Optional Variables',
              to: '/docs/optional-environment-variables',
            },
            {
              label: 'Core Infrastructure',
              to: '/docs/core-infrastructure',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Whitepaper',
              href: 'https://ii.inc/web/whitepaper',
            },
            {
              label: 'Master Plan',
              href: 'https://ii.inc/web/blog/post/master-plan',
            },
            {
              label: 'The Last Economy',
              href: 'https://ii.inc/web/the-last-economy',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.com/invite/intelligentinternet',
            },
            {
              label: 'X',
              href: 'https://x.com/ii_posts',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/intelligent-internet',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Intelligent Internet. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
