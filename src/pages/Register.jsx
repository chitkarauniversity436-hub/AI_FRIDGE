import React, { useState, useContext, useEffect } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, state } = useContext(FridgeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.token) {
      navigate('/dashboard');
    }
  }, [state.token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (!success) {
      setError('Registration failed. Email might be in use.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="card" style={{ width: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src="/src/assets/logo.png.png" 
            alt="FridgeIQ" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', marginBottom: '15px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.logo-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="logo-fallback" style={{ display: 'none' }}>
            <div className="logo-icon" style={{ fontSize: '48px', marginBottom: '10px' }}>🧊</div>
          </div>
          <h2 style={{ marginBottom: '5px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Join FridgeIQ today</p>
        </div>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Register</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
