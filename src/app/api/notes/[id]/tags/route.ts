import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** POST /api/notes/[id]/tags — assign a tag to a note */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: noteId } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { tag_id } = await request.json();
    if (!tag_id) return errorResponse('tag_id is required');

    // Verify note ownership
    const { data: note } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();
    if (!note) return errorResponse('Note not found', 404);

    // Verify tag ownership
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tag_id)
      .eq('user_id', user.id)
      .single();
    if (!tag) return errorResponse('Tag not found', 404);

    const { error } = await supabase
      .from('note_tags')
      .upsert({ note_id: noteId, tag_id }, { onConflict: 'note_id,tag_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}

/** GET /api/notes/[id]/tags — list tags on a note */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: noteId } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { data, error } = await supabase
      .from('note_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('note_id', noteId);

    if (error) throw error;

    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
