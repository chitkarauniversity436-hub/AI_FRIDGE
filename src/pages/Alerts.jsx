import { useContext, useState } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { getExpiryAlerts, getLowStockAlerts, getFreshnessStatus } from '../utils/expiryUtils';
import { Bell, AlertTriangle, BatteryWarning, ThermometerSnowflake, Trash2, ShoppingCart, Search, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Alerts() {
  const { state, dispatch } = useContext(FridgeContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const expiryAlerts = getExpiryAlerts(state.inventory);
  const lowStockAlerts = getLowStockAlerts(state.inventory);
  const expiredItems = state.inventory.filter(i => getFreshnessStatus(i.expiryDate) === 'expired');

  const systemAlerts = [
    { id: 'sys1', type: 'success', msg: 'Fridge temperature is optimal (4°C)', icon: <ThermometerSnowflake size={16}/> },
    { id: 'sys2', type: 'success', msg: 'Freezer temperature is optimal (-18°C)', icon: <ThermometerSnowflake size={16}/> },
    { id: 'sys3', type: 'info', msg: 'AI Assistant updated to Gemini 2.5 Flash', icon: <Bell size={16}/> },
    { id: 'sys4', type: 'info', msg: `Last database sync: ${new Date().toLocaleTimeString()}`, icon: <Bell size={16}/> },
  ];

  const handleDiscard = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const handleAddToList = (item) => {
    // Navigate to shopping list, it auto-generates from low stock anyway
    navigate('/shopping');
  };

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Bell /> Notifications & Alerts
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Real-time updates on your food and system health.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Alerts</button>
        <button className={`tab-btn ${activeTab === 'expiry' ? 'active' : ''}`} onClick={() => setActiveTab('expiry')}>Expiry</button>
        <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Low Stock</button>
      </div>

      <div className="grid grid-2">
        {(activeTab === 'all' || activeTab === 'expiry') && (
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--orange)' }}>
              <AlertTriangle /> Expiry & Freshness
            </h2>
            <div className="item-list">
              {expiredItems.length === 0 && expiryAlerts.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No items expiring soon.</p>
              )}
              {expiredItems.map(item => (
                <div key={item.id} className="alert-row expired">
                  <div className="alert-body">
                    <strong>{item.name}</strong> has expired!
                    <div className="alert-meta">Expired on {item.expiryDate}</div>
                  </div>
                  <button className="action-pill danger" onClick={() => handleDiscard(item.id)}>
                    <Trash2 size={14}/> Discard
                  </button>
                </div>
              ))}
              {expiryAlerts.map(item => (
                <div key={item.id} className="alert-row expiring">
                  <div className="alert-body">
                    <strong>{item.name}</strong> is expiring soon.
                    <div className="alert-meta">Expires on {item.expiryDate}</div>
                  </div>
                  <button className="action-pill warning" onClick={() => navigate('/recipes')}>
                    <Search size={14}/> View Recipes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'stock') && (
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--red)' }}>
              <BatteryWarning /> Low Stock Alerts
            </h2>
            <div className="item-list">
              {lowStockAlerts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Inventory levels look good.</p>
              ) : (
                lowStockAlerts.map(item => (
                  <div key={item.id} className="alert-row low-stock">
                    <div className="alert-body">
                      <strong>{item.name}</strong> is running low.
                      <div className="alert-meta">{item.quantity}{item.unit} left (Target: {item.threshold * 2}{item.unit})</div>
                    </div>
                    <button className="action-pill primary" onClick={() => handleAddToList(item)}>
                      <ShoppingCart size={14}/> Buy More
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--secondary)' }}>
              <CheckCircle2 /> System Health
            </h2>
            <div className="item-list">
              {systemAlerts.map(alert => (
                <div key={alert.id} className="alert-row system">
                  <div className="alert-icon" style={{ color: alert.type === 'success' ? 'var(--green)' : 'var(--primary)' }}>
                    {alert.icon}
                  </div>
                  <div className="alert-body">
                    {alert.msg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tab-btn {
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
          box-shadow: 0 4px 12px var(--primary-glow);
        }
        .alert-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.03);
          border-left: 4px solid transparent;
          transition: transform 0.2s;
        }
        .alert-row:hover { transform: translateX(5px); }
        .alert-row.expired { border-left-color: var(--red); background: rgba(239, 68, 68, 0.05); }
        .alert-row.expiring { border-left-color: var(--orange); }
        .alert-row.low-stock { border-left-color: var(--red); }
        .alert-row.system { border-left-color: var(--green); }
        
        .alert-body { flex: 1; font-size: 0.95rem; }
        .alert-meta { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
        
        .action-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .action-pill.danger:hover { background: var(--red); color: #fff; border-color: var(--red); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }
        .action-pill.warning:hover { background: var(--orange); color: #fff; border-color: var(--orange); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); }
        .action-pill.primary:hover { background: var(--primary); color: #000; border-color: var(--primary); box-shadow: 0 4px 12px var(--primary-glow); }
      `}</style>
    </div>
  );
}
