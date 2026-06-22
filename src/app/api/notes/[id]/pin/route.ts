import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** POST /api/notes/[id]/pin — toggle pin state */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    // Fetch current pin state
    const { data: existing } = await supabase
      .from('notes')
      .select('is_pinned')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) return errorResponse('Note not found', 404);

    const newPinned = !existing.is_pinned;

    const { data, error } = await supabase
      .from('notes')
      .update({
        is_pinned: newPinned,
        pinned_at: newPinned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ note: data, is_pinned: newPinned });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
