import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import {
  buildBulkSubmitPackage,
  createEmptyRow,
  matchCategoryFromList,
  parseBulkUploadFile,
  parsePositionalPasteText,
  rowQualifiesForBulkSubmit,
  type BulkProductRow,
  type StoreCategoryLite,
} from '../lib/bulkProductImport';

type StoreOption = { id: number; name: string };

type BulkOnboardResponse = {
  total_rows: number;
  created_count: number;
  failed_count: number;
  results: { row_index: number; status: string; name?: string | null; error?: string; product_id?: number }[];
};

type Props = {
  companyId: string;
  stores: StoreOption[];
};

export function BusinessBulkProductsPanel({ companyId, stores }: Props) {
  const [storeId, setStoreId] = useState<string>(() => (stores[0] ? String(stores[0].id) : ''));
  const [categories, setCategories] = useState<StoreCategoryLite[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [rows, setRows] = useState<BulkProductRow[]>(() => Array.from({ length: 8 }, createEmptyRow));
  const [pasteText, setPasteText] = useState('');
  const [fileParsing, setFileParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stores.length && !storeId) {
      setStoreId(String(stores[0]!.id));
    }
  }, [stores, storeId]);

  const loadCategories = useCallback(async () => {
    if (!companyId || !storeId) {
      setCategories([]);
      return;
    }
    setCatLoading(true);
    try {
      const { data } = await api.get<StoreCategoryLite[]>(
        `/api/admin/businesses/${companyId}/stores/${storeId}/categories`
      );
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, [companyId, storeId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resolvePendingCategoriesOnRows = useCallback(
    async (currentRows: BulkProductRow[]): Promise<BulkProductRow[]> => {
      const sid = Number(storeId);
      if (!sid) return currentRows;

      const uniquePending = [
        ...new Set(
          currentRows
            .filter((r) => r.pending_category_name?.trim() && !r.category_id)
            .map((r) => r.pending_category_name.trim())
        ),
      ];
      if (!uniquePending.length) return currentRows;

      let working = [...categories];
      const idByName: Record<string, number> = {};
      const needsCreate: string[] = [];

      for (const name of uniquePending) {
        const existing = matchCategoryFromList(name, working);
        if (existing) idByName[name] = existing.id;
        else needsCreate.push(name);
      }
      needsCreate.sort((a, b) => b.length - a.length);

      for (const name of needsCreate) {
        const retryMatch = matchCategoryFromList(name, working);
        if (retryMatch) {
          idByName[name] = retryMatch.id;
          continue;
        }
        try {
          const { data } = await api.post<StoreCategoryLite>(
            `/api/admin/businesses/${companyId}/stores/${sid}/categories`,
            { name, publish: 'publish' }
          );
          idByName[name] = data.id;
          working = [...working, data];
        } catch {
          /* category stays pending */
        }
      }
      setCategories(working);

      return currentRows.map((r) => {
        const pending = r.pending_category_name?.trim();
        if (!pending || r.category_id) return r;
        const id = idByName[pending];
        if (!id) return r;
        return { ...r, category_id: id, pending_category_name: '' };
      });
    },
    [categories, companyId, storeId]
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !storeId) return;
    setFileParsing(true);
    setBanner(null);
    try {
      const parsed = await parseBulkUploadFile(file, categories);
      if (!parsed.length) {
        setBanner({
          type: 'err',
          text: 'No product rows found. Use a header row (Name, Category, Qty, Selling price, …) or the same column order as spreadsheet paste.',
        });
        return;
      }
      const merged = [...rows.filter((r) => r.name || r.price), ...parsed];
      const resolved = await resolvePendingCategoriesOnRows(merged);
      setRows(resolved.length ? resolved : Array.from({ length: 8 }, createEmptyRow));
      setRowErrors({});
      setBanner({ type: 'ok', text: `Loaded ${parsed.length} row(s) from "${file.name}".` });
    } catch {
      setBanner({ type: 'err', text: 'Could not read that file. Try .csv or .xlsx.' });
    } finally {
      setFileParsing(false);
    }
  };

  const handlePaste = async () => {
    if (!pasteText.trim() || !storeId) return;
    const parsed = parsePositionalPasteText(pasteText, categories);
    if (!parsed.length) {
      setBanner({ type: 'err', text: 'No valid rows in paste. Check column order (Name, Category, Qty, …).' });
      return;
    }
    const merged = [...rows.filter((r) => r.name || r.price), ...parsed];
    const resolved = await resolvePendingCategoriesOnRows(merged);
    setRows(resolved);
    setPasteText('');
    setRowErrors({});
    setBanner({ type: 'ok', text: `Imported ${parsed.length} row(s) from paste.` });
  };

  const updateRow = (key: string, patch: Partial<BulkProductRow>) => {
    setRowErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const submit = async () => {
    const sid = Number(storeId);
    if (!sid) {
      setBanner({ type: 'err', text: 'Select a store first.' });
      return;
    }
    setSubmitting(true);
    setBanner(null);
    setRowErrors({});
    try {
      const resolved = await resolvePendingCategoriesOnRows(rows);
      setRows(resolved);
      const { apiRows, sourceRowKeys } = buildBulkSubmitPackage(resolved);
      if (!apiRows.length) {
        setBanner({ type: 'err', text: 'Add at least one valid row (name + selling price ≥ 1, or variable price range).' });
        return;
      }
      const { data } = await api.post<BulkOnboardResponse>(
        `/api/admin/businesses/${companyId}/stores/${sid}/products/bulk-onboard`,
        { rows: apiRows }
      );
      const failed = (data.results || []).filter((item) => item.status === 'failed');
      const createdCount = Number(data.created_count) || 0;
      const failedIndexSet = new Set(failed.map((item) => Number(item.row_index)));
      const failedKeys = new Set(
        [...failedIndexSet].map((i) => sourceRowKeys[i]).filter((k): k is string => k != null)
      );
      const nextErr: Record<string, string> = {};
      failed.forEach((item) => {
        const i = Number(item.row_index);
        const k = sourceRowKeys[i];
        if (k != null && item.error) nextErr[k] = String(item.error);
      });
      setRowErrors(nextErr);
      setRows((prev) => {
        const submittedSet = new Set(sourceRowKeys);
        const next = prev.filter((row) => {
          if (!submittedSet.has(row.key)) return true;
          return failedKeys.has(row.key);
        });
        if (next.length === 0) return Array.from({ length: 8 }, createEmptyRow);
        return next;
      });
      if (failed.length && createdCount) {
        setBanner({
          type: 'ok',
          text: `Created ${createdCount} product(s). ${failed.length} row(s) failed — see errors in the table.`,
        });
      } else if (failed.length && !createdCount) {
        setBanner({ type: 'err', text: 'Nothing was saved. Fix the errors shown on each row.' });
      } else {
        setRowErrors({});
        setBanner({ type: 'ok', text: `Created ${createdCount} product(s).` });
      }
      void loadCategories();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setBanner({ type: 'err', text: ax.response?.data?.detail || 'Bulk upload failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!stores.length) {
    return <p className="muted">This business has no stores yet.</p>;
  }

  const readyCount = rows.filter((r) => rowQualifiesForBulkSubmit(r)).length;

  return (
    <div>
      <p className="muted" style={{ marginBottom: 16 }}>
        Upload a CSV or Excel file (first sheet), or paste spreadsheet rows. New category names in the file
        are created on the selected store when you save. Same column conventions as the merchant POS bulk add
        screen.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <label htmlFor="bulk-store" style={{ display: 'block', marginBottom: 8 }}>
          Store
        </label>
        <select
          id="bulk-store"
          className="search"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          style={{ maxWidth: 400 }}
        >
          {stores.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name} (id {s.id})
            </option>
          ))}
        </select>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          {catLoading ? 'Loading categories…' : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} on this store.`}
        </p>
      </div>

      {banner && <p className={banner.type === 'ok' ? 'success' : 'error'}>{banner.text}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Upload CSV or Excel</h3>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: 'none' }}
          onChange={(ev) => void handleFile(ev)}
        />
        <button
          type="button"
          className="btn primary"
          disabled={!storeId || fileParsing}
          onClick={() => fileRef.current?.click()}
        >
          {fileParsing ? 'Reading…' : 'Choose file'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Paste from spreadsheet</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Tab-separated or CSV lines without headers: Name, Category, Qty, Cost Price, Selling Price, Is Pack,
          Qty per Pack, Cost per Pack.
        </p>
        <textarea
          className="search"
          style={{ width: '100%', maxWidth: '100%', minHeight: 100, fontFamily: 'monospace' }}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste rows here…"
        />
        <button type="button" className="btn primary" disabled={!storeId} onClick={() => void handlePaste()}>
          Import paste
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={addRow}>
          Add row
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!storeId || submitting || readyCount < 1}
          onClick={() => void submit()}
        >
          {submitting ? 'Saving…' : `Save ${readyCount} product(s)`}
        </button>
      </div>

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category id</th>
              <th>Pending cat.</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Tax %</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <input
                    className="search"
                    style={{ width: 140 }}
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  />
                  {rowErrors[row.key] && (
                    <div className="error" style={{ fontSize: 12, marginTop: 4 }}>
                      {rowErrors[row.key]}
                    </div>
                  )}
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 72 }}
                    value={row.category_id != null ? String(row.category_id) : ''}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      updateRow(row.key, {
                        category_id: v === '' ? null : Number(v) || null,
                      });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 120 }}
                    value={row.pending_category_name}
                    onChange={(e) => updateRow(row.key, { pending_category_name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 56 }}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 72 }}
                    value={row.costPrice}
                    onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 72 }}
                    value={row.price}
                    onChange={(e) => updateRow(row.key, { price: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="search"
                    style={{ width: 56 }}
                    value={row.taxes}
                    onChange={(e) => updateRow(row.key, { taxes: e.target.value })}
                  />
                </td>
                <td>
                  <button type="button" className="btn" onClick={() => removeRow(row.key)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
