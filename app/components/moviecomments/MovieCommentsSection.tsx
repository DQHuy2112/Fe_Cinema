'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { commentApi } from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

export interface MovieComment {
  id: number;
  content: string;
  rating?: number;
  created_at?: string;
  createdAt: string;
  user: { id: number; username: string };
}

interface MovieCommentsSectionProps {
  movieId: number;
  variant?: 'dark' | 'light';
  heading?: string;
}

export default function MovieCommentsSection({
  movieId,
  variant = 'light',
  heading = 'Đánh giá',
}: MovieCommentsSectionProps) {
  const { user, token } = useAuth();
  const isDark = variant === 'dark';

  const [comments, setComments] = useState<MovieComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;
    setCommentsLoading(true);
    commentApi
      .getComments(movieId)
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => setCommentsLoading(false));
  }, [movieId]);

  const handleSubmitComment = async () => {
    if (!token) return;
    if (!commentContent.trim() && commentRating === 0) {
      setCommentError('Vui lòng nhập nội dung hoặc chọn số sao đánh giá.');
      return;
    }
    setSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(null);
    try {
      const newComment = await commentApi.addComment(
        movieId,
        commentContent.trim(),
        commentRating > 0 ? commentRating : undefined,
        token
      );
      setComments((prev) => [newComment as unknown as MovieComment, ...prev]);
      setCommentContent('');
      setCommentRating(0);
      setCommentSuccess('Đánh giá đã được gửi!');
      setTimeout(() => setCommentSuccess(null), 3000);
    } catch (e: unknown) {
      setCommentError(e instanceof Error ? e.message : 'Gửi đánh giá thất bại.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await commentApi.deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Xóa đánh giá thất bại.');
    }
  };

  const cardForm = isDark
    ? 'bg-gray-800/80 rounded-lg p-4 mb-6'
    : 'bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6';
  const titleCls = isDark ? 'text-white font-medium mb-3' : 'text-gray-900 font-semibold mb-3 text-lg';
  const starEmpty = isDark ? 'text-gray-600 hover:text-yellow-300' : 'text-gray-300 hover:text-yellow-400';
  const starFill = 'text-yellow-400';
  const textareaCls = isDark
    ? 'w-full bg-gray-900/60 text-white placeholder-gray-500 rounded-lg px-4 py-3 border border-gray-700 focus:border-red-500 focus:outline-none resize-none text-sm'
    : 'w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-3 border border-gray-200 focus:border-red-500 focus:outline-none resize-none text-sm';
  const metaCls = isDark ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs';
  const errCls = isDark ? 'text-red-400 text-sm' : 'text-red-600 text-sm';
  const okCls = isDark ? 'text-green-400 text-sm' : 'text-green-600 text-sm';
  const itemCard = isDark ? 'bg-gray-800/80 rounded-lg p-4 mb-4' : 'bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200';
  const usernameCls = isDark ? 'text-white font-medium text-sm' : 'text-gray-900 font-medium text-sm';
  const dateCls = isDark ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs';
  const contentCls = isDark ? 'text-gray-300 text-sm whitespace-pre-wrap' : 'text-gray-700 text-sm whitespace-pre-wrap';
  const emptyCls = isDark ? 'text-gray-400' : 'text-gray-500';
  const loginBox = isDark
    ? 'bg-gray-800/80 rounded-lg p-4 mb-6 text-center'
    : 'bg-gray-50 rounded-xl p-6 mb-6 text-center border border-gray-200';

  return (
    <section className="scroll-mt-24" id="movie-reviews">
      <h2 className={isDark ? 'text-white text-xl font-semibold mb-4' : 'text-gray-900 text-xl font-bold mb-4'}>
        {heading} ({comments.length})
      </h2>

      {user ? (
        <div className={cardForm}>
          <h3 className={titleCls}>Viết đánh giá của bạn</h3>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCommentRating(star === commentRating ? 0 : star)}
                className="text-2xl transition-colors"
              >
                <svg
                  className={`w-7 h-7 ${star <= commentRating ? starFill : starEmpty}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            {commentRating > 0 && (
              <span className={`${metaCls} ml-2`}>{commentRating}/5</span>
            )}
          </div>

          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
            rows={3}
            className={textareaCls}
            maxLength={2000}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <span className={metaCls}>{commentContent.length}/2000</span>
            <div className="flex flex-wrap items-center gap-3 justify-end">
              {commentError && <span className={errCls}>{commentError}</span>}
              {commentSuccess && <span className={okCls}>{commentSuccess}</span>}
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={submittingComment || (!commentContent.trim() && commentRating === 0)}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submittingComment ? 'Đang gửi…' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={loginBox}>
          <p className={emptyCls}>
            <Link href="/pages/auth" className="text-red-600 hover:text-red-700 underline">
              Đăng nhập
            </Link>{' '}
            để viết đánh giá.
          </p>
        </div>
      )}

      {commentsLoading ? (
        <p className={emptyCls}>Đang tải đánh giá…</p>
      ) : comments.length === 0 ? (
        <p className={emptyCls}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
      ) : (
        comments.map((comment) => {
          const created = comment.created_at || comment.createdAt;
          const dateStr = created
            ? new Date(created).toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const canDelete = user && (user.id === comment.user.id || user.role === 'admin');
          return (
            <div key={comment.id} className={itemCard}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <span className={usernameCls}>{comment.user?.username || 'Người dùng'}</span>
                    {dateStr && <p className={dateCls}>{dateStr}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comment.rating ? (
                    <div className="flex items-center gap-0.5 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= comment.rating! ? 'opacity-100' : 'opacity-25'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  ) : null}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors ml-2"
                      title="Xóa đánh giá"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className={contentCls}>{comment.content}</p>
            </div>
          );
        })
      )}
    </section>
  );
}
