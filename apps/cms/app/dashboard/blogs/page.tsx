"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api-client";
import { uploadCmsImage } from "../../../lib/media-upload";
import { useAuth } from "../../../contexts/auth-context";

interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl: string;
  isPublished: boolean;
}

const EMPTY_FORM: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  featuredImageUrl: "",
  isPublished: false,
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogsPage() {
  const router = useRouter();
  const { currentInstance } = useAuth();
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [previewTarget, setPreviewTarget] = useState<BlogSummary | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewFrameLoading, setIsPreviewFrameLoading] = useState(true);
  const [isPreviewFrameError, setIsPreviewFrameError] = useState(false);

  useEffect(() => {
    void loadBlogs();
  }, []);

  async function loadBlogs() {
    setIsLoading(true);
    const res = await api.get<BlogSummary[]>("/cms/blogs");
    if (res.success && res.data) {
      setBlogs(Array.isArray(res.data) ? res.data : []);
    }
    setIsLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setError(null);
    setShowForm(true);
  }

  async function handleImageFileChange(file: File | null) {
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const publicUrl = await uploadCmsImage(file);
      setForm((current) => ({ ...current, featuredImageUrl: publicUrl }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const slug = slugify(form.slug || form.title);
    if (!slug) {
      setError("A valid slug is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      featuredImageUrl: form.featuredImageUrl || null,
      contentHtml: "<p></p>",
      isPublished: form.isPublished,
      seoJsonb: null,
    };

    const res = await api.post<BlogSummary>("/cms/blogs", payload);
    if (!res.success || !res.data) {
      setError(res.error?.message || "Failed to create blog post.");
      setIsSaving(false);
      return;
    }

    setShowForm(false);
    setIsSaving(false);
    await loadBlogs();
    router.push(`/dashboard/blogs/${res.data.id}`);
  }

  async function handleUnpublish(blogId: string) {
    if (!confirm("Unpublish this blog post?")) return;
    const res = await api.del(`/cms/blogs/${blogId}`);
    if (res.success) {
      await loadBlogs();
    } else {
      alert(res.error?.message || "Failed to unpublish blog post.");
    }
  }

  async function handleTogglePublish(blog: BlogSummary) {
    const nextPublished = !blog.isPublished;
    const res = await api.put(`/cms/blogs/${blog.id}`, {
      isPublished: nextPublished,
      publishedAt: nextPublished ? new Date().toISOString() : null,
    });

    if (res.success) {
      await loadBlogs();
    } else {
      alert(res.error?.message || "Failed to update publish status.");
    }
  }

  const filteredBlogs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return blogs;
    return blogs.filter((blog) =>
      blog.title.toLowerCase().includes(term)
      || blog.slug.toLowerCase().includes(term)
      || (blog.excerpt || "").toLowerCase().includes(term),
    );
  }, [blogs, query]);

  const currentSubdomain = currentInstance?.subdomain?.trim().toLowerCase() || "";
  const canResolvePreviewHost = currentSubdomain.length > 0;
  const previewUrl = previewTarget && canResolvePreviewHost
    ? `/preview/${encodeURIComponent(currentSubdomain)}/blog/${encodeURIComponent(previewTarget.slug)}`
    : null;

  function openPreview(blog: BlogSummary) {
    setPreviewTarget(blog);
    setPreviewMode("desktop");
    setIsPreviewFrameLoading(true);
    setIsPreviewFrameError(false);
  }

  function closePreview() {
    setPreviewTarget(null);
  }

  if (isLoading) {
    return <div className="legacy-theme p-6 text-gray-500">Loading blog posts...</div>;
  }

  return (
    <div className="legacy-theme w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage blog posts for your public website.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Add Blog
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Search by title, slug, or excerpt..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Post</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Published</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBlogs.map((blog) => (
              <tr key={blog.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-20 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                      {blog.featuredImageUrl ? (
                        <img src={blog.featuredImageUrl} alt={blog.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{blog.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{blog.excerpt || "No excerpt"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">/blog/{blog.slug}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    blog.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                  }`}>
                    {blog.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {blog.publishedAt ? new Date(blog.publishedAt).toLocaleString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {canResolvePreviewHost && blog.isPublished ? (
                      <button
                        type="button"
                        onClick={() => openPreview(blog)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        title="Open preview in popup"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={
                          !canResolvePreviewHost
                            ? "Select an active website instance to use preview."
                            : "Publish this post first to preview it."
                        }
                        className="cursor-not-allowed rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-300"
                      >
                        Preview
                      </button>
                    )}
                    <Link
                      href={`/dashboard/blogs/${blog.id}`}
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleTogglePublish(blog)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium text-white ${
                        blog.isPublished ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {blog.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUnpublish(blog.id)}
                      className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBlogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No blog posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewTarget && previewUrl && (
        <div
          className="fixed inset-0 z-[1200] bg-slate-950/70"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreview();
            }
          }}
        >
          <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Blog Preview</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {previewTarget.title} · /blog/{previewTarget.slug}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-md p-1 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close blog preview"
              >
                &times;
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-6xl space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Interactive Preview
                    </p>
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("desktop")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          previewMode === "desktop"
                            ? "bg-[#5048e5] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Web
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("mobile")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          previewMode === "mobile"
                            ? "bg-[#5048e5] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>

                  <div className={`relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${previewMode === "mobile" ? "max-w-[430px]" : ""}`}>
                    <div className="relative h-[72vh] min-h-[360px] w-full sm:min-h-[420px]">
                      {!isPreviewFrameError && (
                        <iframe
                          key={previewUrl}
                          src={previewUrl}
                          className="absolute inset-0 h-full w-full border-0 bg-white"
                          onLoad={() => setIsPreviewFrameLoading(false)}
                          onError={() => {
                            setIsPreviewFrameLoading(false);
                            setIsPreviewFrameError(true);
                          }}
                          title={`${previewTarget.title} preview`}
                        />
                      )}

                      {isPreviewFrameError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white px-4 text-center">
                          <p className="text-sm font-medium text-slate-700">Preview is temporarily unavailable.</p>
                          <p className="text-xs text-slate-500">Try again after publishing or refreshing the page.</p>
                        </div>
                      )}

                      {isPreviewFrameLoading && !isPreviewFrameError && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#5048e5]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Scroll inside the preview to inspect the full blog post.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Create Blog Post</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setForm((current) => ({
                      ...current,
                      title: nextTitle,
                      slug: slugTouched ? current.slug : slugify(nextTitle),
                    }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. How to Prepare for Your First Visit"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((current) => ({ ...current, slug: slugify(e.target.value) }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="how-to-prepare-for-your-first-visit"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Excerpt</label>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm((current) => ({ ...current, excerpt: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Short summary shown in cards..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Featured Image</label>
                {form.featuredImageUrl && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={form.featuredImageUrl} alt="Blog cover preview" className="h-32 w-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 ${isUploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleImageFileChange(file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {form.featuredImageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, featuredImageUrl: "" }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((current) => ({ ...current, isPublished: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Publish immediately
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isSaving || isUploadingImage}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Creating..." : "Create & Edit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
