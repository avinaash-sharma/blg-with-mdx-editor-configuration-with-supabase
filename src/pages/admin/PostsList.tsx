import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Post } from '../../types/database'
import './PostsList.css'

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      setIsLoading(false)
      return
    }

    setPosts(data || [])
    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
      return
    }

    setPosts(posts.filter(p => p.id !== id))
  }

  async function togglePublish(post: Post) {
    const { error } = await supabase
      .from('posts')
      .update({ published: !post.published })
      .eq('id', post.id)

    if (error) {
      console.error('Error updating post:', error)
      return
    }

    setPosts(posts.map(p =>
      p.id === post.id ? { ...p, published: !p.published } : p
    ))
  }

  if (isLoading) {
    return <div className="posts-loading">Loading posts...</div>
  }

  return (
    <div className="posts-list-page">
      <header className="posts-header">
        <h1>Posts</h1>
        <Link to="/admin/posts/new" className="new-post-button">
          + New Post
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h3>No posts yet</h3>
          <p>Create your first blog post to get started.</p>
          <Link to="/admin/posts/new" className="create-first-button">
            Create First Post
          </Link>
        </div>
      ) : (
        <div className="posts-table-container">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <Link to={`/admin/posts/${post.id}`} className="post-title-link">
                      {post.title}
                    </Link>
                    <span className="post-slug">/{post.slug}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => togglePublish(post)}
                      className={`status-badge ${post.published ? 'published' : 'draft'}`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="date-cell">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <Link to={`/admin/posts/${post.id}`} className="action-btn edit">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="action-btn delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
