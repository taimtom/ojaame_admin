import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Summary = {
  total_subscriptions: number;
  by_status: Record<string, number>;
  unpaid_invoices: number;
  unpaid_invoice_total: number;
};

export function BillingSummaryPage() {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Summary>('/api/admin/billing/summary');
      setS(data);
    })();
  }, []);

  if (!s) return <p>Loading…</p>;

  return (
    <div>
      <h1>Billing summary</h1>
      <div className="grid cards">
        <div className="card stat">
          <div className="label">Subscriptions</div>
          <div className="value">{s.total_subscriptions}</div>
        </div>
        <div className="card stat">
          <div className="label">Unpaid invoices</div>
          <div className="value">{s.unpaid_invoices}</div>
        </div>
        <div className="card stat">
          <div className="label">Unpaid total</div>
          <div className="value">{s.unpaid_invoice_total.toFixed(2)}</div>
        </div>
      </div>
      <div className="card">
        <h2>By status</h2>
        <pre className="json-pre">{JSON.stringify(s.by_status, null, 2)}</pre>
      </div>
    </div>
  );
}
