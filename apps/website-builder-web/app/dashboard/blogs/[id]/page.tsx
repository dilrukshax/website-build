"use client";

import DOMPurify from "dompurify";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../../lib/api-client";
import { uploadCmsImage } from "../../../../lib/media-upload";
import WordEditorField from "../../../../components/blog/word-editor-field";

interface BlogSEOData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalPath?: string | null;
  robotsIndex?: boolean | null;
  robotsFollow?: boolean | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  twitterCard?: "summary" | "summary_large_image" | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: string | null;
  twitterImageAlt?: string | null;
}

interface BlogDetails {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  featuredImageUrl: string | null;
  seoJsonb: BlogSEOData | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  featuredImageUrl: string;
  isPublished: boolean;
  publishedAt: string;
  seo: BlogSEOData;
}

interface SeoAutoSyncState {
  metaTitle: boolean;
  metaDescription: boolean;
  ogTitle: boolean;
  ogDescription: boolean;
}

const DEFAULT_SEO: BlogSEOData = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalPath: "",
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  ogImageAlt: "",
  twitterCard: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImageUrl: "",
  twitterImageAlt: "",
};

const DEFAULT_SEO_AUTO_SYNC: SeoAutoSyncState = {
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
};

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "mark",
  "span",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "code",
  "hr",
];

const ALLOWED_ATTR = [
  "href",
  "name",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "class",
  "style",
  "data-layout",
  "data-size",
];

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
  });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtmlToPlainText(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSeoDescriptionSeed(contentHtml: string): string {
  const contentText = stripHtmlToPlainText(contentHtml);
  return contentText.slice(0, 100).trim();
}

function isBlankText(value: string | null | undefined): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function toDatetimeLocalInput(isoValue: string | null): string {
  if (!isoValue) return "";
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toNullableText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableAbsoluteUrl(value: string | null | undefined): string | null {
  const text = toNullableText(value);
  if (!text) {
    return null;
  }

  const candidate = (() => {
    if (/^https?:\/\//i.test(text)) {
      return text;
    }
    if (text.startsWith("//")) {
      return `https:${text}`;
    }
    if (text.startsWith("/")) {
      if (typeof window !== "undefined" && window.location?.origin) {
        return `${window.location.origin}${text}`;
      }
      return null;
    }
    return `https://${text}`;
  })();

  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildFormSnapshot(form: BlogForm): string {
  return JSON.stringify(form);
}

function normalizeSeoPayload(seo: BlogSEOData, slug: string): BlogSEOData {
  return {
    metaTitle: toNullableText(seo.metaTitle),
    metaDescription: toNullableText(seo.metaDescription),
    metaKeywords: toNullableText(seo.metaKeywords),
    canonicalPath: toNullableText(seo.canonicalPath) || `/blog/${slug}`,
    robotsIndex: typeof seo.robotsIndex === "boolean" ? seo.robotsIndex : null,
    robotsFollow: typeof seo.robotsFollow === "boolean" ? seo.robotsFollow : null,
    ogTitle: toNullableText(seo.ogTitle),
    ogDescription: toNullableText(seo.ogDescription),
    ogImageUrl: toNullableAbsoluteUrl(seo.ogImageUrl),
    ogImageAlt: toNullableText(seo.ogImageAlt),
    twitterCard:
      seo.twitterCard === "summary" || seo.twitterCard === "summary_large_image"
        ? seo.twitterCard
        : null,
    twitterTitle: toNullableText(seo.twitterTitle),
    twitterDescription: toNullableText(seo.twitterDescription),
    twitterImageUrl: toNullableAbsoluteUrl(seo.twitterImageUrl),
    twitterImageAlt: toNullableText(seo.twitterImageAlt),
  };
}

export default function BlogDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const postId = params.id;
  const [blog, setBlog] = useState<BlogDetails | null>(null);
  const [form, setForm] = useState<BlogForm>({
    title: "",
    slug: "",
    excerpt: "",
    contentHtml: "<p></p>",
    featuredImageUrl: "",
    isPublished: false,
    publishedAt: "",
    seo: { ...DEFAULT_SEO },
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [seoAutoSyncEnabled, setSeoAutoSyncEnabled] = useState(true);
  const [seoAutoSyncState, setSeoAutoSyncState] = useState<SeoAutoSyncState>({ ...DEFAULT_SEO_AUTO_SYNC });
  const [autoSaveRevision, setAutoSaveRevision] = useState(0);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);
  const lastAutoSaveAttemptRevisionRef = useRef(0);
  const currentFormSnapshot = useMemo(() => buildFormSnapshot(form), [form]);
  const hasUnsavedChanges = savedSnapshot.length > 0 && currentFormSnapshot !== savedSnapshot;
  const isAutoSaving = autoSaveState === "saving";

  function markUserEdit() {
    setAutoSaveRevision((current) => current + 1);
    setAutoSaveState((current) => (current === "error" ? "idle" : current));
  }

  function updateFormFromUser(updater: (current: BlogForm) => BlogForm) {
    setForm((current) => updater(current));
    markUserEdit();
  }

  function applySeoAutoSync(current: BlogForm, input: { title?: string; contentHtml?: string }): BlogForm {
    if (!seoAutoSyncEnabled) {
      return current;
    }

    const nextSeo: BlogSEOData = { ...current.seo };

    if (typeof input.title === "string") {
      const seoTitle = input.title.trim();
      if (seoAutoSyncState.metaTitle) {
        nextSeo.metaTitle = seoTitle;
      }
      if (seoAutoSyncState.ogTitle) {
        nextSeo.ogTitle = seoTitle;
      }
    }

    if (typeof input.contentHtml === "string") {
      const seoDescription = buildSeoDescriptionSeed(input.contentHtml);
      if (seoAutoSyncState.metaDescription) {
        nextSeo.metaDescription = seoDescription;
      }
      if (seoAutoSyncState.ogDescription) {
        nextSeo.ogDescription = seoDescription;
      }
    }

    return {
      ...current,
      seo: nextSeo,
    };
  }

  function applyInitialSeoSeed(current: BlogForm): BlogForm {
    const seoTitle = current.title.trim();
    const seoDescription = buildSeoDescriptionSeed(current.contentHtml);

    return {
      ...current,
      seo: {
        ...current.seo,
        metaTitle: isBlankText(current.seo.metaTitle) ? seoTitle : current.seo.metaTitle,
        metaDescription: isBlankText(current.seo.metaDescription) ? seoDescription : current.seo.metaDescription,
        ogTitle: isBlankText(current.seo.ogTitle) ? seoTitle : current.seo.ogTitle,
        ogDescription: isBlankText(current.seo.ogDescription) ? seoDescription : current.seo.ogDescription,
      },
    };
  }

  useEffect(() => {
    void loadBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function loadBlog() {
    setIsLoading(true);
    setError(null);

    const res = await api.get<BlogDetails>(`/cms/blogs/${postId}`);
    if (!res.success || !res.data) {
      setError(res.error?.message || "Failed to load blog details.");
      setIsLoading(false);
      return;
    }

    setBlog(res.data);
    setSlugTouched(false);
    const nextForm: BlogForm = {
      title: res.data.title,
      slug: res.data.slug,
      excerpt: res.data.excerpt || "",
      contentHtml: res.data.contentHtml || "<p></p>",
      featuredImageUrl: res.data.featuredImageUrl || "",
      isPublished: res.data.isPublished,
      publishedAt: toDatetimeLocalInput(res.data.publishedAt),
      seo: {
        ...DEFAULT_SEO,
        ...(res.data.seoJsonb || {}),
      },
    };
    const initialSeededForm = applyInitialSeoSeed(nextForm);
    setForm(initialSeededForm);
    setSavedSnapshot(buildFormSnapshot(initialSeededForm));
    setLastSavedAt(res.data.updatedAt || new Date().toISOString());
    setAutoSaveRevision(0);
    lastAutoSaveAttemptRevisionRef.current = 0;
    setSeoAutoSyncEnabled(true);
    setSeoAutoSyncState({ ...DEFAULT_SEO_AUTO_SYNC });
    setAutoSaveState("saved");

    setIsLoading(false);
  }

  function buildValidationErrorMessage(input: { error?: { message?: string; details?: Array<{ field?: string; message?: string }> } }, fallback: string): string {
    const firstDetail = input.error?.details?.[0];
    if (firstDetail?.message) {
      const fieldPrefix = firstDetail.field ? `${firstDetail.field}: ` : "";
      return `Validation failed. ${fieldPrefix}${firstDetail.message}`;
    }
    return input.error?.message || fallback;
  }

  async function persistSave(mode: "manual" | "auto"): Promise<boolean> {
    if (!blog) return false;
    if (saveInFlightRef.current) return false;
    if (isUploadingInlineImage || isUploadingFeaturedImage || isUploadingOgImage) return false;

    const draftForm = form;
    const draftSnapshot = buildFormSnapshot(draftForm);
    const title = draftForm.title.trim();
    if (!title) {
      if (mode === "manual") {
        setError("Title is required.");
      }
      return false;
    }

    const slug = slugify(draftForm.slug || title);
    if (!slug) {
      if (mode === "manual") {
        setError("A valid slug is required.");
      }
      return false;
    }

    const contentHtml = sanitizeHtml(draftForm.contentHtml);
    if (!contentHtml) {
      if (mode === "manual") {
        setError("Blog content cannot be empty.");
      }
      return false;
    }

    const publishedAtIso = draftForm.publishedAt
      ? new Date(draftForm.publishedAt).toISOString()
      : (draftForm.isPublished ? new Date().toISOString() : null);

    const normalizedPublishedAtInput = draftForm.isPublished && publishedAtIso
      ? toDatetimeLocalInput(publishedAtIso)
      : "";

    const normalizedFeaturedImageUrl = toNullableAbsoluteUrl(draftForm.featuredImageUrl);
    const normalizedSeoPayload = normalizeSeoPayload(draftForm.seo, slug);

    const normalizedDraftForm: BlogForm = {
      ...draftForm,
      title,
      slug,
      contentHtml,
      featuredImageUrl: normalizedFeaturedImageUrl || "",
      publishedAt: normalizedPublishedAtInput,
      seo: {
        ...DEFAULT_SEO,
        ...normalizedSeoPayload,
      },
    };

    const payload = {
      title,
      slug,
      excerpt: draftForm.excerpt.trim() || null,
      contentHtml,
      featuredImageUrl: normalizedFeaturedImageUrl,
      isPublished: draftForm.isPublished,
      publishedAt: draftForm.isPublished ? publishedAtIso : null,
      seoJsonb: normalizedSeoPayload,
    };

    saveInFlightRef.current = true;
    if (mode === "manual") {
      setIsSaving(true);
      setError(null);
    } else {
      setAutoSaveState("saving");
    }

    try {
      const res = await api.put<BlogDetails>(`/cms/blogs/${blog.id}`, payload);
      if (!res.success || !res.data) {
        const message = buildValidationErrorMessage({ error: res.error }, "Failed to save blog changes.");
        if (mode === "manual") {
          setError(message);
        } else {
          setAutoSaveState("error");
        }
        return false;
      }

      setBlog(res.data);
      setSavedSnapshot(buildFormSnapshot(normalizedDraftForm));
      setLastSavedAt(res.data.updatedAt || new Date().toISOString());
      setAutoSaveState("saved");

      setForm((current) => {
        if (buildFormSnapshot(current) !== draftSnapshot) {
          return current;
        }
        return normalizedDraftForm;
      });

      return true;
    } finally {
      saveInFlightRef.current = false;
      if (mode === "manual") {
        setIsSaving(false);
      }
    }
  }

  async function handleSave() {
    await persistSave("manual");
  }

  async function handleTogglePublish() {
    if (!blog) return;
    if (saveInFlightRef.current) return;
    const nextPublished = !form.isPublished;
    setIsSaving(true);
    setError(null);

    const res = await api.put<BlogDetails>(`/cms/blogs/${blog.id}`, {
      isPublished: nextPublished,
      publishedAt: nextPublished ? new Date().toISOString() : null,
    });

    if (!res.success) {
      setError(res.error?.message || "Failed to update publish status.");
      setIsSaving(false);
      return;
    }

    await loadBlog();
    setIsSaving(false);
  }

  async function uploadInlineImage(file: File): Promise<string> {
    return uploadCmsImage(file);
  }

  async function handleFeaturedImageFileChange(file: File | null) {
    if (!file) return;

    setIsUploadingFeaturedImage(true);
    setError(null);

    try {
      const publicUrl = await uploadCmsImage(file);
      updateFormFromUser((current) => ({ ...current, featuredImageUrl: publicUrl }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setError(message);
    } finally {
      setIsUploadingFeaturedImage(false);
    }
  }

  async function handleOgImageFileChange(file: File | null) {
    if (!file) return;

    setIsUploadingOgImage(true);
    setError(null);

    try {
      const publicUrl = await uploadCmsImage(file);
      updateFormFromUser((current) => ({
        ...current,
        seo: {
          ...current.seo,
          ogImageUrl: publicUrl,
          ogImageAlt: (current.seo.ogImageAlt || "").trim() ? current.seo.ogImageAlt : current.title || current.seo.ogImageAlt,
        },
      }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setError(message);
    } finally {
      setIsUploadingOgImage(false);
    }
  }

  function handleAutoFillSeo() {
    setSeoAutoSyncEnabled(true);
    setSeoAutoSyncState({ ...DEFAULT_SEO_AUTO_SYNC });
    updateFormFromUser((current) => {
      const seoTitle = current.title.trim();
      const seoDescription = buildSeoDescriptionSeed(current.contentHtml);
      return {
        ...current,
        seo: {
          ...current.seo,
          metaTitle: seoTitle,
          metaDescription: seoDescription,
          ogTitle: seoTitle,
          ogDescription: seoDescription,
          ogImageUrl: (current.seo.ogImageUrl || "").trim() || current.featuredImageUrl || current.seo.ogImageUrl,
        },
      };
    });
  }

  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isLoading || isSaving || isAutoSaving) {
      return;
    }
    if (isUploadingInlineImage || isUploadingFeaturedImage || isUploadingOgImage) {
      return;
    }
    if (autoSaveRevision <= lastAutoSaveAttemptRevisionRef.current) {
      return;
    }

    const revisionToSave = autoSaveRevision;

    const timerId = window.setTimeout(() => {
      lastAutoSaveAttemptRevisionRef.current = revisionToSave;
      void persistSave("auto");
    }, 5000);

    return () => window.clearTimeout(timerId);
  }, [
    autoSaveEnabled,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    isAutoSaving,
    isUploadingInlineImage,
    isUploadingFeaturedImage,
    isUploadingOgImage,
    autoSaveRevision,
  ]);

  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : null;

  const saveStatusTone = (() => {
    if (isSaving || isAutoSaving) {
      return { dot: "bg-red-500", text: "text-red-700", label: "Saving..." };
    }
    if (autoSaveState === "error") {
      return { dot: "bg-red-500", text: "text-red-700", label: "Auto-save failed" };
    }
    if (hasUnsavedChanges) {
      return { dot: "bg-amber-500", text: "text-amber-700", label: "Unsaved changes" };
    }
    if (lastSavedLabel) {
      return { dot: "bg-emerald-500", text: "text-emerald-700", label: `Saved at ${lastSavedLabel}` };
    }
    return { dot: "bg-slate-400", text: "text-slate-600", label: "No changes yet" };
  })();
  const ogImagePreviewUrl = toNullableAbsoluteUrl(form.seo.ogImageUrl);

  if (isLoading) {
    return <div className="legacy-theme p-6 text-gray-500">Loading blog details...</div>;
  }

  if (error && !blog) {
    return (
      <div className="legacy-theme space-y-4">
        <Link
          href="/dashboard/blogs"
          className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
        >
          ← Back to blogs
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!blog) {
    return <div className="legacy-theme p-6 text-gray-500">Blog post not found.</div>;
  }

  return (
    <div className="legacy-theme w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/blogs"
            onClick={(event) => {
              if (!hasUnsavedChanges) {
                return;
              }

              const shouldLeave = window.confirm("You have unsaved changes. Leave this page anyway?");
              if (!shouldLeave) {
                event.preventDefault();
              }
            }}
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title || "Untitled Post"}</h1>
            <p className="mt-1 text-sm text-gray-500">Post ID: {blog.id.slice(0, 8)}</p>
          </div>
        </div>

        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
          form.isPublished
            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
            : "border-gray-200 bg-gray-100 text-gray-700"
        }`}>
          {form.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Blog Content</h2>

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
                    updateFormFromUser((current) => {
                      const nextForm: BlogForm = {
                        ...current,
                        title: nextTitle,
                        slug: slugTouched ? current.slug : slugify(nextTitle),
                      };
                      return applySeoAutoSync(nextForm, { title: nextTitle });
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
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
                    updateFormFromUser((current) => ({ ...current, slug: slugify(e.target.value) }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <p className="mt-1 text-xs text-gray-500">Public URL: /blog/{form.slug || "your-slug"}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Excerpt</label>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, excerpt: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Summary text for blog cards..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Featured Image</label>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {form.featuredImageUrl ? (
                    <img src={toNullableAbsoluteUrl(form.featuredImageUrl) || form.featuredImageUrl} alt={form.title || "Featured image preview"} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 ${isUploadingFeaturedImage ? "pointer-events-none opacity-60" : ""}`}>
                    {isUploadingFeaturedImage ? "Uploading..." : "Upload Featured Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleFeaturedImageFileChange(file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {form.featuredImageUrl && (
                    <button
                      type="button"
                      onClick={() => updateFormFromUser((current) => ({ ...current, featuredImageUrl: "" }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">Body Content</p>
                  <p className="text-xs text-gray-500">
                    Word-style rich text editor with drag-and-drop image support
                  </p>
                </div>
                <WordEditorField
                  value={form.contentHtml}
                  onChange={(nextValue) => {
                    updateFormFromUser((current) => {
                      const nextForm: BlogForm = {
                        ...current,
                        contentHtml: nextValue,
                      };
                      return applySeoAutoSync(nextForm, { contentHtml: nextValue });
                    });
                  }}
                  placeholder="Start writing your blog content..."
                  onImageUpload={uploadInlineImage}
                  onUploadStateChange={setIsUploadingInlineImage}
                  onUploadError={(message) => {
                    setError(message || null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Publish</h2>
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Preview pages show published content only. Save changes and publish to see newly added images there.
            </p>
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, isPublished: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Published
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Publish Time</label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, publishedAt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className={`flex items-center gap-2 text-xs font-medium ${saveStatusTone.text}`}>
                  <span className={`h-2 w-2 rounded-full ${saveStatusTone.dot}`} />
                  <span>{saveStatusTone.label}</span>
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(event) => setAutoSaveEnabled(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  Auto-save 5 seconds after new changes
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isAutoSaving || isUploadingInlineImage || isUploadingFeaturedImage || isUploadingOgImage}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes (Manual)"}
              </button>
              <button
                type="button"
                onClick={() => void handleTogglePublish()}
                disabled={isSaving || isAutoSaving}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                  form.isPublished ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {form.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void loadBlog()}
                disabled={isSaving || isAutoSaving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">SEO</h2>
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50/70 p-3">
              <p className="text-xs text-red-800">
                On page open, empty Meta/OG title + description fields are auto-filled from blog title and the first 100 characters of content body text.
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-red-800">
                <input
                  type="checkbox"
                  checked={seoAutoSyncEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setSeoAutoSyncEnabled(enabled);
                    if (enabled) {
                      setSeoAutoSyncState({ ...DEFAULT_SEO_AUTO_SYNC });
                    }
                  }}
                  className="h-3.5 w-3.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                Auto-sync Meta/OG title + description while editing title/body
              </label>
              <p className="mt-1 text-[11px] text-red-700">
                Manual typing in Meta/OG title or description pauses sync for that field. Click Auto Fill SEO to re-enable.
              </p>
              <button
                type="button"
                onClick={handleAutoFillSeo}
                className="mt-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Auto Fill SEO
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Title</label>
                <input
                  type="text"
                  value={form.seo.metaTitle || ""}
                  onChange={(e) => {
                    setSeoAutoSyncState((current) => ({ ...current, metaTitle: false }));
                    updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, metaTitle: e.target.value } }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  rows={3}
                  value={form.seo.metaDescription || ""}
                  onChange={(e) => {
                    setSeoAutoSyncState((current) => ({ ...current, metaDescription: false }));
                    updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, metaDescription: e.target.value } }));
                  }}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Keywords</label>
                <input
                  type="text"
                  value={form.seo.metaKeywords || ""}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, metaKeywords: e.target.value } }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="keyword1, keyword2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Canonical Path</label>
                <input
                  type="text"
                  value={form.seo.canonicalPath || ""}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, canonicalPath: e.target.value } }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder={`/blog/${form.slug || "your-slug"}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">OG Title</label>
                <input
                  type="text"
                  value={form.seo.ogTitle || ""}
                  onChange={(e) => {
                    setSeoAutoSyncState((current) => ({ ...current, ogTitle: false }));
                    updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, ogTitle: e.target.value } }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">OG Description</label>
                <textarea
                  rows={2}
                  value={form.seo.ogDescription || ""}
                  onChange={(e) => {
                    setSeoAutoSyncState((current) => ({ ...current, ogDescription: false }));
                    updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, ogDescription: e.target.value } }));
                  }}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">OG Image URL</label>
                <input
                  type="url"
                  value={form.seo.ogImageUrl || ""}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, ogImageUrl: e.target.value } }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                {ogImagePreviewUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={ogImagePreviewUrl} alt={form.seo.ogImageAlt || "OG image preview"} className="h-32 w-full object-cover" />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 ${isUploadingOgImage ? "pointer-events-none opacity-60" : ""}`}>
                    {isUploadingOgImage ? "Uploading..." : "Upload OG Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleOgImageFileChange(file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {form.featuredImageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        updateFormFromUser((current) => ({
                          ...current,
                          seo: {
                            ...current.seo,
                            ogImageUrl: current.featuredImageUrl,
                          },
                        }))
                      }
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Use Featured Image
                    </button>
                  )}
                  {form.seo.ogImageUrl && (
                    <button
                      type="button"
                      onClick={() => updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, ogImageUrl: "" } }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">OG Image Alt</label>
                <input
                  type="text"
                  value={form.seo.ogImageAlt || ""}
                  onChange={(e) => updateFormFromUser((current) => ({ ...current, seo: { ...current.seo, ogImageAlt: e.target.value } }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{new Date(blog.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-1 text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">{new Date(blog.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-1 text-gray-500">Post ID</p>
                <p className="break-all font-mono text-gray-900">{blog.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
