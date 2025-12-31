import React, { useState, useEffect } from 'react';
import { UserService, AppService, type User, type Application } from '../services/api';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser: propCurrentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(propCurrentUser);
  
  // Modals state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState<{username: string, isOwn: boolean} | null>(null);
  const [showScopeModal, setShowScopeModal] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null);
  const [showManageModal, setShowManageModal] = useState<User | null>(null);

  const [allApps, setAllApps] = useState<Application[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('READ');
  
  const [selectedRole, setSelectedRole] = useState('READ');

  const [oldPassword, setOldPassword] = useState(''); // Only for own password
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchApps();
  }, []);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await UserService.createUser(newUsername, newEmail, newPassword, newRole);
      setShowCreateForm(false);
      setNewUsername('');
      setNewEmail('');
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

  const handleSaveRole = async () => {
    if (!showRoleModal) return;
    try {
      await UserService.updateUserRole(showRoleModal.username, selectedRole);
      setShowRoleModal(null);
      fetchUsers();
    } catch (e) {
        alert('Failed to update role');
    }
  };

  const openManageModal = (user: User) => {
      setShowManageModal(user);
  };

  return (
    <div className="user-management">
      <div className="um-header">
        <div>
            <h2>User Management</h2>
            <p className="subtitle">Manage users, roles, and access scopes</p>
        </div>
        <div className="um-actions">
          {currentUser?.role === 'ADMIN' && (
            <button className="primary" onClick={() => setShowCreateForm(true)}>+ New User</button>
          )}
          <button className="secondary" onClick={() => setShowChangePwd({username: currentUser?.username || '', isOwn: true})}>
            Change My Password
          </button>
        </div>
      </div>

      <div className="card">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Scope</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td>
                  <strong>{user.username}</strong>
                  <div className="muted">{user.email || 'No email'}</div>
                </td>
                <td>
                  <span className={`badge ${user.role.toLowerCase()}`}>{user.role}</span>
                </td>
                <td>
                    {user.role === 'ADMIN' ? 'All Access' : (
                         user.allowed_apps && user.allowed_apps.length > 0 
                         ? `${user.allowed_apps.length} Apps` 
                         : 'No Access'
                    )}
                </td>
                <td>
                  <span className="status active">Active</span>
                </td>
                <td>
                  {currentUser?.role === 'ADMIN' && user.username !== currentUser.username && (
                      <button className="link-btn" onClick={() => openManageModal(user)}>Manage</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
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
                <label>Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
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

      {/* Manage User Modal (The Menu) */}
      {showManageModal && (
          <div className="modal-overlay" onClick={() => setShowManageModal(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                  <h3>Manage User: {showManageModal.username}</h3>
                  <div className="manage-actions-list">
                      <button className="action-btn" onClick={() => {
                          setShowManageModal(null);
                          setShowChangePwd({username: showManageModal.username, isOwn: false});
                      }}>
                          Reset Password
                      </button>
                      <button className="action-btn" onClick={() => {
                          setShowManageModal(null);
                          setShowScopeModal(showManageModal);
                          setSelectedApps(showManageModal.allowed_apps || []);
                      }}>
                          Manage Scope
                      </button>
                      <button className="action-btn" onClick={() => {
                          setShowManageModal(null);
                          setShowRoleModal(showManageModal);
                          setSelectedRole(showManageModal.role);
                      }}>
                          Change Role
                      </button>
                  </div>
                  <div className="modal-actions">
                      <button onClick={() => setShowManageModal(null)}>Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
          <div className="modal-overlay">
              <div className="modal">
                  <h3>Change Role: {showRoleModal.username}</h3>
                  <div className="form-group">
                      <label>Role</label>
                      <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                          <option value="READ">READ</option>
                          <option value="WRITE">WRITE</option>
                          <option value="ADMIN">ADMIN</option>
                      </select>
                  </div>
                  <div className="modal-actions">
                      <button onClick={() => setShowRoleModal(null)}>Cancel</button>
                      <button className="primary" onClick={handleSaveRole}>Save</button>
                  </div>
              </div>
          </div>
      )}

      {/* Change Password Modal */}
      {showChangePwd && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{showChangePwd.isOwn ? 'Change My Password' : `Reset Password: ${showChangePwd.username}`}</h3>
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

      {/* Scope Modal */}
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
