import React, { useState, useContext, useEffect } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@home.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, state } = useContext(FridgeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.token) {
      navigate('/');
    }
  }, [state.token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('Connecting to server...');
    try {
      const success = await login(email, password);
      if (success) {
        setError('Success! Redirecting...');
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else {
        setError('Login failed. Server might be unreachable or wrong password.');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="card" style={{ width: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src="/src/assets/logo.png.png" 
            alt="FridgeIQ" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: '15px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.logo-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="logo-fallback" style={{ display: 'none' }}>
            <div className="logo-icon" style={{ fontSize: '48px', marginBottom: '10px' }}>🧊</div>
          </div>
          <h2 style={{ marginBottom: '5px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Login to access your smart fridge</p>
        </div>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Login</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
