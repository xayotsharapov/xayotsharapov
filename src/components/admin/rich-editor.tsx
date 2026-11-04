"use client";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { memo, useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

type Props = {
  initialContent: JSONContent | string;
  onChange: (html: string, json: JSONContent) => void;
};

// Defined once: a new extensions array on each render makes TipTap rebuild the editor.
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    underline: false,
    code: false,
    codeBlock: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    },
  }),
  Image.configure({ inline: false, allowBase64: false }),
  Placeholder.configure({ placeholder: "Start writing…" }),
];

/**
 * The editor is created once and owns its content. Parent re-renders (autosave, other fields)
 * never reset it. Memoized so typing elsewhere doesn't re-render it.
 */
export const RichEditor = memo(function RichEditor({ initialContent, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [initial] = useState(initialContent);

  async function insertFiles(files: File[], pos?: number) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length || !editorRef.current) return false;
    setUploading(true);
    try {
      for (const file of images) {
        const img = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const chain = editorRef.current.chain().focus();
        if (pos !== undefined) chain.setTextSelection(pos);
        chain.setImage({ src: img.url, alt, width: img.width, height: img.height }).run();
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
    return true;
  }

  const insertRef = useRef(insertFiles);
  insertRef.current = insertFiles;

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: EXTENSIONS,
      content: initial,
    editorProps: {
      attributes: {
        class: "tiptap article prose min-h-[50vh] max-w-none py-4",
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (!files.some((f) => f.type.startsWith("image/"))) return false;
        void insertRef.current(files);
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.some((f) => f.type.startsWith("image/"))) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertRef.current(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML(), editor.getJSON()),
    },
    [], // create once
  );
  editorRef.current = editor;

  return (
    <div className="rounded-md border border-line">
      {editor && <Toolbar editor={editor} uploading={uploading} onFiles={insertFiles} />}
      <div className="px-4 sm:px-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

function Toolbar({
  editor,
  uploading,
  onFiles,
}: {
  editor: Editor;
  uploading: boolean;
  onFiles: (files: File[]) => Promise<boolean>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      image: e.isActive("image"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-sm min-w-8 ${active ? "bg-fg text-bg" : "hover:bg-surface"}`;
  const c = () => editor.chain().focus();

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = prompt("Link URL (leave empty to remove the link):", prev ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") return c().extendMarkRange("link").unsetLink().run();
    c().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function setAlt() {
    const prev = (editor.getAttributes("image").alt as string) ?? "";
    const alt = prompt("Image description (alt text):", prev);
    if (alt !== null) c().updateAttributes("image", { alt }).run();
  }

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      // Keep focus and selection in the text when a toolbar button is clicked.
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) e.preventDefault();
      }}
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-md border-b border-line bg-bg/95 p-2 backdrop-blur"
    >
      <button type="button" className={btn(s.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</button>
      <button type="button" className={btn(s.h3)} onClick={() => c().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</button>
      <span className="mx-1 h-5 w-px bg-line" />
      <button type="button" className={`${btn(s.bold)} font-bold`} onClick={() => c().toggleBold().run()} title="Bold (Ctrl+B)">B</button>
      <button type="button" className={`${btn(s.italic)} italic`} onClick={() => c().toggleItalic().run()} title="Italic (Ctrl+I)">I</button>
      <button type="button" className={`${btn(s.strike)} line-through`} onClick={() => c().toggleStrike().run()} title="Strikethrough">S</button>
      <span className="mx-1 h-5 w-px bg-line" />
      <button type="button" className={btn(s.bullet)} onClick={() => c().toggleBulletList().run()} title="Bullet list">• List</button>
      <button type="button" className={btn(s.ordered)} onClick={() => c().toggleOrderedList().run()} title="Numbered list">1. List</button>
      <button type="button" className={btn(s.quote)} onClick={() => c().toggleBlockquote().run()} title="Quote">“ ”</button>
      <button type="button" className={btn(false)} onClick={() => c().setHorizontalRule().run()} title="Divider">—</button>
      <span className="mx-1 h-5 w-px bg-line" />
      <button type="button" className={btn(s.link)} onClick={setLink} title="Link">Link</button>
      <button
        type="button"
        className={btn(false)}
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        title="Insert image"
      >
        {uploading ? "Uploading…" : "Image"}
      </button>
      {s.image && (
        <button type="button" className={btn(false)} onClick={setAlt} title="Image description">
          Alt text
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          await onFiles(files);
        }}
      />
      <span className="ml-auto flex gap-1">
        <button type="button" className={btn(false)} disabled={!s.canUndo} onClick={() => c().undo().run()} title="Undo">↶</button>
        <button type="button" className={btn(false)} disabled={!s.canRedo} onClick={() => c().redo().run()} title="Redo">↷</button>
      </span>
    </div>
  );
}
