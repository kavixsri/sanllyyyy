import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppShell from './components/layout/AppShell';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import TherapistSignup from './pages/auth/TherapistSignup';
import Onboarding from './pages/auth/Onboarding';

// App pages
import Chat from './pages/Chat';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import TherapistProfile from './pages/TherapistProfile';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import CrisisHelp from './pages/CrisisHelp';

// Role-specific pages
import TherapistDashboard from './pages/therapist/TherapistDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--color-surface)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--color-primary-200)',
            borderTopColor: 'var(--color-primary-500)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/chat" replace />;

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/chat" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
      <Route path="/signup/therapist" element={<PublicOnlyRoute><TherapistSignup /></PublicOnlyRoute>} />

      {/* Crisis page — always accessible */}
      <Route path="/crisis" element={<CrisisHelp />} />

      {/* Protected app routes */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="chat" element={<Chat />} />
        <Route path="communities" element={<Communities />} />
        <Route path="communities/:id" element={<CommunityDetail />} />
        <Route path="therapists/:id" element={<TherapistProfile />} />
        <Route path="book/:therapistId" element={<Booking />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="profile" element={<Profile />} />

        {/* Therapist-only */}
        <Route
          path="therapist/dashboard"
          element={
            <ProtectedRoute allowedRoles={['therapist']}>
              <TherapistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin-only */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
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
