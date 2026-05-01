import { useContext, useState } from 'react';
import { useAI } from '../hooks/useAI';
import { FridgeContext } from '../context/FridgeContext';
import { CATEGORIES, CATEGORY_ICONS } from '../utils/nutritionUtils';
import { getFreshnessBadge } from '../utils/expiryUtils';
import { Plus, Search, Trash2, Edit2, X, Minus, PlusCircle, Loader2 } from 'lucide-react';

export default function Inventory() {
  const { state, dispatch } = useContext(FridgeContext);
  const { getNutrition } = useAI(state.settings.apiKey);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Vegetables', quantity: 1, unit: 'pcs', 
    expiryDate: new Date().toISOString().split('T')[0],
    threshold: 1
  });

  const filteredItems = state.inventory.filter(item => {
    const matchesCat = filter === 'All' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDelete = (id) => {
    if(confirm('Permanently remove this item from your fridge?')) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '', category: 'Vegetables', quantity: 1, unit: 'pcs', 
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      threshold: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // AI Nutrition Lookup
    let finalData = { ...formData };
    try {
      const nutri = await getNutrition(formData.name);
      if (nutri) {
        finalData = { ...finalData, ...nutri };
      }
    } catch (aiErr) {
      console.warn('Nutrition Lookup failed, saving with defaults', aiErr);
    }

    try {
      if (editingItem) {
        dispatch({ type: 'UPDATE_ITEM', payload: { ...finalData, id: editingItem.id } });
      } else {
        dispatch({ type: 'ADD_ITEM', payload: finalData });
      }
    } catch (saveErr) {
      console.error('Failed to save item', saveErr);
    }
    
    setIsSubmitting(false);
    setShowModal(false);
  };

  const quickUpdateQty = (item, delta) => {
    const newQty = Math.max(0, parseFloat(item.quantity) + delta);
    if (newQty === 0) {
      handleDelete(item.id);
    } else {
      dispatch({ type: 'UPDATE_ITEM', payload: { ...item, quantity: newQty } });
    }
  };

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Fridge Inventory</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage and track everything stored in your smart fridge.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}><Plus size={18} /> Add New Item</button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search items..." 
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '200px' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
      </div>

      <div className="grid grid-3">
        {filteredItems.map(item => {
          const badge = getFreshnessBadge(item.expiryDate);
          return (
            <div key={item.id} className="card inventory-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div className="category-icon">{CATEGORY_ICONS[item.category] || '📦'}</div>
                <span className="badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{item.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Expires: {item.expiryDate}</p>
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>
                  {item.quantity} {item.unit === 'L' ? 'Litre' : item.unit === 'g' ? 'Grams' : item.unit === 'kg' ? 'Kilogram' : item.unit}
                </div>
              </div>

              <div className="qty-control">
                <button className="qty-btn" onClick={() => quickUpdateQty(item, -1)}><Minus size={14}/></button>
                <div className="qty-display">
                  <strong>{item.quantity}</strong>
                  <span>{item.unit}</span>
                </div>
                <button className="qty-btn" onClick={() => quickUpdateQty(item, 1)}><Plus size={14}/></button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn" style={{ flex: 1, padding: '8px' }} onClick={() => handleOpenEdit(item)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn danger-btn" style={{ flex: 1, padding: '8px' }} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-group">
                <label>Item Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Greek Yogurt" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" required value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" step="any" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} style={{ flex: 1 }} />
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100px' }}>
                      <option value="pcs">pcs</option>
                      <option value="g">Grams</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">Litre</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input type="number" required value={formData.threshold} onChange={e => setFormData({...formData, threshold: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '14px', marginTop: '10px', gap: '10px' }}>
                {isSubmitting ? <Loader2 className="spin" size={18}/> : null}
                {editingItem ? 'Save Changes' : 'Add to Fridge'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .inventory-card {
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.2s;
        }
        .inventory-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        .category-icon { font-size: 32px; background: rgba(255,255,255,0.05); width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        
        .qty-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          padding: 4px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .qty-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .qty-btn:hover { background: var(--primary); color: #000; }
        .qty-display { text-align: center; }
        .qty-display strong { display: block; font-size: 18px; }
        .qty-display span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
        
        .danger-btn:hover { background: var(--red) !important; color: #fff !important; }
        
        .inventory-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; }
      `}</style>
    </div>
  );
}
