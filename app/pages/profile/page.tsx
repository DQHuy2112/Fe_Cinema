'use client';

import { useState } from 'react';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('favorites');

  const favoriteMovies = [
    { id: '1', title: 'Avengers: Endgame', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop', rating: 9.2, year: 2019, genre: 'Hành động' },
    { id: '2', title: 'Spider-Man: No Way Home', poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop', rating: 8.9, year: 2021, genre: 'Siêu anh hùng' },
    { id: '3', title: 'The Batman', poster: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop', rating: 8.5, year: 2022, genre: 'Hành động' },
    { id: '4', title: 'Dune: Part Two', poster: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop', rating: 8.8, year: 2024, genre: 'Khoa học viễn tưởng' },
    { id: '5', title: 'Oppenheimer', poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', rating: 9.1, year: 2023, genre: 'Tiểu sử' },
  ];

  const watchHistory = [
    { id: '6', title: 'Barbie', poster: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=400&h=600&fit=crop', rating: 7.8, year: 2023, genre: 'Hài hước', watchedAt: '2 giờ trước' },
    { id: '7', title: 'Guardians of the Galaxy Vol. 3', poster: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop', rating: 8.2, year: 2023, genre: 'Hành động', watchedAt: '1 ngày trước' },
    { id: '8', title: 'The Flash', poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop', rating: 7.5, year: 2023, genre: 'Siêu anh hùng', watchedAt: '3 ngày trước' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Profile Header */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-5xl font-bold">U</span>
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center border-2 border-black">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">Người dùng</h1>
              <p className="text-gray-400 mb-4">user@example.com</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  <span className="text-white font-bold text-xl">{favoriteMovies.length}</span>
                  <span className="text-gray-400 ml-2">Yêu thích</span>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  <span className="text-white font-bold text-xl">{watchHistory.length}</span>
                  <span className="text-gray-400 ml-2">Đã xem</span>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  <span className="text-white font-bold text-xl">12</span>
                  <span className="text-gray-400 ml-2">Bình luận</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="md:ml-auto bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors">
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'favorites' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Phim yêu thích
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Lịch sử xem
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'reviews' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Đánh giá của tôi
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'settings' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Cài đặt
            </button>
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Phim yêu thích</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {favoriteMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    poster={movie.poster}
                    rating={movie.rating}
                    year={movie.year}
                    genre={movie.genre}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Lịch sử xem</h2>
              <div className="space-y-4">
                {watchHistory.map((movie) => (
                  <div key={movie.id} className="flex gap-4 p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-32 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={movie.poster} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{movie.title}</h3>
                      <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {movie.rating}
                        </span>
                        <span>{movie.year}</span>
                        <span>{movie.genre}</span>
                      </div>
                      <p className="text-gray-500 text-sm mt-2">Xem {movie.watchedAt}</p>
                    </div>
                    <button className="self-center text-gray-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Đánh giá của tôi</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&h=100&fit=crop" 
                      alt="Movie"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="text-white font-medium">Avengers: Endgame</h3>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Một bộ phim hoàn hảo để kết thúc saga Avengers. Các nhân vật được phát triển đầy đủ, 
                    kỹ xảo tuyệt vời và cảm xúc mãnh liệt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Cài đặt tài khoản</h2>
              <div className="max-w-2xl space-y-6">
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Thông tin cá nhân</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Họ và tên</label>
                      <input
                        type="text"
                        defaultValue="Người dùng"
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue="user@example.com"
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Bảo mật</h3>
                  <div className="space-y-4">
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-left transition-colors">
                      Đổi mật khẩu
                    </button>
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-left transition-colors">
                      Bật xác thực hai yếu tố
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Tùy chọn</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Nhận email thông báo</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 bg-gray-800 border-gray-700 rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Nhận email khuyến mãi</span>
                      <input type="checkbox" className="w-5 h-5 bg-gray-800 border-gray-700 rounded" />
                    </label>
                  </div>
                </div>

                <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
