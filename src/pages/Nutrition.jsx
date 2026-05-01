import React, { useContext } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { getTotalNutrition, formatNutrient, CATEGORY_ICONS, getScaledNutrient } from '../utils/nutritionUtils';
import { Activity, Flame, Beef, Wheat, Droplet } from 'lucide-react';

export default function Nutrition() {
  const { state } = useContext(FridgeContext);
  const totals = getTotalNutrition(state.inventory);

  return (
    <div className="page-content fade-in">
      <h1 className="page-title">Nutrition Analyzer</h1>
      <p className="page-subtitle">Track the total macros and calories available in your fridge.</p>

      <div className="grid grid-4" style={{ marginBottom: '40px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--orange)' }}><Flame /></div>
          <div className="stat-info"><h3>Total Calories</h3><p>{formatNutrient(totals.calories)} kcal</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)' }}><Beef /></div>
          <div className="stat-info"><h3>Total Protein</h3><p>{formatNutrient(totals.protein)} g</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--yellow)' }}><Wheat /></div>
          <div className="stat-info"><h3>Total Carbs</h3><p>{formatNutrient(totals.carbs)} g</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--green)' }}><Droplet /></div>
          <div className="stat-info"><h3>Total Fat</h3><p>{formatNutrient(totals.fat)} g</p></div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Item Breakdown</h2>
        <div className="item-list">
          {state.inventory.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-left">
                <span style={{ fontSize: '24px' }}>{CATEGORY_ICONS[item.category] || '📦'}</span>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{item.quantity} {item.unit}</div>
                </div>
              </div>
              <div className="item-right" style={{ gap: '20px', textAlign: 'right' }}>
                <div><small style={{ color: 'var(--text-muted)' }}>Calories</small><div>{Math.round(getScaledNutrient(item.calories, item.quantity, item.unit))}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Protein</small><div>{Math.round(getScaledNutrient(item.protein, item.quantity, item.unit))}g</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Carbs</small><div>{Math.round(getScaledNutrient(item.carbs, item.quantity, item.unit))}g</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Fat</small><div>{Math.round(getScaledNutrient(item.fat, item.quantity, item.unit))}g</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
