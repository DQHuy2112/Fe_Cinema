This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Backend Prompt - Web Xem Phim

Sử dụng prompt sau để tạo backend cho web xem phim:

---

### PROMPT CHO BACKEND

```
Tạo một backend API hoàn chỉnh cho website xem phim trực tuyến sử dụng Node.js với Express và MySQL (TypeScript).

**LƯU Ý QUAN TRỌNG:**
1. Sử dụng cursor-browser-extension MCP server đã được cấu hình sẵn trong dự án để hỗ trợ các thao tác với database.
2. Khi ứng dụng khởi chạy, hệ thống phải TỰ ĐỘNG KẾT NỐI và TẠO các bảng trong MySQL. Sử dụng `sequelize.sync({ force: false, alter: true })` trong file khởi chạy server (`src/bin/www.ts`) để khi chạy `npm start` hoặc `npm run dev`, các bảng sẽ được TỰ ĐỘNG TẠO trong MySQL nếu chưa tồn tại (hoặc cập nhật cấu trúc nếu đã có).
3. Tất cả code phải được viết bằng TypeScript (.ts), KHÔNG phải JavaScript (.js).
4. Cấu hình database từ file `.env` (dùng `dotenv`).

## Yêu cầu chức năng:

### 1. Authentication & Authorization
- Đăng ký / Đăng nhập với JWT token
- Phân quyền: User thường và Admin
- Refresh token mechanism
- Password hashing với bcrypt

### 2. Quản lý Phim (Admin)
- CRUD phim (Create, Read, Update, Delete)
- Upload/Quản lý thumbnail và trailer
- Quản lý danh mục (categories): Thể loại phim
- Tìm kiếm và lọc phim theo: tên, thể loại, năm, quốc gia
- Phân trang kết quả

### 3. Quản lý User (Admin)
- Danh sách người dùng
- Ban/Unban user
- Phân quyền admin

### 4. User Features
- Xem danh sách phim, chi tiết phim
- Tìm kiếm phim
- Xem phim (streaming)
- Bình luận/review phim
- Yêu thích phim (watchlist)
- Lịch sử xem

### 5. API Endpoints:

#### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/logout

#### Movies (Public)
- GET /api/movies - Danh sách phim (có phân trang, filter)
- GET /api/movies/:id - Chi tiết phim
- GET /api/movies/trending - Phim thịnh hành
- GET /api/movies/search?q= - Tìm kiếm

#### Movies (Admin)
- POST /api/admin/movies - Thêm phim mới
- PUT /api/admin/movies/:id - Cập nhật phim
- DELETE /api/admin/movies/:id - Xóa phim

#### Categories (Public)
- GET /api/categories - Danh sách thể loại
- GET /api/categories/:id/movies - Phim theo thể loại

#### Categories (Admin)
- POST /api/admin/categories
- PUT /api/admin/categories/:id
- DELETE /api/admin/categories/:id

#### User
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/favorites - Danh sách yêu thích
- POST /api/users/favorites/:movieId - Thêm/xóa khỏi yêu thích
- GET /api/users/history - Lịch sử xem
- POST /api/users/history/:movieId - Thêm vào lịch sử

#### Comments
- GET /api/movies/:id/comments
- POST /api/movies/:id/comments
- DELETE /api/comments/:id

### 6. Database Tables (MySQL) - TỰ ĐỘNG TẠO KHI KHỞI CHẠY:

**QUAN TRỌNG:** Trong file `src/bin/www.ts` (entry point), bắt buộc có đoạn code auto-sync sau để khi chạy app, các bảng sẽ TỰ ĐỘNG được tạo/cập nhật trong MySQL:

```typescript
// Tự động kết nối và tạo bảng khi khởi chạy
sequelize.sync({ force: false, alter: true })
  .then(() => {
    console.log('✅ Database & tables created/updated successfully!');
  })
  .catch((err) => {
    console.error('❌ Unable to create tables:', err);
  });
```

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| username | VARCHAR(100) | NOT NULL, UNIQUE |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NOT NULL |
| role | ENUM('user', 'admin') | DEFAULT 'user' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP |

#### movies
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| title | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | NOT NULL, UNIQUE |
| description | TEXT | |
| thumbnail | VARCHAR(500) | |
| trailer | VARCHAR(500) | |
| video | VARCHAR(500) | |
| duration | INT | |
| release_year | INT | |
| country | VARCHAR(100) | |
| actors | TEXT | (JSON array) |
| director | VARCHAR(255) | |
| views | INT | DEFAULT 0 |
| rating | DECIMAL(3,2) | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP |

#### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### movie_categories (junction table)
| Column | Type | Constraints |
|--------|------|-------------|
| movie_id | INT | FOREIGN KEY |
| category_id | INT | FOREIGN KEY |
| PRIMARY KEY | (movie_id, category_id) | |

#### comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INT | FOREIGN KEY |
| movie_id | INT | FOREIGN KEY |
| content | TEXT | NOT NULL |
| rating | TINYINT | CHECK 1-5 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### user_favorites
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | INT | FOREIGN KEY |
| movie_id | INT | FOREIGN KEY |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| PRIMARY KEY | (user_id, movie_id) | |

#### user_watch_history
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INT | FOREIGN KEY |
| movie_id | INT | FOREIGN KEY |
| watched_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### refresh_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INT | FOREIGN KEY |
| token | VARCHAR(500) | NOT NULL |
| expires_at | DATETIME | NOT NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### 7. Công nghệ sử dụng (TypeScript):
- Runtime: Node.js
- Framework: Express.js
- Ngôn ngữ: TypeScript (.ts) - BẮT BUỘC, không dùng .js
- Database: MySQL với Sequelize ORM
- Authentication: JWT + bcrypt
- Validation: express-validator
- File upload: Multer + Cloudinary (hoặc local storage)
- CORS configuration
- Environment: dotenv

### 8. Security:
- Input validation
- Rate limiting
- XSS protection
- SQL injection prevention (dùng parameterized queries qua Sequelize)
- Secure headers với helmet

### 9. Cấu trúc thư mục dự án TỔNG THỂ (TypeScript):

```
DANNPTUD/                          # Thư mục gốc của dự án
├── fe_cinema/                     # Frontend (Next.js) - ĐÃ CÓ
│   ├── app/                       # Next.js App Router
│   ├── components/                # React components
│   ├── package.json
│   └── ...
│
└── be_cinema/                     # Backend (TypeScript) - CẦN TẠO MỚI
    ├── src/
    │   ├── bin/
    │   │   └── www.ts             # Chạy server - TỰ ĐỘNG SYNC DATABASE
    │   ├── app.ts                 # Cấu hình Express (middleware, routes)
    │   ├── config/
    │   │   └── database.ts        # Sequelize config
    │   ├── controllers/            # Logic xử lý
    │   ├── middleware/             # Auth, validation, error handling
    │   ├── schemas/               # Model / cấu trúc dữ liệu (Sequelize)
    │   │   ├── index.ts           # Sequelize instance & associations
    │   │   ├── User.ts
    │   │   ├── Movie.ts
    │   │   ├── Category.ts
    │   │   ├── Comment.ts
    │   │   ├── UserFavorite.ts
    │   │   ├── UserWatchHistory.ts
    │   │   └── RefreshToken.ts
    │   ├── routes/                # API routes
    │   └── utils/                 # Helper functions
    ├── uploads/                   # File tạm (video, image)
    ├── .env                       # Biến môi trường
    ├── package.json               # Backend dependencies
    └── tsconfig.json              # TypeScript config
```

**LƯU Ý:** Backend phải được tạo trong folder `be_cinema/`, TÁCH BIỆT hoàn toàn với `fe_cinema/`. Mỗi folder có package.json riêng, chạy độc lập:
- Frontend: `cd fe_cinema && npm run dev` (port 3000)
- Backend: `cd be_cinema && npm run dev` (port 8080)

### 10. Auto-Sync Database (QUAN TRỌNG - BẮT BUỘC):
Trong file `src/bin/www.ts`, bắt buộc phải có đoạn code sau để TỰ ĐỘNG tạo bảng khi khởi chạy:

```typescript
// Trong hàm startServer() hoặc ngay sau khi import:
sequelize.sync({ force: false, alter: true })
  .then(() => {
    console.log('✅ Database & tables created/updated successfully!');
  })
  .catch((err) => {
    console.error('❌ Unable to create tables:', err);
  });
```

**Điều này đảm bảo:** Mỗi khi chạy `npm run dev` hoặc `npm start`, Sequelize sẽ tự động:
- Kiểm tra các bảng đã tồn tại chưa
- Tạo bảng mới nếu chưa có
- Cập nhật cấu trúc bảng nếu có thay đổi model (mà không xóa dữ liệu)

### 11. Response format:
Luôn trả về JSON với format:
{
  success: Boolean,
  message: String,
  data: Object/Array,
  pagination: Object (nếu có)
}
```

---

### Frontend (Next.js) kết nối với Backend:
- Base URL: http://localhost:8080/api
- Các API calls sử dụng fetch hoặc axios
- Lưu JWT token vào localStorage/cookies
- Protected routes cho admin pages
