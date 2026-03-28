'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiUrl, uploadThumbnail, uploadVideo, vsMovSearch, vsMovGetMovie, vsMovImportMovie, VSMOVSearchItem, VSMOVMovieDetail } from '@/app/lib/api';

interface Movie {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  trailer: string;
  video: string;
  duration: number;
  release_year: number;
  country: string;
  actors: string;
  director: string;
  rating: number;
  views: number;
  is_active: boolean;
  categories: any[];
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminMovies() {
  const { token } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>('url');
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoDragOver, setVideoDragOver] = useState(false);

  // VSMOV Search Modal
  const [showVsMovModal, setShowVsMovModal] = useState(false);
  const [vsMovQuery, setVsMovQuery] = useState('');
  const [vsMovResults, setVsMovResults] = useState<VSMOVSearchItem[]>([]);
  const [vsMovLoading, setVsMovLoading] = useState(false);
  const [vsMovImporting, setVsMovImporting] = useState(false);
  const [vsMovImportingSlug, setVsMovImportingSlug] = useState<string | null>(null);
  const [vsMovPreview, setVsMovPreview] = useState<VSMOVMovieDetail | null>(null);
  const [vsMovError, setVsMovError] = useState('');

  const handleVsMovSearch = useCallback(async (keyword: string) => {
    if (!token || keyword.trim().length < 2) return;
    setVsMovLoading(true);
    setVsMovError('');
    try {
      const results = await vsMovSearch(keyword.trim(), token);
      setVsMovResults(results);
    } catch (err: unknown) {
      setVsMovError(err instanceof Error ? err.message : 'Tìm kiếm thất bại');
    } finally {
      setVsMovLoading(false);
    }
  }, [token]);

  const handleVsMovPreview = async (slug: string) => {
    if (!token) return;
    setVsMovPreview(null);
    setVsMovImportingSlug(slug);
    try {
      const detail = await vsMovGetMovie(slug, token);
      setVsMovPreview(detail);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không lấy được chi tiết phim');
    } finally {
      setVsMovImportingSlug(null);
    }
  };

  const handleVsMovImport = async (slug: string) => {
    if (!token) return;
    if (!confirm('Import phim này từ VSMOV vào database?')) return;
    setVsMovImporting(true);
    try {
      const movie = await vsMovImportMovie(slug, token);
      alert('Import thành công!');
      setShowVsMovModal(false);
      setVsMovPreview(null);
      setVsMovQuery('');
      setVsMovResults([]);
      setShowModal(false);
      await fetchMovies(pagination.page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Import thất bại');
    } finally {
      setVsMovImporting(false);
    }
  };

  const handleVsMovFillForm = () => {
    if (!vsMovPreview) return;
    const detail = vsMovPreview;
    setThumbnailMode('url');
    setFormData({
      title: detail.name,
      description: detail.content || '',
      thumbnail: detail.poster_url || detail.thumb_url || '',
      trailer: detail.trailer_url || '',
      video: '',
      duration: detail.time ? String(parseInt(detail.time, 10)) : '',
      release_year: detail.year ? String(detail.year) : '',
      country: detail.country?.[0]?.name || '',
      actors: detail.actor?.join(', ') || '',
      director: detail.director?.join(', ') || '',
      rating: detail.tmdb?.vote_average ? String(parseFloat(detail.tmdb.vote_average)) : '',
      category_ids: [],
    });
    setShowVsMovModal(false);
    setVsMovPreview(null);
    setVsMovQuery('');
    setVsMovResults([]);
  };

  const handleThumbnailFile = async (file: File) => {
    if (!token) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận ảnh: JPG, PNG, GIF, WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh tối đa 5MB');
      return;
    }
    setThumbnailUploading(true);
    try {
      const { url } = await uploadThumbnail(file, token);
      setFormData((prev) => ({ ...prev, thumbnail: url }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tải ảnh thất bại');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    if (!token) return;
    const allowed = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/x-m4v'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận video: MP4, WebM, MKV');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert('Video tối đa 500MB');
      return;
    }
    setVideoUploading(true);
    try {
      const { url } = await uploadVideo(file, token);
      setFormData((prev) => ({ ...prev, video: url }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tải video thất bại');
    } finally {
      setVideoUploading(false);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    trailer: '',
    video: '',
    duration: '',
    release_year: '',
    country: '',
    actors: '',
    director: '',
    rating: '',
    category_ids: [] as number[],
  });

  const fetchMovies = async (page = 1) => {
    try {
      const res = await fetch(
        apiUrl(
          `/movies?page=${page}&limit=${pagination.limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
        ),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setMovies(data.data);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(apiUrl('/categories'));
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchCategories();
  }, [token]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchMovies(1);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchMovies(newPage);
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setThumbnailMode('url');
    setVideoMode('url');
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      trailer: '',
      video: '',
      duration: '',
      release_year: '',
      country: '',
      actors: '',
      director: '',
      rating: '',
      category_ids: [],
    });
    setShowModal(true);
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setThumbnailMode(movie.thumbnail?.startsWith('/uploads/') ? 'upload' : 'url');
    setVideoMode(movie.video?.startsWith('/uploads/') ? 'upload' : 'url');
    setFormData({
      title: movie.title,
      description: movie.description || '',
      thumbnail: movie.thumbnail || '',
      trailer: movie.trailer || '',
      video: movie.video || '',
      duration: movie.duration?.toString() || '',
      release_year: movie.release_year?.toString() || '',
      country: movie.country || '',
      actors: movie.actors || '',
      director: movie.director || '',
      rating: movie.rating?.toString() || '',
      category_ids: movie.categories?.map((c: any) => c.id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMovie
        ? apiUrl(`/admin/movies/${editingMovie.id}`)
        : apiUrl('/admin/movies');
      const res = await fetch(url, {
        method: editingMovie ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchMovies(pagination.page);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Failed to save movie:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phim này?')) return;
    try {
      const res = await fetch(apiUrl(`/admin/movies/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchMovies(pagination.page);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleCategoryToggle = (catId: number) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId],
    }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Phim</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVsMovModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm từ VSMOV
          </button>
          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm phim mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
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

      {/* Movies Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt xem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {movie.thumbnail && (
                              <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{movie.title}</p>
                            <p className="text-xs text-gray-500">{movie.country || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movie.release_year || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-sm text-gray-900">
                            {movie.rating != null && Number.isFinite(Number(movie.rating))
                              ? Number(movie.rating).toFixed(1)
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movie.views?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movie.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {movie.is_active ? 'Hoạt động' : 'Khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(movie)} className="text-blue-600 hover:text-blue-900 mr-3">
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(movie.id)} className="text-red-600 hover:text-red-900">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {movies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Chưa có phim nào</td>
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

      {/* VSMOV Search Modal */}
      {showVsMovModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tìm phim từ VSMOV</h2>
                  <p className="text-xs text-gray-500">Tìm kiếm và import phim từ cơ sở dữ liệu VSMOV</p>
                </div>
              </div>
              <button onClick={() => { setShowVsMovModal(false); setVsMovPreview(null); setVsMovQuery(''); setVsMovResults([]); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview panel */}
            {vsMovPreview ? (
              <div className="flex-1 overflow-y-auto p-6">
                <button onClick={() => setVsMovPreview(null)} className="mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại kết quả
                </button>
                <div className="flex gap-6">
                  <div className="w-40 flex-shrink-0">
                    <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-200">
                      <img src={vsMovPreview.poster_url} alt={vsMovPreview.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{vsMovPreview.name}</h3>
                    <p className="text-sm text-gray-500">{vsMovPreview.origin_name}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {vsMovPreview.year && <span className="px-2 py-1 bg-gray-100 rounded">{vsMovPreview.year}</span>}
                      <span className={`px-2 py-1 rounded ${vsMovPreview.type === 'single' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {vsMovPreview.type === 'single' ? 'Phim lẻ' : 'Phim bộ'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">{vsMovPreview.quality}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">{vsMovPreview.lang}</span>
                    </div>
                    {vsMovPreview.tmdb?.vote_average && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-sm font-medium">{vsMovPreview.tmdb.vote_average}</span>
                        <span className="text-xs text-gray-400">({vsMovPreview.tmdb.vote_count.toLocaleString()} đánh giá)</span>
                      </div>
                    )}
                    {vsMovPreview.director?.length > 0 && (
                      <p className="text-sm"><span className="font-medium text-gray-700">Đạo diễn:</span> {vsMovPreview.director.join(', ')}</p>
                    )}
                    {vsMovPreview.actor?.length > 0 && (
                      <p className="text-sm"><span className="font-medium text-gray-700">Diễn viên:</span> {vsMovPreview.actor.slice(0, 5).join(', ')}{vsMovPreview.actor.length > 5 ? '...' : ''}</p>
                    )}
                    {vsMovPreview.category?.length > 0 && (
                      <p className="text-sm"><span className="font-medium text-gray-700">Thể loại:</span> {vsMovPreview.category.map(c => c.name).join(', ')}</p>
                    )}
                    {vsMovPreview.content && (
                      <p className="text-sm text-gray-600 line-clamp-3">{vsMovPreview.content}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleVsMovFillForm}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Điền vào form để chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleVsMovImport(vsMovPreview.slug)}
                        disabled={vsMovImporting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {vsMovImporting ? 'Đang import...' : 'Import trực tiếp'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Search bar */}
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nhập tên phim để tìm kiếm trên VSMOV..."
                      value={vsMovQuery}
                      onChange={(e) => setVsMovQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVsMovSearch(vsMovQuery)}
                      className="flex-1 bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleVsMovSearch(vsMovQuery)}
                      disabled={vsMovLoading || vsMovQuery.trim().length < 2}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {vsMovLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                  </div>
                  {vsMovError && <p className="mt-2 text-sm text-red-600">{vsMovError}</p>}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-6">
                  {vsMovLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                    </div>
                  ) : vsMovResults.length === 0 && vsMovQuery.length >= 2 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                      <p className="text-gray-500">Không tìm thấy phim nào</p>
                      <p className="text-sm text-gray-400 mt-1">Thử từ khóa khác</p>
                    </div>
                  ) : vsMovResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {vsMovResults.map((movie) => (
                        <button
                          key={movie.slug}
                          onClick={() => handleVsMovPreview(movie.slug)}
                          disabled={vsMovImportingSlug === movie.slug}
                          className="group text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-green-500 hover:shadow-md transition-all"
                        >
                          <div className="aspect-[2/3] bg-gray-200 overflow-hidden">
                            <img
                              src={movie.poster_url || 'https://via.placeholder.com/200x300?text=No+Image'}
                              alt={movie.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image'; }}
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">{movie.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{movie.year || 'N/A'}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${movie.type === 'single' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {movie.type === 'single' ? 'Lẻ' : 'Bộ'}
                              </span>
                              {movie.tmdb?.vote_average && (
                                <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  {movie.tmdb.vote_average}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500">Nhập tên phim để tìm kiếm</p>
                      <p className="text-sm text-gray-400 mt-1">Tìm kiếm từ cơ sở dữ liệu VSMOV</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Movie Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingMovie ? 'Sửa phim' : 'Thêm phim mới'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setThumbnailMode('url')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailMode === 'url' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Nhập URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailMode('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailMode === 'upload' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Tải từ máy
                  </button>
                </div>
                {thumbnailMode === 'url' ? (
                  <input
                    type="text"
                    placeholder="Dán URL ảnh (ví dụ: https://example.com/image.jpg)"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                  />
                ) : (
                  <div className="space-y-2">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        thumbnailDragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setThumbnailDragOver(true);
                      }}
                      onDragLeave={() => setThumbnailDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setThumbnailDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && !thumbnailUploading) handleThumbnailFile(file);
                      }}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        disabled={thumbnailUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailFile(file);
                          e.target.value = '';
                        }}
                      />
                      <span className="text-sm text-gray-500">
                        {thumbnailUploading ? 'Đang tải lên...' : 'Kéo thả ảnh vào đây hoặc bấm để chọn'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (tối đa 5MB)</span>
                    </label>
                  </div>
                )}
                {formData.thumbnail && (
                  <div className="mt-3 flex items-start gap-3">
                    <div className="w-24 h-32 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={formData.thumbnail}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: '' })}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${videoMode === 'url' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Nhập URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${videoMode === 'upload' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Tải từ máy (phát trực tiếp)
                    </button>
                  </div>
                  {videoMode === 'url' ? (
                    <div>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=... hoặc https://drive.google.com/... hoặc https://example.com/video.mp4"
                        value={formData.video}
                        onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                        className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-400">Hỗ trợ: YouTube embed, Google Drive, MP4/WebM direct URL, iframe URL</p>
                      {!formData.video && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Hoặc nhập IMDB ID (vd: tt0848228):</span>
                          <input
                            type="text"
                            placeholder="tt0848228"
                            id="imdb-quick"
                            className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) setFormData({ ...formData, video: `https://www.2embed.cc/embed/${val}` });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('imdb-quick') as HTMLInputElement;
                              const val = input?.value?.trim();
                              if (val) {
                                setFormData({ ...formData, video: `https://www.2embed.cc/embed/${val}` });
                                input.value = '';
                              } else alert('Nhập IMDB ID (vd: tt0848228)');
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Tạo link 2embed
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          videoDragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setVideoDragOver(true);
                        }}
                        onDragLeave={() => setVideoDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setVideoDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && !videoUploading) handleVideoFile(file);
                        }}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/x-matroska,video/x-m4v,.mp4,.webm,.mkv,.m4v"
                          className="hidden"
                          disabled={videoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVideoFile(file);
                            e.target.value = '';
                          }}
                        />
                        <span className="text-sm text-gray-500">
                          {videoUploading ? 'Đang tải video lên...' : 'Kéo thả video vào đây hoặc bấm để chọn'}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">MP4, WebM, MKV (tối đa 500MB) - phát trực tiếp từ web local</span>
                      </label>
                    </div>
                  )}
                  {formData.video && (
                    <p className="mt-2 text-sm text-gray-600 truncate" title={formData.video}>
                      URL: {formData.video}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trailer URL</label>
                  <input type="text" value={formData.trailer} onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm phát hành</label>
                  <input type="number" value={formData.release_year} onChange={(e) => setFormData({ ...formData, release_year: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
                  <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá (0-5)</label>
                  <input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đạo diễn</label>
                  <input type="text" value={formData.director} onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diễn viên</label>
                <input type="text" placeholder="Các diễn viên, cách nhau bởi dấu phẩy" value={formData.actors} onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thể loại</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${formData.category_ids.includes(cat.id) ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-red-500'}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Hủy
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors">
                  {editingMovie ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
