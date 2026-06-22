import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** DELETE /api/notes/[id]/tags/[tagId] — remove a tag from a note */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  try {
    const { id: noteId, tagId } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    // Verify note ownership via notes table
    const { data: note } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();
    if (!note) return errorResponse('Note not found', 404);

    const { error } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
