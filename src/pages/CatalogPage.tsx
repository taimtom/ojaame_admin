import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { api } from '../lib/api';

type CatalogCategory = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
};

type CatalogProduct = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  barcode: string | null;
  default_unit: string | null;
  aliases: string[];
  metadata: Record<string, unknown>;
  default_tax_percent: number;
  category_id: number | null;
  category_name: string | null;
  is_active: boolean;
};

export function CatalogPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [productUnit, setProductUnit] = useState('');
  const [productTax, setProductTax] = useState('0');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productAliases, setProductAliases] = useState('');
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editTax, setEditTax] = useState('0');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAliases, setEditAliases] = useState('');
  const [editActive, setEditActive] = useState(true);
  const editFormRef = useRef<HTMLFormElement | null>(null);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [catRes, productRes] = await Promise.all([
        api.get<CatalogCategory[]>('/api/admin/catalog/categories'),
        api.get<CatalogProduct[]>('/api/admin/catalog/products'),
      ]);
      setCategories(catRes.data);
      setProducts(productRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (editingProduct && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingProduct]);

  async function submitCategory(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/admin/catalog/categories', {
        name: categoryName,
        description: categoryDescription || null,
        image_url: categoryImageUrl || null,
        is_active: true,
      });
      setCategoryName('');
      setCategoryDescription('');
      setCategoryImageUrl('');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create category');
    }
  }

  async function submitProduct(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const aliases = productAliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await api.post('/api/admin/catalog/products', {
        name: productName,
        description: productDescription || null,
        image_url: productImageUrl || null,
        barcode: productBarcode || null,
        default_unit: productUnit || null,
        aliases,
        metadata: {},
        default_tax_percent: Number(productTax || 0),
        category_id: productCategoryId ? Number(productCategoryId) : null,
        is_active: true,
      });

      setProductName('');
      setProductDescription('');
      setProductImageUrl('');
      setProductBarcode('');
      setProductUnit('');
      setProductTax('0');
      setProductCategoryId('');
      setProductAliases('');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create product');
    }
  }

  function startEditProduct(product: CatalogProduct) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description || '');
    setEditImageUrl(product.image_url || '');
    setEditBarcode(product.barcode || '');
    setEditUnit(product.default_unit || '');
    setEditTax(String(product.default_tax_percent ?? 0));
    setEditCategoryId(product.category_id ? String(product.category_id) : '');
    setEditAliases((product.aliases || []).join(', '));
    setEditActive(product.is_active);
  }

  function cancelEditProduct() {
    setEditingProduct(null);
    setEditSaving(false);
    setEditName('');
    setEditDescription('');
    setEditImageUrl('');
    setEditBarcode('');
    setEditUnit('');
    setEditTax('0');
    setEditCategoryId('');
    setEditAliases('');
    setEditActive(true);
  }

  async function submitEditProduct(e: FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    setError('');
    setEditSaving(true);
    try {
      const aliases = editAliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await api.patch(`/api/admin/catalog/products/${editingProduct.id}`, {
        name: editName,
        description: editDescription || null,
        image_url: editImageUrl || null,
        barcode: editBarcode || null,
        default_unit: editUnit || null,
        aliases,
        metadata: editingProduct.metadata ?? {},
        default_tax_percent: Number(editTax || 0),
        category_id: editCategoryId ? Number(editCategoryId) : null,
        is_active: editActive,
      });

      await loadAll();
      cancelEditProduct();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update product');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div>
      <h1>Catalog</h1>
      <p className="muted">Add catalog categories and products for business bulk onboarding.</p>

      {error ? <div className="alert error">{error}</div> : null}

      <form className="card" onSubmit={submitCategory}>
        <h2>Create catalog category</h2>
        <div className="row">
          <input
            placeholder="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
          />
          <input
            placeholder="Image URL"
            value={categoryImageUrl}
            onChange={(e) => setCategoryImageUrl(e.target.value)}
          />
          <button className="btn primary" type="submit">
            Add Category
          </button>
        </div>
      </form>

      <form className="card" onSubmit={submitProduct}>
        <h2>Create catalog product</h2>
        <div className="row">
          <input
            placeholder="Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
          <input
            placeholder="Image URL"
            value={productImageUrl}
            onChange={(e) => setProductImageUrl(e.target.value)}
          />
          <input
            placeholder="Barcode"
            value={productBarcode}
            onChange={(e) => setProductBarcode(e.target.value)}
          />
          <input
            placeholder="Default unit"
            value={productUnit}
            onChange={(e) => setProductUnit(e.target.value)}
          />
          <input
            type="number"
            placeholder="Tax %"
            min={0}
            max={100}
            step="0.01"
            value={productTax}
            onChange={(e) => setProductTax(e.target.value)}
          />
          <select value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Aliases (comma-separated)"
            value={productAliases}
            onChange={(e) => setProductAliases(e.target.value)}
          />
          <button className="btn primary" type="submit">
            Add Product
          </button>
        </div>
      </form>

      {editingProduct ? (
        <form className="card" onSubmit={submitEditProduct} ref={editFormRef}>
          <h2>Edit catalog product: {editingProduct.name}</h2>
          <div className="row">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <input
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <input
              placeholder="Image URL"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />
            <input
              placeholder="Barcode"
              value={editBarcode}
              onChange={(e) => setEditBarcode(e.target.value)}
            />
            <input
              placeholder="Default unit"
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
            />
            <input
              type="number"
              placeholder="Tax %"
              min={0}
              max={100}
              step="0.01"
              value={editTax}
              onChange={(e) => setEditTax(e.target.value)}
            />
            <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Aliases (comma-separated)"
              value={editAliases}
              onChange={(e) => setEditAliases(e.target.value)}
            />
            <label className="inline">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Active
            </label>
            <button className="btn primary" type="submit" disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn ghost" type="button" onClick={cancelEditProduct} disabled={editSaving}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="card">
        <h2>Catalog products {loading ? '(loading...)' : `(${products.length})`}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Image URL</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Tax %</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.image_url || '-'}</td>
                  <td>{p.category_name || '-'}</td>
                  <td>{p.barcode || '-'}</td>
                  <td>{p.default_tax_percent ?? 0}</td>
                  <td>{p.is_active ? 'yes' : 'no'}</td>
                  <td>
                    <button className="btn ghost" type="button" onClick={() => startEditProduct(p)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
