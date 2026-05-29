import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { PROSPECT_SOURCES, type ProspectDetail } from '../lib/salesPlaybook';
import { MobilePageHeader } from '../components/MobilePageHeader';
import { useAdminAuth } from '../context/AdminAuthContext';

export function ProspectFormPage() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [shopName, setShopName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [source, setSource] = useState('walk_in');
  const [painNotes, setPainNotes] = useState('');
  const [jijiUrl, setJijiUrl] = useState('');
  const [outreachMessage, setOutreachMessage] = useState('');

  const readOnly = admin?.role === 'billing_readonly';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim()) {
      setErr('Shop name is required.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const { data } = await api.post<ProspectDetail>('/api/admin/prospects', {
        shop_name: shopName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        whatsapp_phone: whatsappPhone.trim() || phone.trim() || null,
        email: email.trim() || null,
        location: location.trim() || null,
        area: area.trim() || null,
        source,
        pain_notes: painNotes.trim() || null,
        jiji_listing_url: jijiUrl.trim() || null,
        outreach_message: outreachMessage.trim() || null,
      });
      navigate(`/prospects/${data.id}`);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      const d = ax.response?.data?.detail;
      setErr(typeof d === 'string' ? d : 'Failed to create prospect.');
    } finally {
      setSubmitting(false);
    }
  }

  if (readOnly) {
    return (
      <div>
        <p className="error">Your role cannot create prospects.</p>
        <Link to="/prospects">Back</Link>
      </div>
    );
  }

  return (
    <div>
      <MobilePageHeader title="New prospect" backTo="/prospects" />
      <form className="card form-card" onSubmit={(e) => void submit(e)}>
        <label>
          Shop name *
          <input value={shopName} onChange={(e) => setShopName(e.target.value)} required />
        </label>
        <label>
          Contact name
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </label>
        <label>
          Phone
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          WhatsApp number
          <input
            type="tel"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="Same as phone if empty"
          />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label>
          Area
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ikeja" />
        </label>
        <label>
          Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {PROSPECT_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pain / notes
          <textarea
            value={painNotes}
            onChange={(e) => setPainNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', maxWidth: 420, marginTop: 4 }}
          />
        </label>
        <label>
          Jiji listing URL
          <input value={jijiUrl} onChange={(e) => setJijiUrl(e.target.value)} />
        </label>
        <label>
          WhatsApp message template
          <textarea
            value={outreachMessage}
            onChange={(e) => setOutreachMessage(e.target.value)}
            rows={4}
            style={{ width: '100%', maxWidth: 420, marginTop: 4 }}
          />
        </label>
        {err && <p className="error">{err}</p>}
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save prospect'}
        </button>
      </form>
    </div>
  );
}
