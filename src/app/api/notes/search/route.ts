import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** GET /api/notes/search?q=...&limit=20&cursor=... */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    if (!q) return NextResponse.json({ results: [] });

    // Use Postgres full-text search with ts_headline for snippets
    // We use a raw RPC call to leverage to_tsquery and ts_headline
    const { data, error } = await supabase.rpc('search_notes', {
      p_user_id: user.id,
      p_query: q,
      p_limit: limit,
    });

    if (error) {
      // Fallback: simple ILIKE search if FTS RPC not available
      const { data: fallback, error: fallbackError } = await supabase
        .from('notes')
        .select('id, title, content_text, content, updated_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .or(`title.ilike.%${q}%,content_text.ilike.%${q}%,content.ilike.%${q}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (fallbackError) throw fallbackError;

      const results = (fallback ?? []).map((note) => ({
        id: note.id,
        title: note.title,
        snippet: (note.content_text || note.content || '').slice(0, 150),
        updated_at: note.updated_at,
      }));

      return NextResponse.json({ results });
    }

    return NextResponse.json({ results: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
