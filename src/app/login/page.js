'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Leaf, User, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import './login.css';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const handleAuth = async (e, demoEmail, demoPassword) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError('');
    
    const targetEmail = demoEmail || email;
    const targetPassword = demoPassword || password;
    
    try {
      let result;
      if (isRegister && !demoEmail) {
        result = await register(name, targetEmail, targetPassword);
      } else {
        result = await login(targetEmail, targetPassword);
      }
      
      if (result.success) {
        // Redirect based on role if possible, else home
        if (targetEmail.includes('admin')) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="login-page">
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Leaf size={40} className="logo-icon-large" />
            </div>
            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isRegister ? 'Join us in making a difference' : 'Login to continue making a difference'}</p>
          </div>

          <div className="auth-tabs" style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <button 
              className={`auth-tab ${!isRegister ? 'active' : ''}`} 
              onClick={() => setIsRegister(false)}
              style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: !isRegister ? '2px solid var(--primary)' : '2px solid transparent', color: !isRegister ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: !isRegister ? '600' : '400', cursor: 'pointer' }}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${isRegister ? 'active' : ''}`} 
              onClick={() => setIsRegister(true)}
              style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: isRegister ? '2px solid var(--primary)' : '2px solid transparent', color: isRegister ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isRegister ? '600' : '400', cursor: 'pointer' }}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required 
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "Create a password" : "Enter your password"}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block login-btn" disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> {isRegister ? 'Creating...' : 'Logging in...'}</> : (isRegister ? 'Create Account' : 'Login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
