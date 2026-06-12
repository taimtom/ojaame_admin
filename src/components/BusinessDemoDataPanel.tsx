import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { formatApiError } from '../lib/formatApiError';

type StoreOption = { id: number; name: string };

type DemoImportResponse = {
  source: string;
  store_id: number;
  products: { created_count?: number; failed_count?: number };
  customers: number;
  restock_events: number;
  sales: number;
  expenses: number;
};

type StoreEligibility = {
  store_id: number;
  product_count: number;
  sale_count: number;
  can_import: boolean;
};

type FileSlot = 'products' | 'customers' | 'restock' | 'sales' | 'expenses';

const SLOTS: { key: FileSlot; label: string; required: boolean; template: string }[] = [
  { key: 'products', label: 'products.csv', required: true, template: 'products.csv' },
  { key: 'customers', label: 'customers.csv', required: false, template: 'customers.csv' },
  { key: 'restock', label: 'restock.csv', required: false, template: 'restock.csv' },
  { key: 'sales', label: 'sales.csv', required: false, template: 'sales.csv' },
  { key: 'expenses', label: 'expenses.csv', required: false, template: 'expenses.csv' },
];

type Props = {
  companyId: string;
  stores: StoreOption[];
  signupMethod: string;
};

export function BusinessDemoDataPanel({ companyId, stores, signupMethod }: Props) {
  const [storeId, setStoreId] = useState<string>(() => (stores[0] ? String(stores[0].id) : ''));
  const [files, setFiles] = useState<Partial<Record<FileSlot, File>>>({});
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<StoreEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const inputRefs = useRef<Partial<Record<FileSlot, HTMLInputElement | null>>>({});

  useEffect(() => {
    if (stores.length && !storeId) {
      setStoreId(String(stores[0]!.id));
    }
  }, [stores, storeId]);

  const loadEligibility = useCallback(async () => {
    if (!companyId || !storeId) {
      setEligibility(null);
      return;
    }
    setEligibilityLoading(true);
    try {
      const { data } = await api.get<StoreEligibility>(
        `/api/admin/businesses/${companyId}/stores/${storeId}/demo-import-eligibility`
      );
      setEligibility(data);
    } catch {
      setEligibility(null);
    } finally {
      setEligibilityLoading(false);
    }
  }, [companyId, storeId]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  const isDemo = signupMethod === 'demo_business';
  const hasProducts = Boolean(files.products);
  const canImport = eligibility?.can_import ?? false;

  const setFile = (slot: FileSlot, file: File | undefined) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[slot] = file;
      else delete next[slot];
      return next;
    });
    setBanner(null);
  };

  const importDemo = useCallback(async () => {
    if (!companyId || !storeId || !files.products) {
      setBanner({ type: 'err', text: 'Select products.csv (required) before importing.' });
      return;
    }
    if (!canImport) {
      setBanner({
        type: 'err',
        text: `This store already has ${eligibility?.product_count ?? '?'} product(s) and ${eligibility?.sale_count ?? '?'} sale(s). Use an empty store.`,
      });
      return;
    }

    setLoading(true);
    setBanner(null);
    const form = new FormData();
    form.append('products', files.products);
    if (files.customers) form.append('customers', files.customers);
    if (files.restock) form.append('restock', files.restock);
    if (files.sales) form.append('sales', files.sales);
    if (files.expenses) form.append('expenses', files.expenses);

    try {
      const { data } = await api.post<DemoImportResponse>(
        `/api/admin/businesses/${companyId}/stores/${storeId}/demo-data/import`,
        form
      );
      setBanner({
        type: 'ok',
        text: `Imported: ${data.products?.created_count ?? 0} products, ${data.customers} customers, ${data.restock_events} restocks, ${data.sales} sales, ${data.expenses} expenses. Refresh the page for updated counts.`,
      });
      setFiles({});
      Object.values(inputRefs.current).forEach((el) => {
        if (el) el.value = '';
      });
      await loadEligibility();
    } catch (e: unknown) {
      setBanner({
        type: 'err',
        text: formatApiError(e, 'Import failed. Check CSV format and stock levels.'),
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, storeId, files, canImport, eligibility, loadEligibility]);

  const disabledReason = (() => {
    if (loading) return null;
    if (!storeId) return 'Select a store.';
    if (eligibilityLoading) return 'Checking store…';
    if (!hasProducts) return 'Select products.csv (required).';
    if (!canImport && eligibility) {
      return `This store has ${eligibility.product_count} product(s) and ${eligibility.sale_count} sale(s). Pick an empty store or create a new one.`;
    }
    return null;
  })();

  const buttonDisabled =
    loading || !storeId || eligibilityLoading || !hasProducts || !canImport;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Import demo data (CSV)</h2>
      <p>
        Load a full demo for <strong>any business type</strong> using the same CSV layout each time.
        Change only your spreadsheet content (categories, product names, prices)—not the app.
      </p>
      {!isDemo && (
        <p className="muted">
          Tip: set signup method to <strong>Demo business</strong> on Overview so you can find this account
          later.
        </p>
      )}

      <label style={{ display: 'block', marginBottom: 16 }}>
        Store
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          style={{ display: 'block', marginTop: 4, minWidth: 280 }}
        >
          {stores.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name} (id {s.id})
            </option>
          ))}
        </select>
      </label>

      {eligibility && !eligibility.can_import && (
        <p className="error" style={{ marginBottom: 12 }}>
          Selected store is not empty: {eligibility.product_count} product(s), {eligibility.sale_count}{' '}
          sale(s). Demo import only works on a store with zero products and zero sales.
        </p>
      )}
      {eligibility?.can_import && (
        <p className="success" style={{ marginBottom: 12 }}>
          Selected store is empty — ready to import.
        </p>
      )}

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        {SLOTS.map(({ key, label, required, template }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: required && !files[key] ? '1px solid rgba(255,180,80,0.35)' : undefined,
            }}
          >
            <span style={{ minWidth: 140 }}>
              {label}
              {required ? ' *' : ''}
            </span>
            <input
              ref={(el) => {
                inputRefs.current[key] = el;
              }}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(key, e.target.files?.[0] ?? undefined)}
            />
            {files[key] && (
              <span className="muted" style={{ fontSize: 13 }}>
                {files[key]!.name}
              </span>
            )}
            <a
              className="btn"
              href={`/demo-csv-templates/${template}`}
              download
              style={{ marginLeft: 'auto', fontSize: 13 }}
            >
              Download template
            </a>
          </div>
        ))}
      </div>

      <details style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer' }}>CSV format reference</summary>
        <ul className="muted" style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>
            <strong>products.csv</strong> — same columns as Bulk products (Name, Category, Qty, Cost Price,
            Selling Price, …). Categories are created from the Category column.
          </li>
          <li>
            <strong>customers.csv</strong> — name, phone, city, address (for credit sales).
          </li>
          <li>
            <strong>restock.csv</strong> — product_name, quantity, cost_price, date, add_as_expense, notes.
          </li>
          <li>
            <strong>sales.csv</strong> — invoice_ref, sale_date, due_date, customer_name, status, product_name,
            qty, unit_price, payment_method, payment_amount.
          </li>
          <li>
            <strong>expenses.csv</strong> — category, expense_type, amount, description, expense_date.
          </li>
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          Example pack: <code>scripts/demo/examples/tech_solar_security/</code>
        </p>
      </details>

      <button
        type="button"
        className="btn primary"
        disabled={buttonDisabled}
        onClick={() => void importDemo()}
      >
        {loading ? 'Importing…' : 'Import demo CSVs'}
      </button>
      {disabledReason && (
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          {disabledReason}
        </p>
      )}

      <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
        <strong>Products only?</strong> Upload just <code>products.csv</code> here, or use the{' '}
        <strong>bulk products</strong> tab with the same file format.
      </p>

      {banner && (
        <p className={banner.type === 'ok' ? 'success' : 'error'} style={{ marginTop: 16 }}>
          {banner.text}
        </p>
      )}
    </div>
  );
}
