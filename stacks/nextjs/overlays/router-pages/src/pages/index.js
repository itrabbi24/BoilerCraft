import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>{{{APP_TITLE_JS}}}</title>
        <meta name="description" content={{{APP_DESC_JS}}} />
      </Head>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{{APP_TITLE}}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>{{APP_DESC}}</p>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '1rem', textAlign: 'left', border: '1px solid var(--color-border)' }}>
          <h3>Configured Architecture:</h3>
          <ul>
            <li><strong>Framework:</strong> Next.js {{VERSION}} (Pages Router)</li>
            <li><strong>Database:</strong> {{DATABASE}}</li>
            <li><strong>Styling:</strong> {{STYLING}}</li>
            <li><strong>Theme:</strong> {{THEME}}</li>
          </ul>
          <p>Health API: <a href="/api/health" style={{ color: 'var(--color-primary)' }}>/api/health</a></p>
        </div>
      </div>
    </>
  );
}
