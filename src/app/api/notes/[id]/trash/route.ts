import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** POST /api/notes/[id]/trash — soft delete a note */
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

    const { data, error } = await supabase
      .from('notes')
      .update({
        is_deleted: true,
        is_trashed: true,  // Keep in sync with legacy column
        deleted_at: new Date().toISOString(),
        is_pinned: false,
        pinned_at: null,
        updated_at: new Date().toISOString(),
      })
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
