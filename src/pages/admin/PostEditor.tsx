import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Post } from '../../types/database'
import { MDXRenderer } from '../../components/MDXRenderer'
import './PostEditor.css'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function PostEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    async function fetchPost(postId: string) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) {
        console.error('Error fetching post:', error)
        setError('Post not found')
        setIsLoading(false)
        return
      }

      const post = data as Post
      setTitle(post.title)
      setSlug(post.slug)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.cover_image || '')
      setPublished(post.published)
      setIsLoading(false)
    }

    if (isEditing && id) {
      fetchPost(id)
    }
  }, [id, isEditing])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEditing) {
      setSlug(generateSlug(value))
    }
  }

  function handleEditorChange(markdown: string) {
    setContent(markdown)
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    setError('')
    setIsSaving(true)

    console.log('Submit called, user:', user)
    console.log('Form data:', { title, slug, content: content.substring(0, 100), published })

    if (!user) {
      setError('You must be logged in')
      setIsSaving(false)
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      setIsSaving(false)
      return
    }

    if (!slug.trim()) {
      setError('Slug is required')
      setIsSaving(false)
      return
    }

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      content: content || '',
      excerpt: excerpt?.trim() || null,
      cover_image: coverImage?.trim() || null,
      published,
      author_id: user.id,
      updated_at: new Date().toISOString(),
    }

    try {
      if (isEditing && id) {
        console.log('Updating post:', id)
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id)
          .select()

        console.log('Update response:', { data, error })

        if (error) {
          console.error('Update error:', error)
          setError(error.message)
          setIsSaving(false)
          return
        }
      } else {
        console.log('Inserting new post')
        const { data, error } = await supabase
          .from('posts')
          .insert({
            ...postData,
            created_at: new Date().toISOString(),
          })
          .select()

        console.log('Insert response:', { data, error })

        if (error) {
          console.error('Insert error:', error)
          setError(error.message)
          setIsSaving(false)
          return
        }
      }

      console.log('Success! Navigating to /admin/posts')
      navigate('/admin/posts')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="editor-loading">Loading...</div>
  }

  return (
    <div className="post-editor">
      <header className="editor-header">
        <h1>{isEditing ? 'Edit Post' : 'New Post'}</h1>
        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
          >
            Preview
          </button>
        </div>
      </header>

      {error && <div className="editor-error">{error}</div>}

      {viewMode === 'preview' ? (
        <div className="preview-container">
          <div className="preview-content">
            <article className="preview-article">
              {coverImage && (
                <img src={coverImage} alt={title} className="preview-cover" />
              )}
              <h1 className="preview-title">{title || 'Untitled Post'}</h1>
              {excerpt && <p className="preview-excerpt">{excerpt}</p>}
              <div className="preview-body">
                <MDXRenderer content={content} />
              </div>
            </article>
          </div>
          <div className="preview-actions">
            <button
              type="button"
              className="back-to-edit-btn"
              onClick={() => setViewMode('edit')}
            >
              ← Back to Editor
            </button>
            <button
              type="button"
              className="save-button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="editor-form">
          <div className="form-main">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
                required
              />
            </div>

            <div className="form-group">
              <label>Content</label>
              <div className="mdx-editor-wrapper">
                <MDXEditor
                  key={isEditing ? id : 'new'}
                  markdown={content}
                  onChange={handleEditorChange}
                  plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin(),
                    tablePlugin(),
                    codeBlockPlugin(),
                    codeMirrorPlugin({
                      codeBlockLanguages: {
                        js: 'JavaScript',
                        javascript: 'JavaScript',
                        ts: 'TypeScript',
                        typescript: 'TypeScript',
                        jsx: 'JSX',
                        tsx: 'TSX',
                        css: 'CSS',
                        html: 'HTML',
                        json: 'JSON',
                        python: 'Python',
                        bash: 'Bash',
                        shell: 'Shell',
                        sql: 'SQL',
                        go: 'Go',
                        rust: 'Rust',
                      },
                    }),
                    frontmatterPlugin(),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <>
                          <UndoRedo />
                          <BlockTypeSelect />
                          <BoldItalicUnderlineToggles />
                          <CodeToggle />
                          <ListsToggle />
                          <CreateLink />
                          <InsertImage />
                          <InsertTable />
                          <InsertThematicBreak />
                        </>
                      ),
                    }),
                  ]}
                  contentEditableClassName="mdx-content-editable"
                />
              </div>
            </div>
          </div>

          <div className="form-sidebar">
            <div className="sidebar-section">
              <h3>Publish</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <span>Published</span>
              </label>
              <div className="publish-actions">
                <button type="submit" className="save-button" disabled={isSaving}>
                  {isSaving ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Excerpt</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description for previews..."
                rows={4}
              />
            </div>

            <div className="sidebar-section">
              <h3>Cover Image</h3>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {coverImage && (
                <img src={coverImage} alt="Cover preview" className="cover-preview" />
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
