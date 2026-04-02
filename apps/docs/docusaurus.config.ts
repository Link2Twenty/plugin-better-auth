import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Strapi Auth',
  tagline: 'Better Auth + Content API permissions for Strapi v5',
  favicon: 'img/favicon.ico',

  url: 'https://strapi-community.github.io',
  baseUrl: '/plugin-better-auth/',

  organizationName: 'strapi-community',
  projectName: 'plugin-better-auth',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
          routeBasePath: '/docs',
          editUrl:
            'https://github.com/strapi-community/plugin-better-auth/tree/main/apps/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Strapi Auth',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/strapi-community/plugin-better-auth',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Packages',
          items: [
            {
              label: 'plugin-better-auth',
              to: '/docs/plugin-better-auth',
            },
            {
              label: 'plugin-api-permissions',
              to: '/docs/plugin-api-permissions',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Better Auth',
              href: 'https://better-auth.com',
            },
            {
              label: 'Strapi',
              href: 'https://strapi.io',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/strapi-community/plugin-better-auth',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Strapi Community. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
