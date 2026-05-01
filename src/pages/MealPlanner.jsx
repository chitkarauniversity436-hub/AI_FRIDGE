import { useContext, useState, useEffect, useCallback } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { useAI } from '../hooks/useAI';
import { CalendarDays, Sun, CloudSun, Moon, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function MealPlanner() {
  const { state } = useContext(FridgeContext);
  const { getMealPlan } = useAI(state.settings.apiKey);
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMealPlan(state.inventory, state.settings.healthMode);
      setPlan(data);
    } catch (err) {
      console.error('Failed to fetch meal plan', err);
    }
    setLoading(false);
  }, [getMealPlan, state.inventory, state.settings.healthMode]);

  useEffect(() => {
    if (state.inventory.length > 0 && !plan) fetchPlan();
  }, [state.inventory, plan, fetchPlan]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <Sparkles color="var(--primary)" /> AI Weekly Meal Planner
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {state.settings.apiKey ? (
              <span style={{ color: 'var(--green)' }}>● Connected to Gemini Real-time</span>
            ) : (
              <span style={{ color: 'var(--orange)' }}>● Demo Mode Active</span>
            )}
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={fetchPlan} 
          disabled={loading || !state.settings.apiKey}
          style={{ gap: '10px', padding: '12px 24px' }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Generating...' : 'Generate New Plan'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
           <CalendarDays size={64} style={{ animation: 'pulse 2s infinite', marginBottom: '20px', color: 'var(--primary)' }} />
           <h2 style={{ fontSize: '24px', color: '#fff' }}>Crafting your personalized week...</h2>
           <p>Optimizing for nutrition and reducing food waste.</p>
        </div>
      ) : plan ? (
        <div className="meal-grid">
          {days.map(day => (
            <div key={day} className="day-card card">
              <div className="day-header">
                <h2>{day}</h2>
                <div className="day-tag">Optimized</div>
              </div>
              
              <div className="meals-container">
                <div className="meal-box">
                  <div className="meal-label" style={{ color: 'var(--yellow)' }}>
                    <Sun size={14} /> BREAKFAST
                  </div>
                  <div className="meal-text">{plan[day]?.breakfast || 'Healthy Cereal & Fruits'}</div>
                  <div className="meal-check"><CheckCircle2 size={12}/> On Track</div>
                </div>
                
                <div className="meal-box">
                  <div className="meal-label" style={{ color: 'var(--orange)' }}>
                    <CloudSun size={14} /> LUNCH
                  </div>
                  <div className="meal-text">{plan[day]?.lunch || 'Vegetable Wrap & Salad'}</div>
                  <div className="meal-check"><CheckCircle2 size={12}/> High Protein</div>
                </div>
                
                <div className="meal-box">
                  <div className="meal-label" style={{ color: 'var(--primary)' }}>
                    <Moon size={14} /> DINNER
                  </div>
                  <div className="meal-text">{plan[day]?.dinner || 'Roasted Protein & Veggies'}</div>
                  <div className="meal-check"><CheckCircle2 size={12}/> Low Carb</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No inventory found</h3>
          <p>Add some items to your fridge to generate a custom meal plan.</p>
        </div>
      )}

      <style>{`
        .meal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .day-card {
          display: grid;
          grid-template-columns: 200px 1fr;
          padding: 0 !important;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.2s;
        }
        .day-card:hover { transform: scale(1.01); border-color: var(--primary); }
        
        .day-header {
          background: rgba(255,255,255,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .day-header h2 { margin: 0; font-size: 28px; color: var(--primary); letter-spacing: -1px; }
        .day-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; background: var(--green); color: #000; padding: 2px 8px; border-radius: 4px; margin-top: 8px; }

        .meals-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.05);
        }
        .meal-box {
          background: var(--card-bg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .meal-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .meal-text {
          font-size: 16px;
          line-height: 1.5;
          color: var(--text-main);
          flex: 1;
        }
        .meal-check {
          font-size: 10px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }

        @media (max-width: 1000px) {
          .day-card { grid-template-columns: 1fr; }
          .day-header { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 20px; }
          .meals-container { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
