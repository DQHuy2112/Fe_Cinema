'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiUrl } from '@/app/lib/api';

interface AdminComment {
  id: number;
  content: string;
  rating: number | null;
  created_at: string;
  movie_id: number;
  user_id: number;
  user: { id: number; username: string; email: string } | null;
  movie: { id: number; title: string; thumbnail: string | null } | null;
}

export default function AdminComments() {
  const { token } = useAuth();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchComments = async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      const res = await fetch(apiUrl(`/admin/comments?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.data || []);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchComments(1);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchComments(newPage);
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    setDeleting(commentId);
    try {
      const res = await fetch(apiUrl(`/comments/${commentId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(data.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Xóa thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Bình luận</h1>
        <span className="text-sm text-gray-500">{pagination.total} bình luận</span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung bình luận hoặc tên phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bình luận</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.movie ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {comment.movie.thumbnail && (
                                <img
                                  src={comment.movie.thumbnail}
                                  alt={comment.movie.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 line-clamp-2 max-w-[150px]">
                              {comment.movie.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Phim đã xóa</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{comment.user?.username || 'Đã xóa'}</p>
                          <p className="text-xs text-gray-500">{comment.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 max-w-xs line-clamp-3">{comment.content}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.rating ? (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{comment.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleting === comment.id}
                          className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                        >
                          {deleting === comment.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {comments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Chưa có bình luận nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded border text-sm ${pagination.page === i + 1 ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
