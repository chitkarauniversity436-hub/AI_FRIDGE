import { useContext, useState, useEffect } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { getLowStockAlerts } from '../utils/expiryUtils';
import { ShoppingCart, Plus, Check, ExternalLink, X, RefreshCw } from 'lucide-react';

export default function ShoppingList() {
  const { state } = useContext(FridgeContext);
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Other', quantity: 1, unit: 'pcs' });

  useEffect(() => {
    const lowStock = getLowStockAlerts(state.inventory);
    const generatedList = lowStock.map(item => ({
      id: `sl-${item.id}`,
      name: item.name,
      category: item.category,
      quantity: item.threshold * 2,
      unit: item.unit,
      checked: false
    }));
    setList(generatedList);
  }, [state.inventory]);

  const toggleCheck = (id) => {
    setList(list.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const addCustomItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    const item = {
      ...newItem,
      id: `custom-${Date.now()}`,
      checked: false
    };
    setList([item, ...list]);
    setShowModal(false);
    setNewItem({ name: '', category: 'Other', quantity: 1, unit: 'pcs' });
  };

  const platforms = [
    { name: 'Amazon', color: '#FF9900', url: 'https://www.amazon.com/s?k=' },
    { name: 'Walmart', color: '#0071CE', url: 'https://www.walmart.com/search?q=' },
    { name: 'Instacart', color: '#2CBE5E', url: 'https://www.instacart.com/store/s?k=' },
    { name: 'BigBasket', color: '#84C225', url: 'https://www.bigbasket.com/ps/?q=' }
  ];

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShoppingCart /> Smart Shopping List
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Auto-generated based on low stock and expired items.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18}/> Add Custom Item
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Your Items</h2>
          {list.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Your fridge is fully stocked! Nothing to buy right now.</p>
          ) : (
            <div className="item-list">
              {list.map(item => (
                <div key={item.id} className="item-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', opacity: item.checked ? 0.5 : 1, padding: '16px', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        onClick={() => toggleCheck(item.id)}
                        style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', 
                          border: '2px solid var(--primary)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: item.checked ? 'var(--primary)' : 'transparent',
                          cursor: 'pointer'
                        }}>
                        {item.checked && <Check size={14} color="#000" />}
                      </div>
                      <span style={{ fontSize: '1.1rem', textDecoration: item.checked ? 'line-through' : 'none' }}>
                        <strong>{item.name}</strong>
                      </span>
                    </div>
                    <div>
                      <span className="badge">{item.quantity} {item.unit}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '36px' }}>
                    {platforms.map(p => (
                      <a key={p.name} href={`${p.url}${item.name}`} target="_blank" rel="noreferrer" className="buy-pill" style={{ '--p-color': p.color }}>
                        {p.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add Custom Item</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={addCustomItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Item Name</label>
                <input 
                  autoFocus
                  required
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  placeholder="e.g. Avocado"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Quantity</label>
                  <input 
                    type="number"
                    required
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                  />
                </div>
                <div>
                  <label>Unit</label>
                  <input 
                    required
                    value={newItem.unit} 
                    onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add to List</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .buy-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          color: var(--text-main);
          background: rgba(0,0,0,0.03);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }
        .buy-pill:hover {
          background: var(--p-color);
          border-color: var(--p-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--p-color);
          color: #fff !important;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal-content {
          animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes modalPop {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
