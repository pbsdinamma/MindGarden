'use client';

import React, { useCallback, memo } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

const ToolbarButton = memo(function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'p-1.5 rounded-lg text-sm smooth-hover flex items-center justify-center shrink-0 transition-all',
        isActive
          ? 'bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400'
          : 'text-muted hover:text-text-base hover:bg-muted-light',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {children}
    </button>
  );
});

interface EditorToolbarProps {
  editor: Editor;
}

function Divider() {
  return <span className="w-px h-4 bg-card-border shrink-0" aria-hidden="true" />;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const focus = useCallback(
    (cb: () => void) => {
      editor.chain().focus();
      cb();
    },
    [editor],
  );

  return (
    <div
      role="toolbar"
      aria-label="Text formatting toolbar"
      className="flex items-center gap-0.5 px-1 py-1 bg-muted-light/60 border border-card-border/60 rounded-xl overflow-x-auto no-scrollbar"
    >
      <ToolbarButton
        label="Bold"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Italic"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Underline"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Heading 1"
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Heading 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Heading 3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Bullet list"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Ordered list"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Blockquote"
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Code block"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
}
