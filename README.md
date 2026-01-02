# Blog Client

A modern, full-featured blog platform built with React 19, featuring a public-facing blog and an admin Content Management System (CMS).

## Features

### Public Blog
- Browse all published blog posts in a responsive grid layout
- View individual posts with full MDX content rendering
- Cover images, excerpts, and publication dates

### Admin CMS
- Secure email/password authentication
- Dashboard with post statistics (total, published, drafts)
- Full post management (create, edit, delete, publish/unpublish)
- Rich text editor with MDX support
- Live preview mode for content editing

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.0 |
| Build Tool | Vite 7.2.4 |
| Language | TypeScript 5.9.3 |
| Routing | React Router DOM 7.10.1 |
| Backend/Auth | Supabase 2.87.1 |
| Editor | MDXEditor 3.52.3 |
| Testing | Playwright 1.57.0 |

## Project Structure

```
src/
├── components/
│   ├── ProtectedRoute.tsx    # Auth guard for admin routes
│   └── MDXRenderer.tsx       # MDX content renderer
├── context/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── types/
│   └── database.ts           # TypeScript database types
├── pages/
│   ├── Home.tsx              # Public blog listing
│   ├── PostDetail.tsx        # Single post view
│   └── admin/
│       ├── Login.tsx         # Admin login
│       ├── AdminLayout.tsx   # Admin shell with sidebar
│       ├── Dashboard.tsx     # Admin dashboard
│       ├── PostsList.tsx     # Post management table
│       └── PostEditor.tsx    # Post create/edit form
├── App.tsx                   # Router configuration
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Testing

Run E2E tests with Playwright UI:
```bash
npm run test:ui
```

### Linting

Check code quality:
```bash
npm run lint
```

## Database Schema

### Posts Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Post title |
| content | text | MDX content |
| slug | text | URL-friendly identifier |
| excerpt | text | Short description |
| cover_image | text | Cover image URL |
| published | boolean | Visibility flag |
| author_id | uuid | Foreign key to profiles |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update date |

### Profiles Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (linked to auth.users) |
| username | text | User's username |
| full_name | text | Display name |
| avatar_url | text | Profile picture URL |
| bio | text | User biography |
| role | text | User role (admin/user) |
| created_at | timestamp | Account creation date |

## Routes

### Public Routes
| Path | Description |
|------|-------------|
| `/` | Home page - blog post listing |
| `/post/:slug` | Individual post view |

### Admin Routes (Protected)
| Path | Description |
|------|-------------|
| `/admin/login` | Admin login page |
| `/admin` | Admin dashboard |
| `/admin/posts` | Posts management |
| `/admin/posts/new` | Create new post |
| `/admin/posts/:id` | Edit existing post |

## Editor Features

The post editor includes a full-featured MDX toolbar:
- Text formatting (bold, italic, underline)
- Headings (H1-H6)
- Lists (ordered, unordered)
- Block quotes
- Links and images
- Tables
- Code blocks with syntax highlighting
- Undo/Redo

## Authentication

- Email/password authentication via Supabase Auth
- Role-based access control (admin role required for CMS)
- Protected routes with automatic redirects
- Persistent sessions with automatic recovery

## License

MIT
