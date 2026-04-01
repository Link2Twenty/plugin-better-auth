import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const features = [
  {
    emoji: '🔌',
    title: 'Better Auth adapter',
    description:
      'Use Strapi as the database backend for Better Auth. Supports all core features — users, sessions, accounts, and verification tokens.',
  },
  {
    emoji: '🛡️',
    title: 'Content API permissions',
    description:
      'Fine-grained role-based access control for Strapi\'s Content API. Create and manage roles directly from the admin panel.',
  },
  {
    emoji: '⚡',
    title: 'Auto-wired integration',
    description:
      'Install both plugins and they connect automatically. No manual session resolver setup required — it just works.',
  },
];

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline} noFooter={false}>
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleAccent}>Strapi Auth</span>
                <br />
                Adaptable end-user auth
              </h1>
              <p className={styles.heroSubtitle}>
                {siteConfig.tagline}
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.btnPrimary} to="/docs/intro">
                  Get started
                </Link>
                <Link
                  className={styles.btnSecondary}
                  to="https://github.com/strapi-community/plugin-better-auth"
                >
                  View on GitHub
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual} aria-hidden="true">
              <div className={styles.heroGlyph}>🔐</div>
            </div>
          </section>

          {/* ── Feature cards ────────────────────────────────────── */}
          <section className={styles.features}>
            {features.map((f) => (
              <div key={f.title} className={styles.card}>
                <div className={styles.cardIcon}>{f.emoji}</div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDescription}>{f.description}</p>
              </div>
            ))}
          </section>

        </div>
      </main>
    </Layout>
  );
}
