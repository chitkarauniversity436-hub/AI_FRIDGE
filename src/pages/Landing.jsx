import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--primary)' }}></div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#fff' }}>FridgeIQ</h2>
        </div>
        
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How it Works</a>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/register" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Sign Up</Link>
          <Link to="/login" className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: '20px' }}>Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-content">
          <h1>Get ready for the<br/>new era of AI</h1>
          <p>
            Experience the future of kitchen management. Our smart AI tracks your groceries, plans your meals, and reduces waste instantly.
          </p>
          
          <div className="landing-input-group">
            <input type="email" placeholder="Enter email" />
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
          </div>
        </div>

        {/* CSS Animated Fridge */}
        <div className="fridge-container">
          <div className="fridge-body">
            <div className="fridge-shelf">
              <div className="virtual-item">🥛</div>
              <div className="virtual-item">🥚</div>
              <div className="virtual-item">🍎</div>
            </div>
            <div className="fridge-shelf">
              <div className="virtual-item">🥬</div>
              <div className="virtual-item">🥤</div>
              <div className="virtual-item">🥕</div>
            </div>
            <div className="fridge-shelf">
              <div className="virtual-item">🥩</div>
              <div className="virtual-item">🧀</div>
              <div className="virtual-item">🍇</div>
            </div>
          </div>
          
          <div className="fridge-door-left">
            <div className="fridge-handle"></div>
          </div>
          <div className="fridge-door-right">
            <div className="fridge-handle"></div>
          </div>
        </div>
      </main>

      {/* Details Sections */}
      <section id="features" className="landing-section">
        <h2 className="section-title">Core Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Smart Inventory</h3>
            <p>Real-time tracking of every item in your fridge with expiration alerts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🍲</div>
            <h3>AI Recipes</h3>
            <p>Instant meal suggestions based strictly on what you have available.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Nutrition Tracking</h3>
            <p>Deep insights into your consumption habits and health goals.</p>
          </div>
        </div>
      </section>

      <section id="about" className="landing-section alt-bg">
        <div className="about-content">
          <h2 className="section-title">About FridgeIQ</h2>
          <p>
            FridgeIQ is more than just a list; it's your personal kitchen assistant. 
            Designed for the modern home, we use advanced AI to help you reduce food waste, 
            save money, and eat healthier every single day.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Scan Items</h4>
            <p>Use your camera or voice to add groceries as you stock up.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Get AI Insights</h4>
            <p>Our AI analyzes your inventory to suggest recipes and shopping lists.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Zero Waste</h4>
            <p>Receive alerts before items expire and optimize your spending.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 FridgeIQ AI Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
