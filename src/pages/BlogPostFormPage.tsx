import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { MobilePageHeader } from '../components/MobilePageHeader';
import { RichTextEditor } from '../components/RichTextEditor';
import type { BlogPostRow } from './BlogPostsPage';

type BlogPostDetail = BlogPostRow & {
  body_html: string;
  cover_image_url: string | null;
  author_name: string;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
};

const BLOG_PREVIEW_BASE =
  import.meta.env.VITE_BLOG_URL || 'https://blogs.ojaa.me';

export function BlogPostFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { admin } = useAdminAuth();

  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  const readOnly = admin?.role === 'billing_readonly';

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get<BlogPostDetail>(`/api/admin/blog/posts/${id}`)
      .then(({ data }) => {
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt);
        setBodyHtml(data.body_html);
        setCoverImageUrl(data.cover_image_url || '');
        setAuthorName(data.author_name);
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setTags((data.tags || []).join(', '));
        setStatus(data.status as 'draft' | 'published' | 'archived');
      })
      .catch(() => setErr('Failed to load post.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) {
      setErr('Title and excerpt are required.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim(),
      body_html: bodyHtml,
      cover_image_url: coverImageUrl.trim() || null,
      author_name: authorName.trim() || undefined,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status,
    };
    try {
      if (isEdit && id) {
        await api.patch(`/api/admin/blog/posts/${id}`, payload);
        navigate('/blog');
      } else {
        const { data } = await api.post<BlogPostDetail>('/api/admin/blog/posts', payload);
        navigate(`/blog/${data.id}/edit`);
      }
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      const d = ax.response?.data?.detail;
      setErr(typeof d === 'string' ? d : 'Failed to save post.');
    } finally {
      setSubmitting(false);
    }
  }

  async function publishNow() {
    if (!id) return;
    setSubmitting(true);
    setErr(null);
    try {
      await api.post(`/api/admin/blog/posts/${id}/publish`);
      setStatus('published');
    } catch {
      setErr('Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  }

  if (readOnly) {
    return (
      <div>
        <p className="error">Your role cannot edit blog posts.</p>
        <Link to="/blog">Back</Link>
      </div>
    );
  }

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  const previewUrl = slug
    ? `${BLOG_PREVIEW_BASE}/blogs/${slug}/`
    : null;

  return (
    <div>
      <MobilePageHeader
        title={isEdit ? 'Edit post' : 'New post'}
        backTo="/blog"
      />
      <form className="card form-card" onSubmit={(e) => void submit(e)}>
        <label>
          Title *
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from title if empty"
          />
        </label>
        <label>
          Excerpt * <span className="muted small">(shown on cards &amp; meta description)</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            required
          />
        </label>
        <label className="rte-field">
          Body
          <RichTextEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder="Write your post…"
            minHeight={320}
          />
        </label>
        <label>
          Cover image URL
          <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
        </label>
        <label>
          Author name
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
        </label>
        <label>
          Tags <span className="muted small">(comma-separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pos, nigeria" />
        </label>
        <label>
          SEO title
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label>
          SEO description
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {previewUrl && (
          <p>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn ghost btn-sm">
              Preview on site
            </a>
          </p>
        )}

        {err && <p className="error">{err}</p>}

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          {isEdit && status !== 'published' && (
            <button
              type="button"
              className="btn ghost"
              disabled={submitting}
              onClick={() => void publishNow()}
            >
              Publish now
            </button>
          )}
          <Link to="/blog" className="btn ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
