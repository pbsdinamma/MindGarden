'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import EditorToolbar from './EditorToolbar';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (json: string, plainText: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Controlled TipTap rich text editor.
 * Stores content as TipTap JSON. Calls onChange with both
 * the JSON string and extracted plain text on every change.
 */
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start capturing your amazing ideas here...',
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
        // StarterKit v3 includes Underline — no separate import needed
      }),
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editable: !readOnly,
    content: (() => {
      if (!content) return '';
      try {
        return JSON.parse(content);
      } catch {
        // Legacy plain text — wrap in a paragraph node
        return {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }],
        };
      }
    })(),
    onUpdate({ editor: e }) {
      const json = JSON.stringify(e.getJSON());
      const plain = e.getText();
      onChange(json, plain);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] text-text-base leading-relaxed',
        'aria-multiline': 'true',
        role: 'textbox',
        'aria-label': 'Note content editor',
      },
    },
  });

  // Sync external content changes (e.g., when switching notes)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const currentJson = JSON.stringify(editor.getJSON());
    if (content === currentJson) return;

    let parsed: unknown = '';
    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = {
          type: 'doc',
          content: [{ type: 'paragraph', content: content ? [{ type: 'text', text: content }] : [] }],
        };
      }
    }

    editor.commands.setContent(parsed as Parameters<typeof editor.commands.setContent>[0]);
  }, [content, editor]);

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
