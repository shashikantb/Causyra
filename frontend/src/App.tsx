import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthService, UserService, type User } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard';
import ProjectDashboard from './pages/ProjectDashboard';
import CreateProject from './pages/CreateProject';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import './App.css'; // Keep for legacy styles not yet migrated

// Protected Route Wrapper
const ProtectedRoute = ({ isAuth, isChecking }: { isAuth: boolean; isChecking: boolean }) => {
  if (isChecking) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = AuthService.isAuthenticated();
      if (isAuth) {
        try {
          const user = await UserService.getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Failed to fetch user", e);
          AuthService.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
     try {
       const user = await UserService.getCurrentUser();
       setCurrentUser(user);
       setIsAuthenticated(true);
     } catch (e) {
       console.error("Failed to fetch user after login", e);
     }
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          } />
          
          <Route element={<ProtectedRoute isAuth={isAuthenticated} isChecking={loading} />}>
            <Route element={<DashboardLayout currentUser={currentUser} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/projects/new" element={<CreateProject />} />
              <Route path="/projects/:appId" element={<ProjectDashboard currentUser={currentUser} />} />
              <Route path="/settings" element={<UserManagement currentUser={currentUser!} />} />
              {/* Placeholder for logs/rca if needed, or redirect */}
              <Route path="/logs" element={<div style={{padding: '2rem'}}>Global Logs - Coming Soon</div>} />
              <Route path="/rca" element={<div style={{padding: '2rem'}}>Offline RCA - Coming Soon</div>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
