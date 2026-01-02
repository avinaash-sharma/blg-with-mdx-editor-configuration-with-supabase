# Blog Project Setup Guide

## Project Overview

A React + Vite + TypeScript blog with Supabase backend and admin CMS.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Routing**: React Router DOM

---

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx      # Route guard for admin pages
│   ├── context/
│   │   └── AuthContext.tsx         # Authentication state management
│   ├── lib/
│   │   └── supabase.ts             # Supabase client configuration
│   ├── pages/
│   │   ├── Home.tsx                # Public blog listing
│   │   ├── Home.css
│   │   ├── PostDetail.tsx          # Individual post view
│   │   ├── PostDetail.css
│   │   └── admin/
│   │       ├── Login.tsx           # Admin login page
│   │       ├── Login.css
│   │       ├── AdminLayout.tsx     # Admin sidebar layout
│   │       ├── AdminLayout.css
│   │       ├── Dashboard.tsx       # Admin dashboard
│   │       ├── Dashboard.css
│   │       ├── PostsList.tsx       # Manage posts list
│   │       ├── PostsList.css
│   │       ├── PostEditor.tsx      # Create/Edit posts
│   │       └── PostEditor.css
│   ├── types/
│   │   └── database.ts             # TypeScript types for Supabase
│   ├── App.tsx                     # Main app with routes
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .env.local                      # Supabase credentials (gitignored)
├── .env.example                    # Template for env vars
└── package.json
```

---

## Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Homepage - displays all published posts |
| `/post/:slug` | Individual post page |

### Admin Routes (Protected)
| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login page |
| `/admin` | Admin dashboard |
| `/admin/posts` | Posts management list |
| `/admin/posts/new` | Create new post |
| `/admin/posts/:id` | Edit existing post |

---

## Supabase Setup

### Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub or email
3. Click **"New Project"**
4. Fill in:
   - **Name**: `blog`
   - **Database Password**: Create strong password (save it!)
   - **Region**: Choose closest to you
5. Wait for project to be created

### Step 2: Get API Keys

1. Go to **Project Settings** (gear icon)
2. Click **"API"** in left menu
3. Copy:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon/public key**: `eyJ...` (long string)

### Step 3: Update Environment Variables

Update `.env.local` with your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Tables

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Run this SQL:

```sql
-- Profiles table with admin role
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  slug text unique not null,
  excerpt text,
  cover_image text,
  published boolean default false,
  author_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table posts enable row level security;

-- Policies for profiles
create policy "Public profiles viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Policies for posts
create policy "Published posts viewable by everyone"
  on posts for select using (published = true);

create policy "Admins can view all posts"
  on posts for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can create posts"
  on posts for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update posts"
  on posts for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete posts"
  on posts for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Step 5: Create Admin User

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **"Add User"** → **"Create new user"**
3. Enter email and password
4. Go to **Table Editor** → **profiles**
5. Find your user and change `role` from `user` to `admin`

---

## Running the Project

### Development
```bash
cd client
npm install
npm run dev
```

App will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

---

## Features

### Public Blog
- View all published posts on homepage
- Read individual posts
- Responsive design

### Admin CMS
- Secure login with Supabase Auth
- Dashboard with post statistics
- Create, edit, delete posts
- Toggle publish/draft status
- Cover image support (URL)
- Auto-generated slugs from title

---

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (from auth.users) |
| username | text | Unique username |
| full_name | text | Display name |
| avatar_url | text | Profile image URL |
| bio | text | User biography |
| role | text | 'admin' or 'user' |
| created_at | timestamptz | Creation timestamp |

### posts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Post title |
| content | text | Post content |
| slug | text | URL-friendly identifier |
| excerpt | text | Short description |
| cover_image | text | Cover image URL |
| published | boolean | Publish status |
| author_id | uuid | Foreign key to profiles |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` has correct values
- Restart dev server after changing env vars

### Can't access admin panel
- Verify user exists in profiles table
- Ensure role is set to 'admin'
- Check browser console for errors

### Posts not showing
- Verify posts have `published = true`
- Check RLS policies are created correctly

---

## Next Steps (Optional Enhancements)

- [ ] Add markdown support for post content
- [ ] Image upload to Supabase Storage
- [ ] Categories/Tags for posts
- [ ] Comments system
- [ ] Search functionality
- [ ] SEO meta tags
- [ ] Dark mode toggle
