import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { SortOption } from '@/types/database.types';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** GET /api/notes — list authenticated user's notes with sort & tag filter */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { searchParams } = request.nextUrl;
    const sort = (searchParams.get('sort') ?? 'updated') as SortOption;
    const tagIds = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const cursor = searchParams.get('cursor');

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false });

    if (sort === 'updated') {
      query = query.order('updated_at', { ascending: false });
    } else if (sort === 'created') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'alpha') {
      query = query.order('title', { ascending: true });
    }

    if (cursor) {
      query = query.lt('updated_at', cursor);
    }

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    // Filter by relational tag IDs if provided
    let notes = data ?? [];
    if (tagIds) {
      const ids = tagIds.split(',').filter(Boolean);
      if (ids.length > 0) {
        const { data: noteTagData } = await supabase
          .from('note_tags')
          .select('note_id, tag_id')
          .in('tag_id', ids);

        if (noteTagData) {
          // AND logic: note must have ALL selected tags
          const noteCounts = new Map<string, number>();
          for (const nt of noteTagData) {
            noteCounts.set(nt.note_id, (noteCounts.get(nt.note_id) ?? 0) + 1);
          }
          notes = notes.filter((n) => (noteCounts.get(n.id) ?? 0) >= ids.length);
        }
      }
    }

    return NextResponse.json({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}

/** POST /api/notes — create a new note */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const { title, content, content_text, color, tags, is_pinned } = body;

    if (!title?.trim() && !content?.trim()) {
      return errorResponse('Note must have a title or content');
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: title?.trim() ?? '',
        content: content ?? '',
        content_text: content_text ?? '',
        color: color ?? '#f3f4f6',
        tags: tags ?? [],
        is_pinned: is_pinned ?? false,
        is_archived: false,
        is_trashed: false,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return errorResponse(message, 500);
  }
}
