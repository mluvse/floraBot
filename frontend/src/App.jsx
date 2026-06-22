import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Flower2 } from 'lucide-react';

// Lazy-loaded pages for code splitting
const LazyHome = lazy(() => import('./pages/HomePage'));
const LazyRecognize = lazy(() => import('./pages/RecognizePage'));
const LazyCatalog = lazy(() => import('./pages/CatalogPages').then(m => ({ default: m.CatalogPage })));
const LazyTreeDetail = lazy(() => import('./pages/CatalogPages').then(m => ({ default: m.TreeDetailPage })));
const LazyTreeForm = lazy(() => import('./pages/CatalogPages').then(m => ({ default: m.TreeFormPage })));
const LazyProfile = lazy(() => import('./pages/ProfilePage'));
const LazyLogin = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const LazyRegister = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.RegisterPage })));

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-flora-50">
      <div className="text-center">
        <Flower2 size={48} className="mx-auto text-flora-300 animate-spin mb-4" />
        <p className="text-flora-400 font-medium animate-pulse">Загрузка FloraBot...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LazyHome />} />
          <Route path="/recognize" element={<LazyRecognize />} />
          <Route path="/catalog" element={<LazyCatalog />} />
          <Route path="/catalog/new" element={<ProtectedRoute><LazyTreeForm /></ProtectedRoute>} />
          <Route path="/catalog/:id" element={<LazyTreeDetail />} />
          <Route path="/catalog/:id/edit" element={<ProtectedRoute><LazyTreeForm /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><LazyProfile /></ProtectedRoute>} />
          <Route path="/login" element={<LazyLogin />} />
          <Route path="/register" element={<LazyRegister />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
