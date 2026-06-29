import { isSupabaseConfigured, supabase } from './supabase'

const IDEAS_TABLE = 'ideas'

export { isSupabaseConfigured }

const fromDatabaseIdea = (idea) => ({
  id: idea.id,
  content: idea.content ?? '',
  videoUrl: idea.video_url ?? '',
  videoId: idea.video_id ?? '',
})

const toDatabaseIdea = (idea) => ({
  id: idea.id,
  content: idea.content,
  video_url: idea.videoUrl,
  video_id: idea.videoId,
})

export const fetchIdeas = async () => {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from(IDEAS_TABLE)
    .select('id, content, video_url, video_id')
    .order('id', { ascending: false })

  if (error) throw error

  return data.map(fromDatabaseIdea)
}

export const createIdea = async (idea) => {
  if (!isSupabaseConfigured) return idea

  const { data, error } = await supabase
    .from(IDEAS_TABLE)
    .insert(toDatabaseIdea(idea))
    .select('id, content, video_url, video_id')
    .single()

  if (error) throw error

  return fromDatabaseIdea(data)
}

export const updateIdea = async (idea) => {
  if (!isSupabaseConfigured) return idea

  const { data, error } = await supabase
    .from(IDEAS_TABLE)
    .update(toDatabaseIdea(idea))
    .eq('id', idea.id)
    .select('id, content, video_url, video_id')
    .single()

  if (error) throw error

  return fromDatabaseIdea(data)
}

export const deleteIdea = async (ideaId) => {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.from(IDEAS_TABLE).delete().eq('id', ideaId)

  if (error) throw error
}
