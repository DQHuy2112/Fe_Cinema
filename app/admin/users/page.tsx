'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiUrl } from '@/app/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchUsers = async (page = 1) => {
    try {
      const res = await fetch(
        apiUrl(
          `/admin/users?page=${page}&limit=${pagination.limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
        ),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers(1);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchUsers(newPage);
  };

  const handleToggleBan = async (user: User) => {
    if (!confirm(`Bạn có chắc chắn muốn ${user.is_active ? 'khóa' : 'mở khóa'} người dùng này?`)) return;
    try {
      const res = await fetch(apiUrl(`/admin/users/${user.id}/ban`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers(pagination.page);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Failed to toggle ban:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleChangeRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Bạn có chắc chắn muốn thay đổi vai trò của ${user.username} thành ${newRole === 'admin' ? 'Admin' : 'User'}?`)) return;
    try {
      const res = await fetch(apiUrl(`/admin/users/${user.id}/role`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers(pagination.page);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
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

      {/* Users Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                              <img
                                src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8080${user.avatar}`}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleChangeRole(user)}
                              className={`${user.role === 'admin' ? 'text-yellow-600 hover:text-yellow-900' : 'text-purple-600 hover:text-purple-900'}`}
                              title={user.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                            >
                              {user.role === 'admin' ? 'Hạ User' : 'Nâng Admin'}
                            </button>
                            <button
                              onClick={() => handleToggleBan(user)}
                              className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            >
                              {user.is_active ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="text-gray-400 text-xs italic">Tài khoản của bạn</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Chưa có người dùng nào</td>
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
