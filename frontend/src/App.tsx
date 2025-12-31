import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { AuthService, UserService, type Application, type User } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users'>('dashboard');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const isAuth = AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        try {
          const user = await UserService.getCurrentUser();
          setCurrentUser(user);
        } catch (e) {
          console.error("Failed to fetch user", e);
          AuthService.logout();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    try {
      const user = await UserService.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setSelectedApp(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={() => setCurrentView('dashboard')} style={{cursor: 'pointer'}}>Causyra</h1>
        {isAuthenticated && (
          <div className="header-actions">
            <button 
              className="nav-btn"
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedApp(null);
              }}
            >
              Home
            </button>
            <button 
              className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
              onClick={() => setCurrentView('users')}
            >
              User Management
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      <main>
        {isAuthenticated && currentUser ? (
          currentView === 'users' ? (
            <UserManagement currentUser={currentUser} /> 
          ) : (
            <Dashboard 
              selectedApp={selectedApp} 
              onAppSelect={setSelectedApp} 
              currentUser={currentUser}
            />
          )
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;
