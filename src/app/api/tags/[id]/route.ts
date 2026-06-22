import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** PATCH /api/tags/[id] — rename or recolor a tag */
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
    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return errorResponse('Tag name cannot be empty');
      if (name.length > 50) return errorResponse('Tag name must be 50 characters or fewer');
      updates.name = name;
    }

    if (body.color !== undefined) {
      updates.color = body.color;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update');
    }

    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return errorResponse('A tag with this name already exists', 409);
      throw error;
    }
    if (!data) return errorResponse('Tag not found', 404);

    return NextResponse.json({ tag: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}

/** DELETE /api/tags/[id] — delete a tag (cascade via DB) */
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

    const { error } = await supabase
      .from('tags')
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
