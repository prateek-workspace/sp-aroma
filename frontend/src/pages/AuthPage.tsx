import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRegister, apiVerifyRegistration, apiLogin, apiResetPassword, apiVerifyResetPassword, apiResendOTP } from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Key } from 'lucide-react';

type ViewMode = 'login' | 'signup' | 'verify-signup' | 'forgot-password' | 'verify-reset';

const AuthPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "circOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "circIn" } }
  };

  return (
    <main className="pt-32 pb-12 bg-primary-bg min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {viewMode === 'login' && <LoginForm setViewMode={setViewMode} />}
              {viewMode === 'signup' && <SignupForm setViewMode={setViewMode} setPendingEmail={setPendingEmail} />}
              {viewMode === 'verify-signup' && <VerifySignupForm email={pendingEmail} setViewMode={setViewMode} />}
              {viewMode === 'forgot-password' && <ForgotPasswordForm setViewMode={setViewMode} setPendingEmail={setPendingEmail} />}
              {viewMode === 'verify-reset' && <VerifyResetForm email={pendingEmail} setViewMode={setViewMode} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 text-center">
            {viewMode === 'login' && (
              <button onClick={() => setViewMode('signup')} className="text-sm text-foreground hover:text-heading transition-colors">
                Don't have an account? <span className="font-bold">Sign Up</span>
              </button>
            )}
            {(viewMode === 'signup' || viewMode === 'forgot-password' || viewMode === 'verify-signup' || viewMode === 'verify-reset') && (
              <button onClick={() => setViewMode('login')} className="text-sm text-foreground hover:text-heading transition-colors">
                Back to <span className="font-bold">Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const AuthInput = ({ id, type, placeholder, icon: Icon, value, onChange }: { 
  id: string, 
  type: string, 
  placeholder: string, 
  icon: React.ElementType,
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div className="relative border-b border-gray-200 py-2 focus-within:border-heading transition-colors duration-300">
    <span className="absolute inset-y-0 left-0 flex items-center">
      <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
    </span>
    <input
      id={id}
      name={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="w-full pl-8 pr-3 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-gray-400"
    />
  </div>
);

const LoginForm = ({ setViewMode }: { setViewMode: (mode: ViewMode) => void }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    try {
      const resp: any = await apiLogin(email, password);

      let token: string | null = null;
      if (!resp) token = null;
      else if (typeof resp === 'string') {
        try { const j = JSON.parse(resp); token = j?.access_token ?? j?.token ?? null; } catch (e) { token = null; }
      } else if (typeof resp === 'object') {
        token = (resp?.access_token as string) ?? (resp?.token as string) ?? (resp?.data?.access_token as string) ?? null;
      }
      if (!token) throw { message: 'No token received', resp };

      await login(resp);
      navigate('/');
    } catch (err: any) {
      console.error('login error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Login failed. Please check your credentials.';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-4xl font-light tracking-widest text-center text-heading">Welcome Back</h2>
      <p className="text-center text-foreground mt-2 mb-8">Log in to continue your fragrance journey.</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthInput id="email" type="email" placeholder="Email Address" icon={Mail} />
        <AuthInput id="password" type="password" placeholder="Password" icon={Lock} />
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => setViewMode('forgot-password')} className="text-sm text-foreground hover:text-heading transition-colors">
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-heading text-white font-sans uppercase text-lg tracking-wider py-3.5 rounded-md hover:bg-opacity-90 transition-colors !mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>
  );
};

const SignupForm = ({ setViewMode, setPendingEmail }: { 
  setViewMode: (mode: ViewMode) => void,
  setPendingEmail: (email: string) => void
}) => {
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    const confirmPassword = fd.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await apiRegister(email, password, confirmPassword);
      setPendingEmail(email);
      setViewMode('verify-signup');
    } catch (err: any) {
      console.error('signup error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Registration failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <div>
      <h2 className="text-4xl font-light tracking-widest text-center text-heading">Create Account</h2>
      <p className="text-center text-foreground mt-2 mb-8">Join the SP Aroma family to save your favorites.</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthInput id="email" type="email" placeholder="Email Address" icon={Mail} />
        <AuthInput id="password" type="password" placeholder="Password" icon={Lock} />
        <AuthInput id="confirmPassword" type="password" placeholder="Confirm Password" icon={Lock} />
        <button
          type="submit"
          className="w-full bg-heading text-white font-sans uppercase text-lg tracking-wider py-3.5 rounded-md hover:bg-opacity-90 transition-colors !mt-8"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

const VerifySignupForm = ({ email, setViewMode }: { 
  email: string,
  setViewMode: (mode: ViewMode) => void
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiVerifyRegistration(email, otp);
      setSuccess('Email verified! Logging you in...');
      
      // After verification, we need to login
      setTimeout(() => {
        setViewMode('login');
      }, 1500);
    } catch (err: any) {
      console.error('verification error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Verification failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handleResend = async () => {
    try {
      await apiResendOTP(email, 'register');
      setSuccess('OTP resent! Check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div>
      <h2 className="text-4xl font-light tracking-widest text-center text-heading">Verify Email</h2>
      <p className="text-center text-foreground mt-2 mb-8">Enter the OTP sent to {email}</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{success}</div>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthInput id="otp" type="text" placeholder="Enter OTP" icon={Key} value={otp} onChange={(e) => setOtp(e.target.value)} />
        <button
          type="submit"
          className="w-full bg-heading text-white font-sans uppercase text-lg tracking-wider py-3.5 rounded-md hover:bg-opacity-90 transition-colors !mt-8"
        >
          Verify
        </button>
        <button
          type="button"
          onClick={handleResend}
          className="w-full text-sm text-foreground hover:text-heading transition-colors"
        >
          Didn't receive OTP? <span className="font-bold">Resend</span>
        </button>
      </form>
    </div>
  );
};

const ForgotPasswordForm = ({ setViewMode, setPendingEmail }: { 
  setViewMode: (mode: ViewMode) => void,
  setPendingEmail: (email: string) => void
}) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;

    try {
      await apiResetPassword(email);
      setPendingEmail(email);
      setSuccess('OTP sent to your email!');
      setTimeout(() => setViewMode('verify-reset'), 1500);
    } catch (err: any) {
      console.error('reset password error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Failed to send reset email';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <div>
      <h2 className="text-4xl font-light tracking-widest text-center text-heading">Reset Password</h2>
      <p className="text-center text-foreground mt-2 mb-8">Enter your email to receive an OTP</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{success}</div>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthInput id="email" type="email" placeholder="Email Address" icon={Mail} />
        <button
          type="submit"
          className="w-full bg-heading text-white font-sans uppercase text-lg tracking-wider py-3.5 rounded-md hover:bg-opacity-90 transition-colors !mt-8"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
};

const VerifyResetForm = ({ email, setViewMode }: { 
  email: string,
  setViewMode: (mode: ViewMode) => void
}) => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await apiVerifyResetPassword(email, otp, password, confirmPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => setViewMode('login'), 2000);
    } catch (err: any) {
      console.error('verify reset error', err);
      const errorMsg = err?.body?.detail || err?.message || 'Failed to reset password';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handleResend = async () => {
    try {
      await apiResendOTP(email, 'reset-password');
      setSuccess('OTP resent! Check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div>
      <h2 className="text-4xl font-light tracking-widest text-center text-heading">Verify & Reset</h2>
      <p className="text-center text-foreground mt-2 mb-8">Enter OTP and new password</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{success}</div>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthInput id="otp" type="text" placeholder="Enter OTP" icon={Key} value={otp} onChange={(e) => setOtp(e.target.value)} />
        <AuthInput id="password" type="password" placeholder="New Password" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} />
        <AuthInput id="confirmPassword" type="password" placeholder="Confirm New Password" icon={Lock} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button
          type="submit"
          className="w-full bg-heading text-white font-sans uppercase text-lg tracking-wider py-3.5 rounded-md hover:bg-opacity-90 transition-colors !mt-8"
        >
          Reset Password
        </button>
        <button
          type="button"
          onClick={handleResend}
          className="w-full text-sm text-foreground hover:text-heading transition-colors"
        >
          Didn't receive OTP? <span className="font-bold">Resend</span>
        </button>
      </form>
    </div>
  );
};

export default AuthPage;
