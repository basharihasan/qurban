import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';

// Mudhohi
import MudhohiDashboard from './pages/mudhohi/Dashboard';
import DeliveryConfirmation from './pages/mudhohi/DeliveryConfirmation';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAnimals from './pages/admin/Animals';
import AdminDistributions from './pages/admin/Distributions';
import AdminImport from './pages/admin/Import';
import AdminReports from './pages/admin/Reports';

// Panitia
import PanitiaDashboard from './pages/panitia/Dashboard';
import PanitiaSlaughter from './pages/panitia/Slaughter';
import PanitiaDistribution from './pages/panitia/Distribution';
import QRScanner from './pages/panitia/QRScanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.first_login) return <Navigate to="/change-password" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'panitia') return <Navigate to="/panitia" replace />;
    return <Navigate to="/mudhohi" replace />;
  }
  return children;
};

// First login route - accessible only when first_login=true
const FirstLoginRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.first_login) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'panitia') return <Navigate to="/panitia" replace />;
    return <Navigate to="/mudhohi" replace />;
  }
  return children;
};

// Public route - redirect if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && !user?.first_login) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'panitia') return <Navigate to="/panitia" replace />;
    return <Navigate to="/mudhohi" replace />;
  }
  return children;
};

function App() {
  const { init } = useThemeStore();

  useEffect(() => {
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/change-password" element={<FirstLoginRoute><ChangePassword /></FirstLoginRoute>} />

          {/* Mudhohi */}
          <Route path="/mudhohi" element={<ProtectedRoute allowedRoles={['mudhohi']}><MudhohiDashboard /></ProtectedRoute>} />
          <Route path="/mudhohi/delivery" element={<ProtectedRoute allowedRoles={['mudhohi']}><DeliveryConfirmation /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/animals" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnimals /></ProtectedRoute>} />
          <Route path="/admin/distributions" element={<ProtectedRoute allowedRoles={['admin']}><AdminDistributions /></ProtectedRoute>} />
          <Route path="/admin/import" element={<ProtectedRoute allowedRoles={['admin']}><AdminImport /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

          {/* Panitia */}
          <Route path="/panitia" element={<ProtectedRoute allowedRoles={['panitia']}><PanitiaDashboard /></ProtectedRoute>} />
          <Route path="/panitia/slaughter" element={<ProtectedRoute allowedRoles={['panitia']}><PanitiaSlaughter /></ProtectedRoute>} />
          <Route path="/panitia/distribution" element={<ProtectedRoute allowedRoles={['panitia']}><PanitiaDistribution /></ProtectedRoute>} />
          <Route path="/panitia/qr-scanner" element={<ProtectedRoute allowedRoles={['panitia']}><QRScanner /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1c1917)',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
