import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/plugin-better-auth/__docusaurus/debug',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug', '0ed'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/config',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/config', 'd31'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/content',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/content', '62a'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/globalData',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/globalData', '317'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/metadata',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/metadata', '306'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/registry',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/registry', 'e16'),
    exact: true
  },
  {
    path: '/plugin-better-auth/__docusaurus/debug/routes',
    component: ComponentCreator('/plugin-better-auth/__docusaurus/debug/routes', 'b1c'),
    exact: true
  },
  {
    path: '/plugin-better-auth/docs',
    component: ComponentCreator('/plugin-better-auth/docs', 'f63'),
    routes: [
      {
        path: '/plugin-better-auth/docs',
        component: ComponentCreator('/plugin-better-auth/docs', '782'),
        routes: [
          {
            path: '/plugin-better-auth/docs',
            component: ComponentCreator('/plugin-better-auth/docs', 'b4f'),
            routes: [
              {
                path: '/plugin-better-auth/docs/integration',
                component: ComponentCreator('/plugin-better-auth/docs/integration', 'cb9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/intro',
                component: ComponentCreator('/plugin-better-auth/docs/intro', '4b0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/', '5ed'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/admin-panel',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/admin-panel', 'a47'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/configuration',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/configuration', '796'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/how-it-works',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/how-it-works', '3e8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/installation',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/installation', '8d8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-api-permissions/session-resolver',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-api-permissions/session-resolver', 'bff'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/', '175'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/better-auth-plugins',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/better-auth-plugins', '428'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/client-setup',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/client-setup', '5ec'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/configuration',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/configuration', 'efb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/installation',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/installation', '565'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/plugin-better-auth/docs/plugin-better-auth/server-usage',
                component: ComponentCreator('/plugin-better-auth/docs/plugin-better-auth/server-usage', 'e33'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/plugin-better-auth/',
    component: ComponentCreator('/plugin-better-auth/', '021'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
