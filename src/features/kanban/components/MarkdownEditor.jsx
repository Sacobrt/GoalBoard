import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Bold, Italic, List, ListOrdered, Code, Heading2, Quote, Maximize2, Minimize2 } from "lucide-react";

export const proseClasses =
    "prose prose-sm prose-slate max-w-none text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_a]:text-indigo-500 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500";

export function MarkdownEditor({ value, onChange, placeholder = "Write a description..." }) {
    const [expanded, setExpanded] = useState(false);
    const editor = useEditor({
        extensions: [StarterKit, Placeholder.configure({ placeholder }), Markdown.configure({ html: false, transformPastedText: true })],
        content: value || "",
        onUpdate({ editor }) {
            onChange(editor.storage.markdown.getMarkdown());
        },
    });

    // Sync when external value changes (e.g. dialog re-opens with different task)
    useEffect(() => {
        if (!editor || editor.isDestroyed) return;
        const current = editor.storage.markdown.getMarkdown();
        if (current !== value) {
            editor.commands.setContent(value || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const toolbarButtons = [
        { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), title: "Bold", isActive: () => !!editor?.isActive("bold") },
        { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), title: "Italic", isActive: () => !!editor?.isActive("italic") },
        {
            icon: Heading2,
            action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            title: "Heading",
            isActive: () => !!editor?.isActive("heading", { level: 2 }),
        },
        { icon: Code, action: () => editor?.chain().focus().toggleCode().run(), title: "Code", isActive: () => !!editor?.isActive("code") },
        { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), title: "Bullet list", isActive: () => !!editor?.isActive("bulletList") },
        {
            icon: ListOrdered,
            action: () => editor?.chain().focus().toggleOrderedList().run(),
            title: "Numbered list",
            isActive: () => !!editor?.isActive("orderedList"),
        },
        { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), title: "Quote", isActive: () => !!editor?.isActive("blockquote") },
    ];

    return (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                {toolbarButtons.map((btn) => (
                    <button
                        key={btn.title}
                        type="button"
                        title={btn.title}
                        onClick={btn.action}
                        className={`p-1.5 rounded transition-colors ${
                            btn.isActive() ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        }`}
                    >
                        <btn.icon className="h-3.5 w-3.5" />
                    </button>
                ))}
                <button
                    type="button"
                    title={expanded ? "Collapse editor" : "Expand editor"}
                    onClick={() => setExpanded((v) => !v)}
                    className="p-1.5 rounded transition-colors text-slate-500 hover:bg-slate-200 hover:text-slate-700 ml-auto"
                >
                    {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
            </div>

            {/* WYSIWYG editor */}
            <EditorContent
                editor={editor}
                className={`bg-white ${expanded ? "h-full" : "h-64"} overflow-y-auto px-3 py-2 text-sm transition-all ${proseClasses} [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-25`}
            />
        </div>
    );
}

export function MarkdownPreview({ content }) {
    if (!content) return null;
    return (
        <div className={proseClasses}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
