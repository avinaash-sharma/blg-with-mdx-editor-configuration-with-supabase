import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Post } from '../types/database'
import './Home.css'

export function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      setIsLoading(false)
      return
    }

    setPosts(data || [])
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="home">
        <div className="loading">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="home">
      <header className="blog-header">
        <h1>My Blog</h1>
        <p>Thoughts, stories, and ideas</p>
      </header>

      <main className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <article key={post.id} className="post-card">
                {post.cover_image && (
                  <img src={post.cover_image} alt={post.title} className="post-cover" />
                )}
                <div className="post-content">
                  <h2>
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                  <div className="post-meta">
                    <time>{new Date(post.created_at).toLocaleDateString()}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
