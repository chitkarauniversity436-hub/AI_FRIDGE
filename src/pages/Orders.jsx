import { useContext } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { Truck, RotateCcw, Package, Calendar, MapPin, ChevronRight } from 'lucide-react';

export default function Orders() {
  const { state } = useContext(FridgeContext);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'var(--green)';
      case 'Shipped': return 'var(--primary)';
      case 'Processing': return 'var(--yellow)';
      case 'Cancelled': return 'var(--red)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Truck /> My Grocery Orders
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Track and manage your recent grocery deliveries.</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href='/shopping'}>Place New Order</button>
      </div>

      <div className="item-list" style={{ gap: '20px' }}>
        {state.orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>When you buy items through the shopping list, they'll appear here.</p>
          </div>
        ) : (
          state.orders.map(order => (
            <div key={order.id} className="card order-card">
              
              <div className="order-header">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div className="store-avatar">
                    {order.store?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{order.store}</h3>
                    <div className="order-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {order.dateFormatted}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={14}/> {order.orderNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="status-badge" style={{ '--status-color': getStatusColor(order.status) }}>
                  {order.status}
                </div>
              </div>

              <div className="order-body">
                <div className="items-list">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <span>{item.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>x{item.qty}</span>
                    </div>
                  ))}
                </div>
                
                <div className="order-footer">
                  <div className="total-box">
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{order.total}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ padding: '8px 16px' }}>View Details</button>
                    <button className="btn btn-primary" style={{ padding: '8px 16px' }}>
                      <RotateCcw size={16} /> Reorder
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      <style>{`
        .order-card {
          padding: 0;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border-color);
        }
        .store-avatar {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: var(--primary);
          color: #000;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 20px;
        }
        .order-meta {
          display: flex; gap: 15px;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: color-mix(in srgb, var(--status-color), transparent 85%);
          color: var(--status-color);
          border: 1px solid color-mix(in srgb, var(--status-color), transparent 80%);
        }
        .order-body {
          padding: 20px;
        }
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .order-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px dashed var(--border-color);
        }
      `}</style>
    </div>
  );
}
