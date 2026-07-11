"use client";

import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import {
  Bold,
  Code2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  RotateCcw,
  RotateCw,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

type IconComponent = React.ComponentType<{ className?: string }>;

const FONT_OPTIONS = [
  { label: "Default Font", value: "inherit" },
  { label: "Inter", value: "Inter" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Montserrat", value: "Montserrat" },
];

const HIGHLIGHT_COLOR = "#FEF08A";

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
];

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jfif",
  "png",
  "webp",
  "gif",
  "svg",
  "avif",
]);

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
  });
}

function normalizeEditorHtml(html: string): string {
  const cleaned = sanitizeHtml(html);
  return cleaned.trim() ? cleaned : "<p></p>";
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1] || "";
}

function isSupportedImageFile(file: File): boolean {
  const fileType = file.type.trim().toLowerCase();
  if (fileType.startsWith("image/")) {
    return true;
  }

  return SUPPORTED_IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

export interface WordEditorHandle {
  insertHtml: (html: string) => void;
  focus: () => void;
}

interface WordEditorFieldProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  onUploadStateChange?: (isUploading: boolean) => void;
  onUploadError?: (message: string) => void;
}

interface ToolbarButtonProps {
  label: string;
  icon: IconComponent;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({
  label,
  icon: Icon,
  isActive = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`be-word-btn ${isActive ? "is-active" : ""}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

const WordEditorField = forwardRef<WordEditorHandle, WordEditorFieldProps>(
  function WordEditorField(
    {
      value,
      onChange,
      placeholder = "Start writing...",
      disabled = false,
      onImageUpload,
      onUploadStateChange,
      onUploadError,
    },
    ref,
  ) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const syncingValueRef = useRef(false);
    const pendingUploadsRef = useRef(0);
    const [editorRevision, setEditorRevision] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const setUploadingState = useCallback(
      (next: boolean) => {
        setIsUploading(next);
        onUploadStateChange?.(next);
      },
      [onUploadStateChange],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
        Underline,
        Highlight.configure({
          multicolor: true,
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
          HTMLAttributes: {
            class: "be-word-image",
          },
        }),
        TextStyle,
        FontFamily,
        Placeholder.configure({
          emptyEditorClass: "is-editor-empty",
          placeholder: placeholder,
        }),
      ],
      content: normalizeEditorHtml(value || "<p></p>"),
      editorProps: {
        attributes: {
          class: "be-word-editor-surface",
        },
      },
      editable: !disabled,
      onUpdate: ({ editor: currentEditor }) => {
        if (syncingValueRef.current) {
          return;
        }
        onChange(normalizeEditorHtml(currentEditor.getHTML()));
      },
    });

    const uploadAndInsertImages = useCallback(
      async (files: File[], dropPosition?: number) => {
        if (!editor || !onImageUpload || disabled) return;

        const imageFiles = files.filter((file) => isSupportedImageFile(file));
        if (imageFiles.length === 0) {
          const message = "No supported image files detected. Use JPG, PNG, WebP, GIF, SVG, or AVIF.";
          setUploadError(message);
          onUploadError?.(message);
          return;
        }

        if (typeof dropPosition === "number") {
          editor.chain().focus().setTextSelection(dropPosition).run();
        } else {
          editor.chain().focus().run();
        }

        pendingUploadsRef.current += 1;
        setUploadingState(true);
        setUploadError(null);
        onUploadError?.("");

        try {
          for (const file of imageFiles) {
            const uploadedUrl = await onImageUpload(file);
            const imageUrl = uploadedUrl.trim();
            const imageAlt = (file.name || "Blog image").trim();

            let inserted = editor
              .chain()
              .focus()
              .setImage({ src: imageUrl, alt: imageAlt })
              .run();

            if (!inserted) {
              const endPos = editor.state.doc.content.size;
              inserted = editor
                .chain()
                .focus()
                .insertContentAt(endPos, {
                  type: "image",
                  attrs: { src: imageUrl, alt: imageAlt },
                })
                .run();
            }

            if (!inserted) {
              throw new Error("Image uploaded, but it could not be inserted at the current cursor position.");
            }

            editor.chain().focus().insertContent({ type: "paragraph" }).run();
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Image upload failed.";
          setUploadError(message);
          onUploadError?.(message);
        } finally {
          pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current - 1);
          if (pendingUploadsRef.current === 0) {
            setUploadingState(false);
          }
        }
      },
      [disabled, editor, onImageUpload, onUploadError, setUploadingState],
    );

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
      if (!editor) return;

      const refreshToolbarState = () => {
        setEditorRevision((value) => value + 1);
      };

      editor.on("selectionUpdate", refreshToolbarState);
      editor.on("transaction", refreshToolbarState);
      editor.on("focus", refreshToolbarState);
      editor.on("blur", refreshToolbarState);

      return () => {
        editor.off("selectionUpdate", refreshToolbarState);
        editor.off("transaction", refreshToolbarState);
        editor.off("focus", refreshToolbarState);
        editor.off("blur", refreshToolbarState);
      };
    }, [editor]);

    useEffect(() => {
      if (!editor) return;

      const current = normalizeEditorHtml(editor.getHTML());
      const next = normalizeEditorHtml(value || "<p></p>");
      if (current === next) return;

      syncingValueRef.current = true;
      editor.commands.setContent(next, { emitUpdate: false });
      syncingValueRef.current = false;
    }, [editor, value]);

    const insertHtmlAtCursor = useCallback(
      (html: string) => {
        if (!editor || disabled) return;
        const sanitized = sanitizeHtml(html);
        if (!sanitized) return;
        editor.chain().focus().insertContent(sanitized).run();
      },
      [disabled, editor],
    );

    const setHeadingLevel = useCallback(
      (nextValue: string) => {
        if (!editor || disabled) return;
        if (nextValue === "p") {
          editor.chain().focus().setParagraph().run();
          return;
        }

        const level = Number(nextValue);
        if (level >= 1 && level <= 3) {
          editor
            .chain()
            .focus()
            .toggleHeading({ level: level as 1 | 2 | 3 })
            .run();
        }
      },
      [disabled, editor],
    );

    const setFontFamily = useCallback(
      (fontValue: string) => {
        if (!editor || disabled) return;
        if (fontValue === "inherit") {
          editor.chain().focus().unsetFontFamily().run();
          return;
        }
        editor.chain().focus().setFontFamily(fontValue).run();
      },
      [disabled, editor],
    );

    const setLink = useCallback(() => {
      if (!editor || disabled) return;
      const previousUrl = (editor.getAttributes("link").href as string) || "";
      const nextUrl = window.prompt("Paste or type a link", previousUrl || "https://");

      if (nextUrl === null) {
        return;
      }

      const trimmed = nextUrl.trim();
      if (!trimmed) {
        editor.chain().focus().unsetLink().run();
        return;
      }

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmed })
        .run();
    }, [disabled, editor]);

    const activeHeading = useMemo(() => {
      if (!editor) return "p";
      if (editor.isActive("heading", { level: 1 })) return "1";
      if (editor.isActive("heading", { level: 2 })) return "2";
      if (editor.isActive("heading", { level: 3 })) return "3";
      return "p";
    }, [editor, editorRevision]);

    const activeFontFamily = useMemo(() => {
      if (!editor) return "inherit";
      const current = editor.getAttributes("textStyle").fontFamily as
        | string
        | undefined;
      if (!current || !current.trim()) {
        return "inherit";
      }

      const normalized = current.replace(/^\"|\"$/g, "").trim();
      const known = FONT_OPTIONS.find(
        (option) =>
          option.value !== "inherit" &&
          option.value.toLowerCase() === normalized.toLowerCase(),
      );

      return known?.value || "inherit";
    }, [editor, editorRevision]);

    const textStats = useMemo(() => {
      if (!editor) {
        return { words: 0, characters: 0 };
      }

      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;
      return { words, characters };
    }, [editor, editorRevision]);

    useImperativeHandle(
      ref,
      () => ({
        insertHtml: (html: string) => {
          insertHtmlAtCursor(html);
        },
        focus: () => {
          editor?.chain().focus().run();
        },
      }),
      [editor, insertHtmlAtCursor],
    );

    if (!editor) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          Loading editor...
        </div>
      );
    }

    return (
      <div className="be-word-editor space-y-3">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="be-word-toolbar flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-3">
            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
              <select
                value={activeHeading}
                disabled={disabled}
                onChange={(event) => setHeadingLevel(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-red-500"
              >
                <option value="p">Normal</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>

              <select
                value={activeFontFamily}
                disabled={disabled}
                onChange={(event) => setFontFamily(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-red-500"
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <ToolbarButton
                label="Bold"
                icon={Bold}
                disabled={disabled}
                isActive={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              />
              <ToolbarButton
                label="Italic"
                icon={Italic}
                disabled={disabled}
                isActive={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              />
              <ToolbarButton
                label="Underline"
                icon={UnderlineIcon}
                disabled={disabled}
                isActive={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              />
              <ToolbarButton
                label="Strike"
                icon={Strikethrough}
                disabled={disabled}
                isActive={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              />
              <ToolbarButton
                label="Highlight"
                icon={Highlighter}
                disabled={disabled}
                isActive={editor.isActive("highlight")}
                onClick={() => {
                  if (editor.isActive("highlight")) {
                    editor.chain().focus().unsetHighlight().run();
                    return;
                  }
                  editor
                    .chain()
                    .focus()
                    .toggleHighlight({ color: HIGHLIGHT_COLOR })
                    .run();
                }}
              />
            </div>

            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <ToolbarButton
                label="Paragraph"
                icon={Pilcrow}
                disabled={disabled}
                isActive={editor.isActive("paragraph")}
                onClick={() => editor.chain().focus().setParagraph().run()}
              />
              <ToolbarButton
                label="Bulleted List"
                icon={List}
                disabled={disabled}
                isActive={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              />
              <ToolbarButton
                label="Numbered List"
                icon={ListOrdered}
                disabled={disabled}
                isActive={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              />
              <ToolbarButton
                label="Quote"
                icon={Quote}
                disabled={disabled}
                isActive={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              />
              <ToolbarButton
                label="Code Block"
                icon={Code2}
                disabled={disabled}
                isActive={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              />
            </div>

            <div className="flex items-center gap-1">
              <ToolbarButton
                label="Insert Image"
                icon={ImagePlus}
                disabled={disabled || !onImageUpload || isUploading}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length > 0) {
                    void uploadAndInsertImages(files);
                  }
                  event.currentTarget.value = "";
                }}
              />

              <ToolbarButton
                label="Insert Link"
                icon={Link2}
                disabled={disabled}
                isActive={editor.isActive("link")}
                onClick={setLink}
              />
              <ToolbarButton
                label="Undo"
                icon={RotateCcw}
                disabled={disabled || !editor.can().chain().focus().undo().run()}
                onClick={() => editor.chain().focus().undo().run()}
              />
              <ToolbarButton
                label="Redo"
                icon={RotateCw}
                disabled={disabled || !editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                className="ml-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Clear Formatting
              </button>
            </div>

            <span className="ml-1 text-xs text-gray-500">
              {isUploading
                ? "Uploading image..."
                : "Drag and drop images into the editor, or use the image button."}
            </span>
          </div>

          <div className="be-word-canvas bg-slate-100/80 px-4 py-6 sm:px-8">
            <div className="mx-auto w-full max-w-[860px] rounded-md border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <div className="relative">
                <EditorContent
                  editor={editor}
                  className="be-word-editor-content"
                  onDragEnter={(event) => {
                    if (!onImageUpload || disabled) return;
                    if (Array.from(event.dataTransfer?.types || []).includes("Files")) {
                      setIsDragActive(true);
                    }
                  }}
                  onDragOver={(event) => {
                    if (!onImageUpload || disabled) return;
                    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setIsDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    if (!onImageUpload || disabled) return;
                    const nextTarget = event.relatedTarget as Node | null;
                    if (!event.currentTarget.contains(nextTarget)) {
                      setIsDragActive(false);
                    }
                  }}
                  onDrop={(event) => {
                    if (!onImageUpload || disabled) return;
                    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
                      return;
                    }

                    event.preventDefault();
                    setIsDragActive(false);

                    const files = Array.from(event.dataTransfer?.files || []);
                    if (files.length === 0) return;

                    const resolved = editor.view.posAtCoords({
                      left: event.clientX,
                      top: event.clientY,
                    });

                    const dropPosition = resolved?.pos;
                    if (typeof dropPosition === "number") {
                      editor
                        .chain()
                        .focus()
                        .setTextSelection(dropPosition)
                        .run();
                    }

                    void uploadAndInsertImages(files, dropPosition);
                  }}
                  onPaste={(event) => {
                    if (!onImageUpload || disabled) return;

                    const items = Array.from(event.clipboardData?.items || []);
                    const files = items
                      .filter(
                        (item) =>
                          item.kind === "file" && item.type.startsWith("image/"),
                      )
                      .map((item) => item.getAsFile())
                      .filter((file): file is File => Boolean(file));

                    if (files.length === 0) return;
                    event.preventDefault();
                    void uploadAndInsertImages(files);
                  }}
                />

                {isDragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-50/80">
                    <div className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm">
                      Drop image to insert at cursor position
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">
            <span>{disabled ? "Read-only mode" : "Editing mode"}</span>
            <span>
              {textStats.words} words • {textStats.characters} characters
            </span>
          </div>
        </div>

        {uploadError && (
          <p className="text-xs font-medium text-red-600">{uploadError}</p>
        )}

        <style jsx global>{`
          .be-word-editor .be-word-toolbar {
            position: sticky;
            top: 0;
            z-index: 5;
            background: #ffffff;
          }

          .be-word-editor .be-word-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 0.55rem;
            border: 1px solid #d1d5db;
            color: #374151;
            background: #ffffff;
            transition: all 120ms ease;
          }

          .be-word-editor .be-word-btn:hover:not(:disabled) {
            background: #fef2f2;
            border-color: #fca5a5;
            color: #b91c1c;
          }

          .be-word-editor .be-word-btn.is-active {
            background: #0f172a;
            border-color: #0f172a;
            color: #ffffff;
          }

          .be-word-editor .be-word-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .be-word-editor .be-word-editor-content {
            min-height: 560px;
            max-height: 76vh;
            overflow: auto;
          }

          .be-word-editor .tiptap {
            min-height: 560px;
            padding: 2.4rem 2.2rem 3rem;
            color: #111827;
            font-size: 1.05rem;
            line-height: 1.9;
            outline: none;
          }

          .be-word-editor .tiptap.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #94a3b8;
            float: left;
            height: 0;
            pointer-events: none;
          }

          .be-word-editor .tiptap h1,
          .be-word-editor .tiptap h2,
          .be-word-editor .tiptap h3,
          .be-word-editor .tiptap h4,
          .be-word-editor .tiptap h5,
          .be-word-editor .tiptap h6 {
            line-height: 1.22;
            margin: 1.4em 0 0.55em;
            font-weight: 700;
          }

          .be-word-editor .tiptap p {
            margin: 0 0 1em;
          }

          .be-word-editor .tiptap ul,
          .be-word-editor .tiptap ol {
            margin: 0 0 1em;
            padding-left: 1.35em;
          }

          .be-word-editor .tiptap blockquote {
            margin: 1.15em 0;
            padding: 0.2em 0 0.2em 0.95em;
            border-left: 4px solid #ef4444;
            color: #475569;
          }

          .be-word-editor .tiptap pre {
            background: #111827;
            color: #e5e7eb;
            border-radius: 0.6rem;
            padding: 0.9rem 1rem;
            margin: 1.1em 0;
            overflow-x: auto;
          }

          .be-word-editor .tiptap a {
            color: #b91c1c;
            text-decoration: underline;
          }

          .be-word-editor .tiptap mark {
            border-radius: 0.22rem;
            padding: 0.03em 0.12em;
          }

          .be-word-editor .tiptap img.be-word-image {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 0.7rem;
            margin: 1rem auto;
            border: 1px solid #d1d5db;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
          }

          @media (max-width: 768px) {
            .be-word-editor .be-word-canvas {
              padding: 0.8rem;
            }

            .be-word-editor .be-word-editor-content,
            .be-word-editor .tiptap {
              min-height: 400px;
            }

            .be-word-editor .tiptap {
              padding: 1rem;
              font-size: 1rem;
              line-height: 1.78;
            }
          }
        `}</style>
      </div>
    );
  },
);

export default WordEditorField;
