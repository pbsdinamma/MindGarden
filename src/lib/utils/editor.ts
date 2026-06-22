// ============================================================
// src/lib/utils/editor.ts
// Utility for converting TipTap JSON content to plain text
// for full-text search indexing (content_text column).
// ============================================================

interface TiptapNode {
  type: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
}

/**
 * Recursively extract all text leaves from a TipTap JSON document.
 */
function extractFromNode(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractFromNode).join(' ');
  }
  return '';
}

/**
 * Convert a TipTap JSON string (or plain HTML/text) to clean plain text.
 * Used to populate the `content_text` column for Postgres FTS.
 *
 * @param content - TipTap JSON string, or plain text string
 * @returns clean plain text without markup
 */
export function extractPlainText(content: string): string {
  if (!content || !content.trim()) return '';

  try {
    const parsed: TiptapNode = JSON.parse(content);
    if (parsed && parsed.type === 'doc') {
      return extractFromNode(parsed).replace(/\s+/g, ' ').trim();
    }
  } catch {
    // Not JSON — treat as plain text (legacy notes)
  }

  // Strip any HTML tags if present (sketch / legacy content)
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
