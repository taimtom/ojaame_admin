import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  shouldShowCelebration,
  type PlaybookProgress,
  type ProspectDetail,
} from '../lib/salesPlaybook';
import { PlaybookProgressRing } from '../components/PlaybookProgressRing';
import { PlaybookChecklist } from '../components/PlaybookChecklist';
import { PlaybookCelebration } from '../components/PlaybookCelebration';
import { MobilePageHeader } from '../components/MobilePageHeader';

export function ProspectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [playbook, setPlaybook] = useState<PlaybookProgress | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  const readOnly = admin?.role === 'billing_readonly';
  const converted = Boolean(prospect?.converted_company_id);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<ProspectDetail>(`/api/admin/prospects/${id}`);
      setProspect(data);
      setPlaybook(data.playbook);
      if (
        shouldShowCelebration('prospect', data.id, data.playbook.just_completed)
      ) {
        setCelebrate(true);
      }
    } catch {
      setErr('Failed to load prospect.');
      setProspect(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markStep(stepKey: string) {
    if (!id) return;
    setErr(null);
    try {
      const { data } = await api.post<{ playbook: PlaybookProgress }>(
        `/api/admin/prospects/${id}/steps/${stepKey}`,
        {}
      );
      setPlaybook(data.playbook);
      if (prospect) {
        setProspect({ ...prospect, playbook: data.playbook });
      }
      if (shouldShowCelebration('prospect', Number(id), data.playbook.just_completed)) {
        setCelebrate(true);
      }
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setErr(typeof ax.response?.data?.detail === 'string' ? ax.response?.data?.detail : 'Failed.');
    }
  }

  async function undoStep(stepKey: string) {
    if (!id) return;
    try {
      const { data } = await api.delete<{ playbook: PlaybookProgress }>(
        `/api/admin/prospects/${id}/steps/${stepKey}`
      );
      setPlaybook(data.playbook);
      if (prospect) setProspect({ ...prospect, playbook: data.playbook });
    } catch {
      setErr('Could not undo step.');
    }
  }

  async function markLost() {
    if (!id || !window.confirm('Mark this prospect as lost?')) return;
    await api.patch(`/api/admin/prospects/${id}`, { status: 'lost' });
    void load();
  }

  async function copyScript(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setErr('Could not copy.');
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!prospect || !playbook) {
    return (
      <div>
        <p className="error">{err ?? 'Prospect not found.'}</p>
        <Link to="/prospects">Back</Link>
      </div>
    );
  }

  const next = playbook.next_step;
  const isWhatsAppNext = next?.key === 'whatsapp_sent';

  return (
    <div className="prospect-detail-page">
      <PlaybookCelebration
        open={celebrate}
        shopName={prospect.shop_name}
        kind="prospect"
        resourceId={prospect.id}
        onClose={() => setCelebrate(false)}
      />

      <MobilePageHeader title={prospect.shop_name} backTo="/prospects" />

      <div className="prospect-detail-header card">
        <PlaybookProgressRing percent={playbook.percent} size={80} />
        <div>
          <p className="muted">{prospect.contact_name ?? 'No contact name'}</p>
          <span className={`status-pill status-${prospect.status}`}>{prospect.status}</span>
          {prospect.area && <p className="muted">{prospect.area}</p>}
          {prospect.converted_company_id && (
            <p>
              <Link to={`/businesses/${prospect.converted_company_id}`}>View business →</Link>
            </p>
          )}
        </div>
      </div>

      {err && <p className="error">{err}</p>}

      <p className="toolbar" style={{ marginTop: 0 }}>
        <Link to="/sales-guide" className="btn ghost">
          Full field sales guide
        </Link>
      </p>

      {next && !converted && (
        <div className="card next-action-card">
          <h2 style={{ marginTop: 0 }}>Next: {next.label}</h2>
          {next.guide?.summary && <p className="muted">{next.guide.summary}</p>}
          <div className="next-action-buttons">
            {isWhatsAppNext && prospect.whatsapp_url && (
              <a
                href={prospect.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                className="btn primary"
              >
                Open WhatsApp
              </a>
            )}
            {!readOnly && (
              <button type="button" className="btn primary" onClick={() => void markStep(next.key)}>
                Mark done
              </button>
            )}
          </div>
        </div>
      )}

      {!converted && !readOnly && (
        <div className="toolbar">
          <Link
            to={`/prospects/${id}/convert`}
            className="btn primary"
            onClick={(e) => {
              if (!playbook.steps.find((s) => s.key === 'pilot_agreed')?.done) {
                if (!window.confirm('Pilot not marked agreed yet. Convert anyway?')) {
                  e.preventDefault();
                }
              }
            }}
          >
            Convert to business
          </Link>
          <button type="button" className="btn ghost" onClick={() => void markLost()}>
            Mark lost
          </button>
        </div>
      )}

      {prospect.pain_notes && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pain / notes</h3>
          <p>{prospect.pain_notes}</p>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Playbook</h2>
        <PlaybookChecklist
          playbook={playbook}
          converted={converted}
          readOnly={readOnly}
          onMarkDone={(key) => void markStep(key)}
          onUndo={(key) => void undoStep(key)}
          onCopyScript={(t) => void copyScript(t)}
        />
      </div>

      <div className="card muted-contact">
        <p>
          <strong>Phone:</strong>{' '}
          {prospect.phone ? (
            <a href={`tel:${prospect.phone}`}>{prospect.phone}</a>
          ) : (
            '—'
          )}
        </p>
        <p>
          <strong>Email:</strong> {prospect.email ?? '—'}
        </p>
        <p>
          <strong>Source:</strong> {prospect.source}
        </p>
      </div>

      {!readOnly && (
        <div className="sticky-bottom-bar hide-desktop">
          {next && (
            <>
              {isWhatsAppNext && prospect.whatsapp_url && (
                <a href={prospect.whatsapp_url} target="_blank" rel="noreferrer" className="btn primary">
                  WhatsApp
                </a>
              )}
              <button type="button" className="btn primary" onClick={() => void markStep(next.key)}>
                Done
              </button>
            </>
          )}
          {!converted && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate(`/prospects/${id}/convert`)}
            >
              Convert
            </button>
          )}
        </div>
      )}
    </div>
  );
}
