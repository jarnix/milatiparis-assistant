"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useState } from 'react';

interface TipTapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function TipTapEditor({
    value,
    onChange,
    className
}: TipTapEditorProps) {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Color.configure({ types: ['textStyle'] }),
            TextStyle,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none p-4',
                style: 'white-space: pre-wrap;',
            },
        },
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
    });

    // Update editor content when value prop changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [editor, value]);

    if (!isMounted || !editor) {
        return (
            <div className={className}>
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Loading editor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Toolbar */}
            <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('bold') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('italic') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('strike') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Strike
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('heading', { level: 1 }) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('heading', { level: 2 }) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('heading', { level: 3 }) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    H3
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('bulletList') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('orderedList') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    1. List
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
                >
                    Table
                </button>
                {editor.isActive('table') && (
                    <>
                        <button
                            onClick={() => editor.chain().focus().addColumnBefore().run()}
                            className="px-2 py-1 text-xs rounded bg-white text-gray-600 hover:bg-gray-100"
                        >
                            +Col
                        </button>
                        <button
                            onClick={() => editor.chain().focus().addRowBefore().run()}
                            className="px-2 py-1 text-xs rounded bg-white text-gray-600 hover:bg-gray-100"
                        >
                            +Row
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            className="px-2 py-1 text-xs rounded bg-white text-red-600 hover:bg-red-50"
                        >
                            -Col
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            className="px-2 py-1 text-xs rounded bg-white text-red-600 hover:bg-red-50"
                        >
                            -Row
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                        >
                            Delete Table
                        </button>
                    </>
                )}
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('blockquote') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Quote
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`px-3 py-1 text-sm rounded ${
                        editor.isActive('codeBlock') 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Code
                </button>
            </div>
            
            {/* Editor */}
            <div className="border border-t-0 border-gray-300 rounded-b-lg h-64 bg-white overflow-hidden">
                <div className="h-full overflow-y-auto tiptap-editor-content">
                    <EditorContent 
                        editor={editor} 
                        className="h-full"
                    />
                </div>
                <style jsx global>{`
                    .tiptap-editor-content .ProseMirror p {
                        margin-bottom: 1rem;
                    }
                    .tiptap-editor-content .ProseMirror p:last-child {
                        margin-bottom: 0;
                    }
                    .tiptap-editor-content .ProseMirror h1, 
                    .tiptap-editor-content .ProseMirror h2, 
                    .tiptap-editor-content .ProseMirror h3 {
                        margin-bottom: 0.75rem;
                        margin-top: 1.5rem;
                        font-weight: 600;
                    }
                    .tiptap-editor-content .ProseMirror h1:first-child,
                    .tiptap-editor-content .ProseMirror h2:first-child,
                    .tiptap-editor-content .ProseMirror h3:first-child {
                        margin-top: 0;
                    }
                    .tiptap-editor-content .ProseMirror ul, 
                    .tiptap-editor-content .ProseMirror ol {
                        margin-bottom: 1rem;
                        padding-left: 1.5rem;
                    }
                    .tiptap-editor-content .ProseMirror blockquote {
                        margin-bottom: 1rem;
                        padding-left: 1rem;
                        border-left: 4px solid #e5e7eb;
                        font-style: italic;
                        color: #6b7280;
                    }
                    .tiptap-editor-content .ProseMirror table {
                        border-collapse: collapse;
                        margin: 1rem 0;
                        width: 100%;
                    }
                    .tiptap-editor-content .ProseMirror table td, 
                    .tiptap-editor-content .ProseMirror table th {
                        border: 1px solid #d1d5db;
                        padding: 0.5rem;
                        text-align: left;
                    }
                    .tiptap-editor-content .ProseMirror table th {
                        background-color: #f9fafb;
                        font-weight: 600;
                    }
                    .tiptap-editor-content .ProseMirror code {
                        background-color: #f3f4f6;
                        padding: 0.125rem 0.25rem;
                        border-radius: 0.25rem;
                        font-family: ui-monospace, monospace;
                        font-size: 0.875em;
                    }
                    .tiptap-editor-content .ProseMirror pre {
                        background-color: #1f2937;
                        color: #f9fafb;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        margin: 1rem 0;
                        overflow-x: auto;
                    }
                    .tiptap-editor-content .ProseMirror pre code {
                        background: transparent;
                        padding: 0;
                        color: inherit;
                    }
                `}</style>
            </div>
        </div>
    );
}