import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { SalesGuideData } from '../lib/salesPlaybook';
import { MobilePageHeader } from '../components/MobilePageHeader';

const STEP_ORDER = [
  'prospect_created',
  'whatsapp_sent',
  'interest_confirmed',
  'discovery_done',
  'demo_done',
  'pilot_agreed',
  'business_provisioned',
  'owner_active',
  'products_loaded',
  'pilot_week_complete',
  'go_live',
  'daily_use_confirmed',
  'subscription_active',
];

export function SalesGuidePage() {
  const [guide, setGuide] = useState<SalesGuideData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<SalesGuideData>('/api/admin/sales-playbook/guide');
        setGuide(data);
      } catch {
        setErr('Could not load sales guide.');
      }
    })();
  }, []);

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setErr('Copy failed.');
    }
  }

  if (err) return <p className="error">{err}</p>;
  if (!guide) return <p className="muted">Loading guide…</p>;

  return (
    <div className="sales-guide-page">
      <MobilePageHeader title="Field sales guide" backTo="/prospects" backLabel="← Prospects" />
      <div className="toolbar">
        <a
          href="/ojaame-field-sales-playbook.pdf"
          target="_blank"
          rel="noreferrer"
          className="btn primary"
        >
          Download PDF
        </a>
        <button type="button" className="btn ghost" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <p className="muted">
        Full playbook for Ojaame field sales. Use with each prospect checklist — tap &quot;What is
        this step?&quot; on any step for the same detail.
      </p>

      {guide.vertical_by_day && (
        <div className="card">
          <h2>Weekly focus (pick one lane per day)</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Target</th>
                  <th>Lead with pain</th>
                </tr>
              </thead>
              <tbody>
                {guide.vertical_by_day.map((row) => (
                  <tr key={row.day}>
                    <td>{row.day}</td>
                    <td>{row.target}</td>
                    <td>{row.pain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {guide.sections.map((sec) => (
        <div key={sec.id} className="card">
          <h2>{sec.title}</h2>
          <ul>
            {sec.content.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="card">
        <h2>Playbook steps explained</h2>
        {STEP_ORDER.map((key) => {
          const step = guide.steps[key];
          if (!step) return null;
          return (
            <details key={key} className="guide-step-details">
              <summary>
                <strong>{key.replace(/_/g, ' ')}</strong>
                {step.summary && ` — ${step.summary}`}
              </summary>
              {step.goal && (
                <p>
                  <strong>Goal:</strong> {step.goal}
                </p>
              )}
              {step.success && (
                <ul>
                  {step.success.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              {step.how_to && (
                <ul>
                  {step.how_to.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              {step.script && (
                <div className="script-block">
                  <pre>{step.script}</pre>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void copyText(step.script!, key)}
                  >
                    {copied === key ? 'Copied' : 'Copy script'}
                  </button>
                </div>
              )}
            </details>
          );
        })}
      </div>

      <div className="card">
        <h2>WhatsApp & message templates</h2>
        {Object.entries(guide.message_templates).map(([id, tpl]) => (
          <details key={id} className="guide-step-details">
            <summary>{tpl.title}</summary>
            <pre>{tpl.body}</pre>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void copyText(tpl.body, id)}
            >
              {copied === id ? 'Copied' : 'Copy'}
            </button>
          </details>
        ))}
      </div>

      <div className="card">
        <h2>Objection handlers</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>They say</th>
                <th>You say</th>
              </tr>
            </thead>
            <tbody>
              {guide.objection_handlers.map((row) => (
                <tr key={row.objection}>
                  <td>{row.objection}</td>
                  <td>{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Deal card fields</h2>
        <p className="muted">Track every shop — also captured in each prospect record.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {guide.deal_card_fields.map((row) => (
                <tr key={row.field}>
                  <td>{row.field}</td>
                  <td>{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p>
        <Link to="/prospects">← Back to prospects</Link>
      </p>
    </div>
  );
}
