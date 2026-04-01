import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'plugin-better-auth',
      link: {
        type: 'doc',
        id: 'plugin-better-auth/plugin-better-auth',
      },
      items: [
        'plugin-better-auth/installation',
        'plugin-better-auth/configuration',
        'plugin-better-auth/client-setup',
        'plugin-better-auth/server-usage',
        'plugin-better-auth/better-auth-plugins',
      ],
    },
    {
      type: 'category',
      label: 'plugin-api-permissions',
      link: {
        type: 'doc',
        id: 'plugin-api-permissions/plugin-api-permissions',
      },
      items: [
        'plugin-api-permissions/installation',
        'plugin-api-permissions/configuration',
        'plugin-api-permissions/session-resolver',
        'plugin-api-permissions/admin-panel',
        'plugin-api-permissions/how-it-works',
      ],
    },
    {
      type: 'doc',
      id: 'integration',
      label: 'Using Both Plugins Together',
    },
  ],
};

export default sidebars;
