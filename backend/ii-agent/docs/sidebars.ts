import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'welcome',
    'getting-started',
    {
      type: 'category',
      label: 'Required Environment Variables',
      link: {type: 'doc', id: 'required-environment-variables/required-environment-variables'},
      items: [
        {type: 'doc', id: 'required-environment-variables/frontend-env'},
        {type: 'doc', id: 'required-environment-variables/networking-tunnels'},
        {type: 'doc', id: 'required-environment-variables/host-paths'},
        {type: 'doc', id: 'required-environment-variables/llm-auth'},
        {type: 'doc', id: 'required-environment-variables/storage'},
        {type: 'doc', id: 'required-environment-variables/backend-sandbox'},
        {type: 'doc', id: 'required-environment-variables/tool-server-baseline'},
        {type: 'doc', id: 'required-environment-variables/sandbox-server'},
      ],
    },
    {
      type: 'category',
      label: 'Optional Environment Variables',
      link: {type: 'doc', id: 'optional-environment-variables/optional-environment-variables'},
      items: [
        {type: 'doc', id: 'optional-environment-variables/optional-payment'},
        {type: 'doc', id: 'optional-environment-variables/optional-media-generation'},
        {type: 'doc', id: 'optional-environment-variables/optional-web-search'},
        {type: 'doc', id: 'optional-environment-variables/optional-web-visits'},
        {type: 'doc', id: 'optional-environment-variables/optional-image-search'},
        {type: 'doc', id: 'optional-environment-variables/optional-database-neon'},
        {type: 'doc', id: 'optional-environment-variables/optional-tool-server-llm'},
        {type: 'doc', id: 'optional-environment-variables/optional-researcher-config'},
      ],
    },
    'core-infrastructure',
  ],
};

export default sidebars;
