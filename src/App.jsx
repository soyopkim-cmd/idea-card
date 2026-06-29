import { useEffect, useState } from 'react'
import './App.css'
import {
  createIdea as createRemoteIdea,
  deleteIdea as deleteRemoteIdea,
  fetchIdeas,
  isSupabaseConfigured,
  updateIdea as updateRemoteIdea,
} from './ideasApi'

const IDEAS_STORAGE_KEY = 'idea-card:ideas'

const initialIdeas = [
  {
    id: 1,
    content: '회의 전에 떠오른 아이디어를 빠르게 적어두기',
    videoUrl: '',
    videoId: '',
  },
]

const normalizeUrl = (url) => {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) return ''

  return /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`
}

const getYouTubeVideoId = (url) => {
  const normalizedUrl = normalizeUrl(url)

  if (!normalizedUrl) return ''

  try {
    const parsedUrl = new URL(normalizedUrl)
    const hostname = parsedUrl.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0]?.slice(0, 11) ?? ''
    }

    if (hostname.endsWith('youtube.com')) {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v') ?? ''
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
      const embedIndex = pathParts.findIndex((part) =>
        ['embed', 'live', 'shorts'].includes(part),
      )

      if (embedIndex !== -1) {
        return pathParts[embedIndex + 1] ?? ''
      }
    }
  } catch {
    return ''
  }

  return ''
}

const getYouTubeWatchUrl = (videoId) =>
  videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''

const getYouTubeEmbedUrl = (videoId) =>
  videoId ? `https://www.youtube.com/embed/${videoId}` : ''

const getSavedIdeas = () => {
  const savedIdeas = localStorage.getItem(IDEAS_STORAGE_KEY)

  if (!savedIdeas) return initialIdeas

  try {
    const parsedIdeas = JSON.parse(savedIdeas)

    if (!Array.isArray(parsedIdeas)) return initialIdeas

    return parsedIdeas
      .filter(
        (idea) =>
          typeof idea?.id === 'number' && typeof idea?.content === 'string',
      )
      .map((idea) => ({
        ...idea,
        videoUrl: typeof idea.videoUrl === 'string' ? idea.videoUrl : '',
        videoId: typeof idea.videoId === 'string' ? idea.videoId : '',
      }))
  } catch {
    return initialIdeas
  }
}

function App() {
  const [ideas, setIdeas] = useState(getSavedIdeas)
  const [newIdea, setNewIdea] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [syncError, setSyncError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingVideoUrl, setEditingVideoUrl] = useState('')
  const [editingError, setEditingError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadIdeas = async () => {
      try {
        const remoteIdeas = await fetchIdeas()
        setIdeas(remoteIdeas)
        setSyncError('')
      } catch (error) {
        setSyncError(`Supabase 데이터를 불러오지 못했습니다: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadIdeas()
  }, [])

  useEffect(() => {
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas))
  }, [ideas])

  const handleCreateIdea = async (event) => {
    event.preventDefault()
    const content = newIdea.trim()
    const videoUrl = normalizeUrl(newVideoUrl)
    const videoId = getYouTubeVideoId(videoUrl)

    if (!content && !videoUrl) return

    if (videoUrl && !videoId) {
      setFormError('올바른 유튜브 링크를 입력해주세요.')
      return
    }

    const idea = {
      id: Date.now(),
      content,
      videoUrl,
      videoId,
    }

    try {
      const savedIdea = await createRemoteIdea(idea)
      setIdeas((currentIdeas) => [savedIdea, ...currentIdeas])
      setNewIdea('')
      setNewVideoUrl('')
      setFormError('')
      setSyncError('')
    } catch (error) {
      setFormError(`아이디어를 저장하지 못했습니다: ${error.message}`)
    }
  }

  const handleDeleteIdea = async (ideaId) => {
    try {
      await deleteRemoteIdea(ideaId)
      setIdeas((currentIdeas) =>
        currentIdeas.filter((idea) => idea.id !== ideaId),
      )
      setSyncError('')

      if (editingId === ideaId) {
        setEditingId(null)
        setEditingContent('')
        setEditingVideoUrl('')
        setEditingError('')
      }
    } catch (error) {
      setSyncError(`아이디어를 삭제하지 못했습니다: ${error.message}`)
    }
  }

  const handleStartEdit = (idea) => {
    setEditingId(idea.id)
    setEditingContent(idea.content)
    setEditingVideoUrl(idea.videoUrl || getYouTubeWatchUrl(idea.videoId))
    setEditingError('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
    setEditingVideoUrl('')
    setEditingError('')
  }

  const handleSaveEdit = async (ideaId) => {
    const content = editingContent.trim()
    const videoUrl = normalizeUrl(editingVideoUrl)
    const videoId = getYouTubeVideoId(videoUrl)

    if (!content && !videoUrl) return

    if (videoUrl && !videoId) {
      setEditingError('올바른 유튜브 링크를 입력해주세요.')
      return
    }

    const previousIdea = ideas.find((idea) => idea.id === ideaId)
    const nextIdea = {
      ...previousIdea,
      id: ideaId,
      content,
      videoUrl,
      videoId,
    }

    try {
      const savedIdea = await updateRemoteIdea(nextIdea)
      setIdeas((currentIdeas) =>
        currentIdeas.map((idea) => (idea.id === ideaId ? savedIdea : idea)),
      )
      setSyncError('')
      handleCancelEdit()
    } catch (error) {
      setEditingError(`아이디어를 수정하지 못했습니다: ${error.message}`)
    }
  }

  return (
    <main className="idea-board">
      <section className="board-header" aria-labelledby="board-title">
        <div>
          <p className="eyebrow">Idea Board</p>
          <h1 id="board-title">아이디어 보드</h1>
        </div>
        <p className="summary">{ideas.length}개의 아이디어</p>
      </section>

      {syncError ? <p className="sync-error">{syncError}</p> : null}

      <div className="board-layout">
        <aside className="composer-panel">
          <form className="idea-form" onSubmit={handleCreateIdea}>
            <label htmlFor="idea-input">새 아이디어</label>
            <div className="composer">
              <textarea
                id="idea-input"
                value={newIdea}
                onChange={(event) => setNewIdea(event.target.value)}
                placeholder="떠오른 생각을 적어보세요"
                rows="7"
              />
              <input
                id="youtube-input"
                type="text"
                value={newVideoUrl}
                onChange={(event) => {
                  setNewVideoUrl(event.target.value)
                  setFormError('')
                }}
                placeholder="유튜브 링크를 붙여넣으세요"
              />
              <button type="submit">저장</button>
            </div>
            {formError ? <p className="form-error">{formError}</p> : null}
          </form>
        </aside>

        <section className="board-panel" aria-label="저장된 아이디어 목록">
          {isLoading ? (
            <div className="empty-state">아이디어를 불러오는 중입니다.</div>
          ) : ideas.length === 0 ? (
            <div className="empty-state">아직 저장된 아이디어가 없습니다.</div>
          ) : (
            <div className="idea-list">
              {ideas.map((idea) => {
                const isEditing = editingId === idea.id

                return (
                  <article className="idea-card" key={idea.id}>
                    {isEditing ? (
                      <>
                        <textarea
                          className="edit-input"
                          value={editingContent}
                          onChange={(event) =>
                            setEditingContent(event.target.value)
                          }
                          rows="5"
                          aria-label="아이디어 내용 수정"
                        />
                        <input
                          className="edit-video-input"
                          type="text"
                          value={editingVideoUrl}
                          onChange={(event) => {
                            setEditingVideoUrl(event.target.value)
                            setEditingError('')
                          }}
                          placeholder="유튜브 링크"
                          aria-label="유튜브 링크 수정"
                        />
                        {editingError ? (
                          <p className="form-error">{editingError}</p>
                        ) : null}
                        <div className="card-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={handleCancelEdit}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idea.id)}
                          >
                            수정 저장
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="card-body">
                          {idea.videoId ? (
                            <>
                              <div className="video-frame">
                                <iframe
                                  src={getYouTubeEmbedUrl(idea.videoId)}
                                  title="YouTube video player"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                />
                              </div>
                              <a
                                className="video-link"
                                href={getYouTubeWatchUrl(idea.videoId)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                유튜브에서 열기
                              </a>
                            </>
                          ) : null}
                          {idea.content ? <p>{idea.content}</p> : null}
                        </div>
                        <div className="card-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleStartEdit(idea)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteIdea(idea.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
