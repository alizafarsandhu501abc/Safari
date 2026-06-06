import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginUser(username, password);
      const { token, user } = res.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-float opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-float opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)',
            bottom: '-15%',
            right: '-10%',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full animate-float opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
            top: '40%',
            right: '20%',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Login Card */}
      <div className="glass-strong w-full max-w-md p-10 relative z-10 animate-slideUp" style={{ borderRadius: 'var(--radius-xl)' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Safari</h1>
          <p className="text-slate-500 text-sm font-light">Secure Cloud Log Analyzer</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="input-dark"
              autoComplete="username"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-dark"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
