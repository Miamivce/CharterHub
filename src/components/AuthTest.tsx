import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthTest: React.FC = () => {
  const { user, login, logout, updateProfile, isLoading, error } = useJWTAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Logging in...');
    
    try {
      await login(email, password);
      setStatusMessage('Login successful!');
    } catch (err) {
      setStatusMessage(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    setStatusMessage('Logging out...');
    
    try {
      await logout();
      setStatusMessage('Logout successful!');
    } catch (err) {
      setStatusMessage(`Logout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      setStatusMessage('You must be logged in to update your profile');
      return;
    }
    
    setStatusMessage('Updating profile...');
    
    try {
      await updateProfile({
        first_name: firstName || user.first_name,
        last_name: lastName || user.last_name
      });
      setStatusMessage('Profile updated successfully!');
    } catch (err) {
      setStatusMessage(`Profile update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="auth-test">
      <h2>JWT Authentication Test</h2>
      
      {isLoading && <p>Loading...</p>}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      
      {statusMessage && (
        <div className="status-message">
          <p>{statusMessage}</p>
        </div>
      )}
      
      {user ? (
        <div className="user-info">
          <h3>Logged In User</h3>
          <p>ID: {user.id}</p>
          <p>Email: {user.email}</p>
          <p>Name: {user.first_name} {user.last_name}</p>
          <p>Role: {user.role}</p>
          
          <div className="update-profile">
            <h4>Update Profile</h4>
            <div>
              <label>
                First Name:
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={user.first_name}
                />
              </label>
            </div>
            <div>
              <label>
                Last Name:
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={user.last_name}
                />
              </label>
            </div>
            <button onClick={handleUpdateProfile}>Update Profile</button>
          </div>
          
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <h3>Login</h3>
          <div>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit">Login</button>
        </form>
      )}
      
      <div className="token-info">
        <h3>Token Information</h3>
        <p>Auth Token: {sessionStorage.getItem('auth_token') ? '✅ Present' : '❌ Missing'}</p>
        <p>Refresh Token: {sessionStorage.getItem('refresh_token') ? '✅ Present' : '❌ Missing'}</p>
      </div>
    </div>
  );
};

export default AuthTest; 