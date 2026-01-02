import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Dashboard.css'

interface Stats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalPosts: 0, publishedPosts: 0, draftPosts: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('published')

    if (error) {
      console.error('Error fetching stats:', error)
      setIsLoading(false)
      return
    }

    const published = posts?.filter(p => p.published).length || 0
    const drafts = posts?.filter(p => !p.published).length || 0

    setStats({
      totalPosts: posts?.length || 0,
      publishedPosts: published,
      draftPosts: drafts,
    })
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="dashboard-loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/admin/posts/new" className="new-post-button">
          + New Post
        </Link>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📄</span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPosts}</span>
            <span className="stat-label">Total Posts</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{stats.publishedPosts}</span>
            <span className="stat-label">Published</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-content">
            <span className="stat-value">{stats.draftPosts}</span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/posts/new" className="action-card">
            <span className="action-icon">✍️</span>
            <span className="action-label">Write New Post</span>
          </Link>
          <Link to="/admin/posts" className="action-card">
            <span className="action-icon">📋</span>
            <span className="action-label">Manage Posts</span>
          </Link>
          <Link to="/" className="action-card" target="_blank">
            <span className="action-icon">👁️</span>
            <span className="action-label">View Blog</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
