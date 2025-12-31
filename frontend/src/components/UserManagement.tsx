import React, { useState, useEffect } from 'react';
import { UserService, AppService, type User, type Application } from '../services/api';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser: propCurrentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(propCurrentUser);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState<{username: string, isOwn: boolean} | null>(null);
  const [showScopeModal, setShowScopeModal] = useState<User | null>(null);
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('READ');
  const [oldPassword, setOldPassword] = useState(''); // Only for own password
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    // We can update currentUser if needed, or rely on prop
    // fetchCurrentUser(); 
    fetchApps();
  }, []);

  // Update local currentUser when prop changes
  useEffect(() => {
    setCurrentUser(propCurrentUser);
  }, [propCurrentUser]);

  const fetchApps = async () => {
    try {
      const apps = await AppService.getApplications();
      setAllApps(apps);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await UserService.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await UserService.createUser(newUsername, newPassword, newRole);
      setShowCreateForm(false);
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (e) {
      alert('Failed to create user. Username might exist.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    if (!showChangePwd) return;

    try {
      if (showChangePwd.isOwn) {
        await UserService.changeOwnPassword(oldPassword, newPassword);
      } else {
        await UserService.changeUserPassword(showChangePwd.username, newPassword);
      }
      setPwdSuccess('Password updated successfully');
      setTimeout(() => {
        setShowChangePwd(null);
        setOldPassword('');
        setNewPassword('');
        setPwdSuccess('');
      }, 1500);
    } catch (e) {
      setPwdError('Failed to update password. Check old password.');
    }
  };

  const handleSaveScope = async () => {
    if (!showScopeModal) return;
    try {
      await UserService.updateUserScope(showScopeModal.username, selectedApps);
      setShowScopeModal(null);
      fetchUsers();
    } catch (e) {
      alert('Failed to update scope');
    }
  };

  return (
    <div className="user-management">
      <div className="um-header">
        <h2>User Management</h2>
        <div className="um-actions">
          {currentUser?.role === 'ADMIN' && (
            <button className="create-btn" onClick={() => setShowCreateForm(true)}>Create New User</button>
          )}
          <button className="change-pwd-btn" onClick={() => setShowChangePwd({username: currentUser?.username || '', isOwn: true})}>
            Change My Password
          </button>
        </div>
      </div>

      <div className="user-list">
        {users.map(user => (
          <div key={user.username} className="user-card">
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
            {currentUser?.role === 'ADMIN' && user.username !== currentUser.username && (
              <button 
                className="sm-btn"
                onClick={() => setShowChangePwd({username: user.username, isOwn: false})}
              >
                Reset Password
              </button>
            )}
            {currentUser?.role === 'ADMIN' && user.role !== 'ADMIN' && (
              <button 
                className="sm-btn"
                style={{marginLeft: '10px'}}
                onClick={() => {
                    setShowScopeModal(user);
                    setSelectedApps(user.allowed_apps || []);
                }}
              >
                Manage Scope
              </button>
            )}
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Username</label>
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="READ">READ</option>
                  <option value="WRITE">WRITE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangePwd && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password: {showChangePwd.username}</h3>
            <form onSubmit={handleChangePassword}>
              {showChangePwd.isOwn && (
                <div className="form-group">
                  <label>Old Password</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              {pwdError && <p className="error">{pwdError}</p>}
              {pwdSuccess && <p className="success">{pwdSuccess}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => {setShowChangePwd(null); setOldPassword(''); setNewPassword(''); setPwdError('');}}>Cancel</button>
                <button type="submit" className="primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showScopeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Manage Scope: {showScopeModal.username}</h3>
            <div className="scope-list" style={{maxHeight: '300px', overflowY: 'auto', textAlign: 'left', margin: '20px 0'}}>
                {allApps.map(app => (
                    <div key={app.id} style={{marginBottom: '8px'}}>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={selectedApps.includes(app.id)} 
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedApps([...selectedApps, app.id]);
                                    } else {
                                        setSelectedApps(selectedApps.filter(id => id !== app.id));
                                    }
                                }}
                            />
                            {' '}{app.name} <small>({app.type})</small>
                        </label>
                    </div>
                ))}
                {allApps.length === 0 && <p>No applications found.</p>}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowScopeModal(null)}>Cancel</button>
              <button className="primary" onClick={handleSaveScope}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
