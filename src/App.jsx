import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FridgeProvider, FridgeContext } from './context/FridgeContext';
import { Home, Package, ScanLine, Utensils, CalendarDays, Activity, ShoppingCart, Bell, BarChart2, Truck, Settings, LogOut } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import Recipes from './pages/Recipes';
import MealPlanner from './pages/MealPlanner';
import Nutrition from './pages/Nutrition';
import ShoppingList from './pages/ShoppingList';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Orders from './pages/Orders';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import VoiceAssistant from './components/VoiceAssistant';
import Landing from './pages/Landing';

const PrivateRoute = ({ children }) => {
  const { state } = useContext(FridgeContext);
  return state.token ? children : <Navigate to="/" replace />;
};

const AppLayout = ({ children }) => {
  const { state, logout } = useContext(FridgeContext);
  
  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/inventory', icon: <Package size={20} />, label: 'Inventory' },
    { to: '/scanner', icon: <ScanLine size={20} />, label: 'Scanner' },
    { to: '/recipes', icon: <Utensils size={20} />, label: 'AI Recipes' },
    { to: '/meal-planner', icon: <CalendarDays size={20} />, label: 'Meal Planner' },
    { to: '/nutrition', icon: <Activity size={20} />, label: 'Nutrition' },
    { to: '/shopping', icon: <ShoppingCart size={20} />, label: 'Shopping' },
    { to: '/alerts', icon: <Bell size={20} />, label: 'Alerts' },
    { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { to: '/orders', icon: <Truck size={20} />, label: 'Orders' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header" style={{ marginBottom: '40px' }}>
            <img 
              src="/src/assets/logo.png.png" 
              alt="FridgeIQ" 
              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.parentElement?.querySelector('.logo-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div className="logo-fallback" style={{ display: 'none' }}>
              <h1 className="logo-text">Fridge<span style={{ color: 'var(--secondary)' }}>IQ</span></h1>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Logo file not found in /assets</p>
            </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <button className="nav-item" onClick={logout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--red)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
        <VoiceAssistant />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FridgeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes inside Layout */}
<Route path="/*" element={
  <PrivateRoute>
    <AppLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="meal-planner" element={<MealPlanner />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="shopping" element={<ShoppingList />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  </PrivateRoute>
} />
        </Routes>
      </BrowserRouter>
    </FridgeProvider>
  );
}
