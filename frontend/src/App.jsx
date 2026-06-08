


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import store from './store/index';
import AppLayout from './components/common/AppLayout';


import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Upload from './pages/Upload';
import Chat from './pages/Chat';
import Compare from './pages/Compare';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,


      gcTime: 10 * 60 * 1000,
    },
  },
});


function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
}


function PublicRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}


function AppRoutes() {
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          {}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
          <Route path="/documents/:id" element={<AppLayout><DocumentDetail /></AppLayout>} />
          <Route path="/documents/:id/chat" element={<AppLayout><Chat /></AppLayout>} />
          <Route path="/upload" element={<AppLayout><Upload /></AppLayout>} />
          <Route path="/chat" element={<AppLayout><Chat /></AppLayout>} />
          <Route path="/compare" element={<AppLayout><Compare /></AppLayout>} />

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {}
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

    <Provider store={store}>
      {}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
