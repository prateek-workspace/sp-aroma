import { Mail, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiUpdateCurrentUser, apiChangePassword, formatIST } from '../../lib/api';

const ProfileSection = () => {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [joined, setJoined] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? '');
    setLastName(user.last_name ?? '');
    setEmail(user.email ?? '');
    setVerified(!!user.is_verified_email);
    setJoined(user.date_joined ?? null);
    setLastLogin(user.last_login ?? null);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiUpdateCurrentUser({ first_name: firstName || null, last_name: lastName || null });
      await refreshUser();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('profile update error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Failed to update profile';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      await apiChangePassword(currentPassword, newPassword, confirmPassword);
      setPasswordMessage('Password changed successfully! You may need to log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 5000);
    } catch (err: any) {
      console.error('password change error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Failed to change password';
      setPasswordError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-light tracking-widest border-b border-gray-200 pb-4">
          My Profile
        </h2>
        {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{message}</div>}
        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <div className="flex gap-2">
              <input 
                className="w-1/2 pl-3 py-2 border border-gray-200 rounded focus:border-heading focus:ring-1 focus:ring-heading" 
                value={firstName} 
                onChange={e=>setFirstName(e.target.value)} 
                placeholder="First name" 
              />
              <input 
                className="w-1/2 pl-3 py-2 border border-gray-200 rounded focus:border-heading focus:ring-1 focus:ring-heading" 
                value={lastName} 
                onChange={e=>setLastName(e.target.value)} 
                placeholder="Last name" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <div className="relative border-b border-gray-200 py-2">
              <span className="absolute inset-y-0 left-0 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input 
                readOnly 
                value={email} 
                className="w-full pl-8 pr-3 bg-gray-50 border-none focus:ring-0 text-foreground placeholder:text-gray-400" 
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>Verified: {verified ? 'Yes ✓' : 'No ✗'}</div>
            <div>Joined: {formatIST(joined)}</div>
            <div>Last login: {formatIST(lastLogin)}</div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-heading text-white font-sans uppercase text-lg tracking-wider px-8 py-3 rounded-md hover:bg-opacity-90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-light tracking-widest border-b border-gray-200 pb-4">
          Change Password
        </h2>
        {passwordMessage && <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{passwordMessage}</div>}
        {passwordError && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{passwordError}</div>}
        <form className="mt-6 space-y-6" onSubmit={handlePasswordChange}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Current Password</label>
            <div className="relative border-b border-gray-200 py-2 focus-within:border-heading">
              <span className="absolute inset-y-0 left-0 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 bg-transparent border-none focus:ring-0 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
            <div className="relative border-b border-gray-200 py-2 focus-within:border-heading">
              <span className="absolute inset-y-0 left-0 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 bg-transparent border-none focus:ring-0 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
            <div className="relative border-b border-gray-200 py-2 focus-within:border-heading">
              <span className="absolute inset-y-0 left-0 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 bg-transparent border-none focus:ring-0 text-foreground"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-heading text-white font-sans uppercase text-lg tracking-wider px-8 py-3 rounded-md hover:bg-opacity-90 transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSection;
