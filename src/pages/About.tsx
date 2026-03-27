import type { ReactNode } from 'react';

export function About() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: '#111827',
      padding: '24px 20px 40px',
    }}>

      {/* App identity */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{
          fontFamily: "'Baloo 2', cursive",
          fontSize: '32px', fontWeight: 800,
          color: '#F59E0B', margin: 0,
        }}>
          FreeVoice AAC
        </p>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '13px', fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginTop: '4px',
        }}>
          Version {__APP_VERSION__} · Free Forever
        </p>
      </div>

      <Section title="Why FreeVoice Exists">
        <p>
          FreeVoice was built by a parent of a nonverbal child who was
          tired of watching companies charge hundreds of dollars a year
          to let their daughter speak.
        </p>
        <p style={{ marginTop: '10px' }}>
          Communication is a human right. Not a subscription service.
        </p>
      </Section>

      <Section title="Cost">
        <Pill color="green" label="$0.00 — Free forever" />
        <p style={{ marginTop: '10px' }}>
          No subscription. No account. No ads. No data collection.
          No features locked behind payment. This will never change.
        </p>
      </Section>

      <Section title="Symbols">
        <p>
          Pictographic symbols are provided by{' '}
          <Link href="https://arasaac.org">ARASAAC</Link>{' '}
          (Aragonese Portal of Augmentative and Alternative Communication),
          created by Sergio Palao for the Government of Aragon, Spain.
          Used under Creative Commons CC BY-NC-SA 4.0.
        </p>
      </Section>

      <Section title="AI Voice">
        <p>
          AI voices are powered by{' '}
          <Link href="https://github.com/hexgrad/kokoro">Kokoro TTS</Link>
          {' '}(Apache 2.0), running entirely on your device.
          Your speech is never sent to any server.
        </p>
      </Section>

      <Section title="Privacy">
        <Pill color="green" label="Zero data collection" />
        <p style={{ marginTop: '10px' }}>
          FreeVoice stores everything locally on your device.
          No accounts, no tracking, no analytics, no advertising.
          If you delete the app, all data is gone. We have no copy of anything.
        </p>
      </Section>

      <Section title="Open Source">
        <p>
          FreeVoice is open source (MIT license). View the source code,
          report bugs, request symbols, or contribute at:
        </p>
        {/* 🧑 MANUAL: Update to your actual GitHub repo URL */}
        <Link href="https://github.com/shellcraftlabs/freevoice" block>
          github.com/shellcraftlabs/freevoice
        </Link>
      </Section>

      <Section title="Support Development">
        <p>
          FreeVoice is free and always will be. If it helps your family,
          you can support ongoing development through GitHub Sponsors.
          No pressure — the app never changes based on donations.
        </p>
        {/* 🧑 MANUAL: Update to your actual GitHub Sponsors URL */}
        <Link href="https://github.com/sponsors/shellcraftlabs" block>
          github.com/sponsors/shellcraftlabs
        </Link>
      </Section>

      <Section title="Legal">
        {/* 🧑 MANUAL: Create a terms page at freevoice.app/terms */}
        <Link href="https://freevoice.app/terms">Terms of Use & Disclaimers</Link>
        <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          FreeVoice is not affiliated with Tobii Dynavox, Mayer-Johnson,
          AssistiveWare, or any other AAC vendor.
        </p>
      </Section>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '13px', fontWeight: 700,
          color: 'rgba(255,255,255,0.25)',
          fontStyle: 'italic',
        }}>
          Built with love by Shellcraft Labs LLC<br />
          Roswell, Georgia · 2026
        </p>
      </div>

    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: '#1B2845',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '12px',
    }}>
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '10px', fontWeight: 900,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: '#F59E0B', marginBottom: '10px',
      }}>
        {title}
      </p>
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '14px', fontWeight: 700,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.65,
      }}>
        {children}
      </div>
    </div>
  );
}

function Pill({ color, label }: { color: 'green' | 'amber'; label: string }) {
  const colors = {
    green: { bg: 'rgba(39,174,96,0.12)', border: 'rgba(39,174,96,0.3)', text: '#86EFAC' },
    amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' },
  };
  const c = colors[color];
  return (
    <span style={{
      display: 'inline-block',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, borderRadius: '100px',
      padding: '4px 14px', fontSize: '13px', fontWeight: 900,
    }}>
      {label}
    </span>
  );
}

function Link({ href, children, block }: {
  href: string; children: ReactNode; block?: boolean
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: '#4FC3F7', fontWeight: 800, textDecoration: 'none',
      display: block ? 'block' : 'inline',
      marginTop: block ? '8px' : 0,
      fontSize: block ? '13px' : 'inherit',
    }}>
      {children}
    </a>
  );
}
