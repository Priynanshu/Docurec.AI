// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Root component: sets up Redux Provider, React Query, Router, and routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import store from './store/index';
import AppLayout from './components/common/AppLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Upload from './pages/Upload';
import Chat from './pages/Chat';
import Compare from './pages/Compare';

// React Query setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Keep data in cache for 10 minutes even after component unmounts
      // This means navigating away and back won't lose chat sessions
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Protect routes — redirect to login if not authenticated
function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
}

// Public routes — redirect to dashboard if already logged in
function PublicRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

// Routes are inside a separate component so they can use useSelector (needs Provider above)
function AppRoutes() {
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected pages (need login) */}
          <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><AppLayout><Documents /></AppLayout></PrivateRoute>} />
          <Route path="/documents/:id" element={<PrivateRoute><AppLayout><DocumentDetail /></AppLayout></PrivateRoute>} />
          <Route path="/documents/:id/chat" element={<PrivateRoute><AppLayout><Chat /></AppLayout></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><AppLayout><Upload /></AppLayout></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><AppLayout><Chat /></AppLayout></PrivateRoute>} />
          <Route path="/compare" element={<PrivateRoute><AppLayout><Compare /></AppLayout></PrivateRoute>} />

          {/* Catch all — redirect home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {/* Toast notifications — styled to match dark theme */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#F0F4F8',
            border: '1px solid #2A2A38',
            borderRadius: '8px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22D3EE', secondary: '#111118' } },
          error:   { iconTheme: { primary: '#F87171', secondary: '#111118' } },
          duration: 3500,
        }}
      />
    </>
  );
}

export default function App() {
  return (
    // Redux Provider wraps everything
    <Provider store={store}>
      {/* React Query for data fetching */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
