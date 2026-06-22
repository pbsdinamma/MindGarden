import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** PATCH /api/notes/[id] — partial update (title, content, content_text, color, tags, is_pinned) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const body = await request.json();

    // Only allow updatable fields — prevent user from overriding system fields
    const allowedFields = [
      'title', 'content', 'content_text', 'color', 'tags',
      'is_pinned', 'pinned_at', 'is_archived',
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse('Note not found', 404);

    return NextResponse.json({ note: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}

/** DELETE /api/notes/[id] — hard delete (only permitted for already-soft-deleted notes) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    // Verify the note is already soft-deleted before hard-deleting
    const { data: existing } = await supabase
      .from('notes')
      .select('id, is_deleted, is_trashed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) return errorResponse('Note not found', 404);
    if (!existing.is_deleted && !existing.is_trashed) {
      return errorResponse('Note must be in trash before permanent deletion', 403);
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
