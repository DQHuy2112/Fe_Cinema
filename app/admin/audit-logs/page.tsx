'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiUrl } from '@/app/lib/api';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_MOVIE: 'bg-green-100 text-green-700',
  UPDATE_MOVIE: 'bg-blue-100 text-blue-700',
  DELETE_MOVIE: 'bg-red-100 text-red-700',
  CREATE_CATEGORY: 'bg-green-100 text-green-700',
  UPDATE_CATEGORY: 'bg-blue-100 text-blue-700',
  DELETE_CATEGORY: 'bg-red-100 text-red-700',
  BAN_USER: 'bg-red-100 text-red-700',
  UNBAN_USER: 'bg-green-100 text-green-700',
  CHANGE_ROLE: 'bg-purple-100 text-purple-700',
  DELETE_COMMENT: 'bg-red-100 text-red-700',
  UPLOAD_THUMBNAIL: 'bg-blue-100 text-blue-700',
  UPLOAD_VIDEO: 'bg-blue-100 text-blue-700',
  IMPORT_VSMOV: 'bg-teal-100 text-teal-700',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_MOVIE: 'Tạo phim',
  UPDATE_MOVIE: 'Sửa phim',
  DELETE_MOVIE: 'Xóa phim',
  CREATE_CATEGORY: 'Tạo thể loại',
  UPDATE_CATEGORY: 'Sửa thể loại',
  DELETE_CATEGORY: 'Xóa thể loại',
  BAN_USER: 'Khóa user',
  UNBAN_USER: 'Mở khóa user',
  CHANGE_ROLE: 'Đổi vai trò',
  DELETE_COMMENT: 'Xóa bình luận',
  UPLOAD_THUMBNAIL: 'Upload thumbnail',
  UPLOAD_VIDEO: 'Upload video',
  IMPORT_VSMOV: 'Import từ VSMOV',
};

const ACTION_OPTIONS = Object.keys(ACTION_LABELS);
const ENTITY_OPTIONS = ['movie', 'user', 'category', 'comment'];

export default function AdminAuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchLogs = async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entity_type', filterEntity);

      const res = await fetch(apiUrl(`/admin/audit-logs?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterAction, filterEntity]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchLogs(newPage);
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
        <h1 className="text-2xl font-bold text-gray-900">Nhật ký Admin</h1>
        <span className="text-sm text-gray-500">{pagination.total} bản ghi</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
              fetchLogs(1);
            }}
            className="bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-sm"
          >
            <option value="">Tất cả hành động</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] || action}
              </option>
            ))}
          </select>
          <select
            value={filterEntity}
            onChange={(e) => {
              setFilterEntity(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
              fetchLogs(1);
            }}
            className="bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-sm"
          >
            <option value="">Tất cả đối tượng</option>
            {ENTITY_OPTIONS.map((entity) => (
              <option key={entity} value={entity}>
                {entity.charAt(0).toUpperCase() + entity.slice(1)}
              </option>
            ))}
          </select>
          {(filterAction || filterEntity) && (
            <button
              onClick={() => {
                setFilterAction('');
                setFilterEntity('');
                fetchLogs(1);
              }}
              className="text-sm text-red-600 hover:underline self-center"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.username}</p>
                          <p className="text-xs text-gray-400">ID: {log.user_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {log.entity_type ? (
                            <span>
                              <span className="font-medium capitalize">{log.entity_type}</span>
                              {log.entity_id ? ` #${log.entity_id}` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {log.details ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:underline">
                              Xem chi tiết
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-gray-600 overflow-auto max-h-24">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Chưa có bản ghi nào
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
