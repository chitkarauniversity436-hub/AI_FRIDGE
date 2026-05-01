import React, { useContext } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { getFreshnessStatus, getExpiryAlerts, getLowStockAlerts } from '../utils/expiryUtils';
import { useAI } from '../hooks/useAI';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package, Leaf, BatteryWarning, Sparkles, Clock, Flame } from 'lucide-react';

export default function Dashboard() {
  const { state } = useContext(FridgeContext);
  
  if (!state || !state.inventory) {
    return <div className="page-content">Loading...</div>;
  }

  const { inventory } = state;
  const { getRecipes } = useAI(state.settings?.apiKey || '');
  const [suggestion, setSuggestion] = React.useState(null);

  React.useEffect(() => {
    const loadSuggestion = async () => {
      if (inventory && inventory.length > 0 && state.settings?.apiKey) {
        const recipes = await getRecipes(inventory.slice(0, 5));
        if (recipes && recipes.length > 0) setSuggestion(recipes[0]);
      }
    };
    loadSuggestion();
  }, [inventory, getRecipes, state.settings?.apiKey]);

  const freshItems = inventory ? inventory.filter(i => getFreshnessStatus(i.expiryDate) === 'fresh').length : 0;
  const expiryAlerts = getExpiryAlerts(inventory || []);
  const lowStockAlerts = getLowStockAlerts(inventory || []);

  return (
    <div className="page-content fade-in">
      <h1 className="page-title">Welcome back, {state.family?.find?.(f => f.role === 'Admin')?.name?.split(' ')[0] || 'User'}! 👋</h1>
      <p className="page-subtitle">Here is what's happening in your smart fridge today.</p>

      <div className="grid grid-4 dashboard-stats">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 245, 160, 0.15)', color: 'var(--primary)' }}><Package /></div>
          <div className="stat-info"><h3>Total Items</h3><p>{inventory.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--green)' }}><Leaf /></div>
          <div className="stat-info"><h3>Fresh Food</h3><p>{freshItems}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--orange)' }}><AlertTriangle /></div>
          <div className="stat-info"><h3>Expiring Soon</h3><p>{expiryAlerts.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)' }}><BatteryWarning /></div>
          <div className="stat-info"><h3>Low Stock</h3><p>{lowStockAlerts.length}</p></div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Urgent Alerts</h2>
            <Link to="/alerts" className="btn">View All</Link>
          </div>
          {expiryAlerts.length === 0 && lowStockAlerts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>All good! No urgent alerts.</p>
          ) : (
            <div className="item-list">
              {expiryAlerts.slice(0, 3).map(item => (
                <div key={`exp-${item.id}`} className="item-row" style={{ borderLeft: '4px solid var(--orange)' }}>
                  <span>⏳ <strong>{item.name}</strong> is expiring soon!</span>
                </div>
              ))}
              {lowStockAlerts.slice(0, 3).map(item => (
                <div key={`low-${item.id}`} className="item-row" style={{ borderLeft: '4px solid var(--red)' }}>
                  <span>📉 Low stock on <strong>{item.name}</strong> ({item.quantity} {item.unit} left)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>AI Suggestion of the Day</h2>
            <Link to="/recipes" className="btn">More Recipes</Link>
          </div>
          {suggestion ? (
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(0, 245, 160, 0.1), rgba(0, 217, 245, 0.1))', borderRadius: 'var(--radius)', border: '1px solid rgba(0, 245, 160, 0.2)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span className="badge" style={{ background: 'var(--primary)', color: '#000', fontWeight: '800' }}>{suggestion.mood}</span>
              </div>
              <h3 style={{ marginBottom: '12px', color: 'var(--primary)', fontSize: '24px' }}>{suggestion.name}</h3>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                  <Clock size={14}/> {suggestion.prepTime}
                </span>
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)' }}>
                  <Flame size={14}/> {suggestion.difficulty}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Top Ingredients:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(suggestion.ingredientsFromFridge || suggestion.ingredients || []).slice(0, 3).map((ing, i) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }}>{ing}</span>
                  ))}
                </div>
              </div>

              <Link to="/recipes" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>View Full Recipe</Link>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sparkles size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Analyzing your fridge for the best suggestion...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
