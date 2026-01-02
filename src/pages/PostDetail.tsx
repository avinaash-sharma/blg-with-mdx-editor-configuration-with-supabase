import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Post } from '../types/database'
import { MDXRenderer } from '../components/MDXRenderer'
import './PostDetail.css'

export function PostDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchPost(slug)
    }
  }, [slug])

  async function fetchPost(postSlug: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', postSlug)
      .eq('published', true)
      .single()

    if (error || !data) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    setPost(data)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="post-detail">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="post-detail">
        <div className="not-found">
          <h1>Post Not Found</h1>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="post-detail">
      <article className="post-article">
        <header className="post-header">
          <Link to="/" className="back-link">← Back to Blog</Link>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <time>{new Date(post.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</time>
          </div>
        </header>

        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="post-cover" />
        )}

        <div className="post-body">
          <MDXRenderer content={post.content} />
        </div>
      </article>
    </div>
  )
}
