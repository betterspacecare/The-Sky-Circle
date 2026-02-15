'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, MessageCircle, Send, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_comment_id: string | null
  created_at: string
  users: {
    id: string
    display_name: string | null
    profile_photo_url: string | null
  }
  likes_count: number
  is_liked: boolean
  replies_count: number
}

interface CommentsSectionProps {
  postId: string
  currentUserId: string
  initialCommentsCount: number
  onCommentsCountChange?: (count: number) => void
}

export default function CommentsSection({
  postId,
  currentUserId,
  initialCommentsCount,
  onCommentsCountChange
}: CommentsSectionProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      // Fetch top-level comments with user info and like status
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get likes count and user's like status for each comment
      const commentsWithLikes = await Promise.all(
        (data || []).map(async (comment) => {
          const [{ count: likesCount }, { data: userLike }] = await Promise.all([
            supabase
              .from('comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id),
            supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', currentUserId)
              .single()
          ])

          // Get replies count
          const { count: repliesCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('parent_comment_id', comment.id)

          return {
            ...comment,
            likes_count: likesCount || 0,
            is_liked: !!userLike,
            replies_count: repliesCount || 0
          }
        })
      )

      setComments(commentsWithLikes)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_comment_id: null
        })
        .select(`
          *,
          users:user_id (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .single()

      if (error) throw error

      // Add new comment to list
      setComments(prev => [...prev, { ...data, likes_count: 0, is_liked: false, replies_count: 0 }])
      setNewComment('')
      
      // Update comments count
      if (onCommentsCountChange) {
        onCommentsCountChange(initialCommentsCount + 1)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || submitting) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: replyContent.trim(),
          parent_comment_id: parentCommentId
        })
        .select(`
          *,
          users:user_id (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .single()

      if (error) throw error

      // Update replies count for parent comment
      setComments(prev => prev.map(c => 
        c.id === parentCommentId 
          ? { ...c, replies_count: c.replies_count + 1 }
          : c
      ))

      setReplyContent('')
      setReplyingTo(null)
      
      // Refresh to show new reply
      if (showReplies.has(parentCommentId)) {
        fetchReplies(parentCommentId)
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId
        ? { 
            ...c, 
            is_liked: !c.is_liked,
            likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1
          }
        : c
    ))

    try {
      if (comment.is_liked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId)
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUserId
          })
      }
    } catch (error) {
      console.error('Error liking comment:', error)
      // Revert optimistic update
      setComments(prev => prev.map(c => 
        c.id === commentId
          ? { 
              ...c, 
              is_liked: comment.is_liked,
              likes_count: comment.likes_count
            }
          : c
      ))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      
      if (onCommentsCountChange) {
        onCommentsCountChange(initialCommentsCount - 1)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  const fetchReplies = async (parentCommentId: string) => {
    // This would fetch and display replies - simplified for now
    setShowReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentCommentId)) {
        newSet.delete(parentCommentId)
      } else {
        newSet.add(parentCommentId)
      }
      return newSet
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="border-t border-white/10">
      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-4 text-center text-white/40 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Link href={`/dashboard/profile/${comment.user_id}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-blue flex items-center justify-center overflow-hidden flex-shrink-0">
                      {comment.users.profile_photo_url ? (
                        <img
                          src={comment.users.profile_photo_url}
                          alt={comment.users.display_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {(comment.users.display_name || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Link 
                          href={`/dashboard/profile/${comment.user_id}`}
                          className="font-semibold text-sm hover:text-cosmic-purple transition-colors"
                        >
                          {comment.users.display_name || 'Anonymous'}
                        </Link>
                        <p className="text-sm text-white/90 mt-1">{comment.content}</p>
                      </div>
                      
                      {/* Delete button for own comments */}
                      {comment.user_id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span>{formatTimeAgo(comment.created_at)}</span>
                      
                      {comment.likes_count > 0 && (
                        <span className="font-medium">
                          {comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}
                        </span>
                      )}
                      
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="font-medium hover:text-white/60 transition-colors"
                      >
                        Reply
                      </button>

                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`transition-colors ${
                          comment.is_liked ? 'text-red-400' : 'hover:text-white/60'
                        }`}
                      >
                        <Heart className={`w-4 h-4 inline ${comment.is_liked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* View Replies */}
                    {comment.replies_count > 0 && (
                      <button
                        onClick={() => fetchReplies(comment.id)}
                        className="text-xs text-white/40 hover:text-white/60 mt-2 font-medium"
                      >
                        {showReplies.has(comment.id) ? 'Hide' : 'View'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                      </button>
                    )}

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cosmic-purple/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSubmitReply(comment.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim() || submitting}
                          className="px-3 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Comment Input */}
      <form onSubmit={handleSubmitComment} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-cosmic-purple/50"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
