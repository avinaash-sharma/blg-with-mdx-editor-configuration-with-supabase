import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { PostDetail } from './pages/PostDetail'
import { Login } from './pages/admin/Login'
import { AdminLayout } from './pages/admin/AdminLayout'
import { Dashboard } from './pages/admin/Dashboard'
import { PostsList } from './pages/admin/PostsList'
import { PostEditor } from './pages/admin/PostEditor'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<PostsList />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/:id" element={<PostEditor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
