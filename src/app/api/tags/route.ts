import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** GET /api/tags — list all tags for the authenticated user */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}

/** POST /api/tags — create a new tag */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const name = body.name?.trim();
    const color = body.color ?? '#6366f1';

    if (!name) return errorResponse('Tag name is required');
    if (name.length > 50) return errorResponse('Tag name must be 50 characters or fewer');

    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('A tag with this name already exists', 409);
      }
      throw error;
    }

    return NextResponse.json({ tag: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
