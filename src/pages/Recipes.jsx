import { useContext, useState, useEffect, useCallback } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { useAI } from '../hooks/useAI';
import { ChefHat, Clock, Sparkles, Flame, Play, CheckCircle2, RotateCw, Beef, Wheat, Droplet, Zap, UtensilsCrossed } from 'lucide-react';

export default function Recipes() {
  const { state, dispatch } = useContext(FridgeContext);
  const { getRecipes } = useAI(state.settings.apiKey);
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [macroGoal, setMacroGoal] = useState('balanced');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const data = await getRecipes(state.inventory, state.settings.healthMode, macroGoal);
    setRecipes(data);
    setLoading(false);
  }, [getRecipes, state.inventory, state.settings.healthMode, macroGoal]);

  useEffect(() => {
    if (state.inventory.length > 0) fetchRecipes();
  }, [fetchRecipes]);

  const getDifficultyColor = (d) => {
    switch (d?.toLowerCase()) {
      case 'easy': return 'var(--green)';
      case 'medium': return 'var(--yellow)';
      case 'hard': return 'var(--red)';
      default: return 'var(--primary)';
    }
  };

  const goals = [
    { id: 'balanced', label: 'Balanced', icon: <Zap size={14}/> },
    { id: 'protein', label: 'High Protein', icon: <Beef size={14}/> },
    { id: 'carbs', label: 'High Carbs', icon: <Wheat size={14}/> },
    { id: 'fats', label: 'Healthy Fats', icon: <Droplet size={14}/> },
  ];

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Sparkles color="var(--primary)" /> AI Recipe Studio
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
             {state.settings.apiKey ? (
              <span style={{ color: 'var(--green)' }}>● AI Mode Active</span>
            ) : (
              <span style={{ color: 'var(--orange)' }}>● Demo Mode Active</span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={fetchRecipes} disabled={loading || !state.settings.apiKey}>
          <RotateCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> 
          {loading ? 'Analyzing...' : 'Regenerate Recipes'}
        </button>
      </div>

      {!state.settings.apiKey && (
        <div className="card" style={{ background: 'rgba(255, 150, 0, 0.1)', border: '1px solid var(--orange)', marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap color="var(--orange)" />
            <div>
              <strong style={{ color: 'var(--orange)' }}>AI Connectivity Restricted</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                You are currently viewing <strong>Demo Recipes</strong>. To get real recipes using your inventory (Apples, Oats, etc.), please 
                <a href="/settings" style={{ color: '#fff', marginLeft: '6px', fontWeight: 'bold' }}>Enter your Gemini API Key in Settings →</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="goal-selector">
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nutrition Goal:</span>
        <div className="goal-pills">
          {goals.map(goal => (
            <button 
              key={goal.id} 
              className={`goal-pill ${macroGoal === goal.id ? 'active' : ''}`}
              onClick={() => setMacroGoal(goal.id)}
            >
              {goal.icon} {goal.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
          <ChefHat size={64} style={{ animation: 'float 3s ease-in-out infinite', marginBottom: '20px', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '24px', color: '#fff' }}>AI is crafting your {macroGoal} menu...</h2>
          <p>Looking for the perfect match for your items...</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {recipes.map((r, idx) => (
            <div key={idx} className="card recipe-card">
              <div className="recipe-badge">{r.mood}</div>
              
              <div style={{ marginTop: '10px' }}>
                <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>{r.name}</h2>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span className="info-tag"><Clock size={12}/> {r.prepTime}</span>
                  <span className="info-tag" style={{ color: getDifficultyColor(r.difficulty) }}>
                    <Flame size={12}/> {r.difficulty}
                  </span>
                  <span className="info-tag" style={{ color: 'var(--secondary)' }}>
                    {r.nutrition?.calories} kcal
                  </span>
                </div>

                <div className="section-title"><CheckCircle2 size={12} color="var(--green)"/> Use from Fridge:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {(r.ingredientsFromFridge || r.ingredients || []).map((ing, i) => (
                    <span key={i} className="ing-tag fridge-ing">{ing}</span>
                  ))}
                </div>

                <div className="section-title"><UtensilsCrossed size={12} color="var(--text-muted)"/> Pantry Staples:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {(r.pantryStaples || []).map((ing, i) => (
                    <span key={i} className="ing-tag pantry-ing">{ing}</span>
                  ))}
                </div>

                <div className="section-title">Quick Steps:</div>
                <div className="steps-container">
                  {r.steps.map((step, i) => (
                    <div key={i} className="step-row">
                      <div className="step-num">{i+1}</div>
                      <div className="step-text">{step}</div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary cook-btn" onClick={() => setCookingRecipe(r)}>
                  <Play size={16} fill="currentColor" /> Start Cooking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cookingRecipe && (
        <div className="modal-overlay" onClick={() => setCookingRecipe(null)}>
          <div className="modal-content card cooking-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '32px' }}>{cookingRecipe.name}</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Follow the steps below to prepare your meal.</p>
              </div>
              <button className="btn" onClick={() => setCookingRecipe(null)}>Close</button>
            </div>
            
            <div className="cooking-grid">
              <div className="steps-main">
                {cookingRecipe.steps.map((step, i) => (
                  <div key={i} className="big-step-card">
                    <div className="big-step-num">Step {i+1}</div>
                    <div className="big-step-text">{step}</div>
                  </div>
                ))}
                <button className="btn btn-primary" style={{ width: '100%', padding: '20px', fontSize: '20px' }} onClick={async () => {
                  const itemsToDeduct = cookingRecipe.ingredientsFromFridge || cookingRecipe.ingredients || [];
                  for (const ingName of itemsToDeduct) {
                    const item = state.inventory.find(i => i.name.toLowerCase().includes(ingName.toLowerCase()));
                    if (item) {
                      const newQty = Math.max(0, item.quantity - 1); 
                      if (newQty === 0) {
                        dispatch({ type: 'REMOVE_ITEM', payload: item.id });
                      } else {
                        dispatch({ type: 'UPDATE_ITEM', payload: { ...item, quantity: newQty } });
                      }
                    }
                  }
                  alert('🍽️ Enjoy your meal! Fridge items have been automatically deducted.');
                  setCookingRecipe(null);
                }}>
                  ✨ I've Finished Cooking!
                </button>
              </div>
              
              <div className="cooking-sidebar">
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h3 style={{ marginTop: 0 }}>Nutritional Info</h3>
                  <div className="nutri-stat"><span>Calories</span> <strong>{cookingRecipe.nutrition?.calories} kcal</strong></div>
                  <div className="nutri-stat"><span>Protein</span> <strong>{cookingRecipe.nutrition?.protein}</strong></div>
                  <div className="nutri-stat"><span>Fat</span> <strong>{cookingRecipe.nutrition?.fat}</strong></div>
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginTop: '20px' }}>
                  <h3 style={{ marginTop: 0 }}>Fridge Items</h3>
                  {(cookingRecipe.ingredientsFromFridge || cookingRecipe.ingredients || []).map((ing, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                       🧊 {ing}
                    </div>
                  ))}
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginTop: '20px' }}>
                  <h3 style={{ marginTop: 0 }}>Pantry Staples</h3>
                  {(cookingRecipe.pantryStaples || []).map((ing, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', color: 'var(--text-muted)' }}>
                       🧂 {ing}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .goal-selector {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .goal-pills { display: flex; gap: 10px; }
        .goal-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .goal-pill:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .goal-pill.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
        }

        .recipe-card {
          position: relative;
          padding: 24px;
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .recipe-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow);
          border-color: var(--primary);
        }
        .recipe-badge {
          position: absolute;
          top: -12px;
          right: 20px;
          background: var(--primary);
          color: #000;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .info-tag {
          display: flex;
          align-items: center; gap: 5px;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          font-size: 12px;
          font-weight: 600;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ing-tag {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .fridge-ing { background: rgba(0,245,160,0.08); color: var(--primary); border: 1px solid rgba(0,245,160,0.2); }
        .pantry-ing { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); }

        .steps-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .step-row { display: flex; gap: 10px; align-items: flex-start; }
        .step-num {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--primary);
          color: #000;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 900;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .step-text { font-size: 13px; color: var(--text-main); line-height: 1.4; }
        .cook-btn { width: 100%; padding: 12px; justify-content: center; gap: 10px; font-size: 16px; border-radius: 12px; }
        
        .cooking-modal { max-width: 1000px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 40px; }
        .cooking-grid { display: grid; grid-template-columns: 1fr 300px; gap: 30px; }
        .big-step-card { padding: 24px; background: rgba(255,255,255,0.03); border-radius: 16px; margin-bottom: 20px; border-left: 4px solid var(--primary); }
        .big-step-num { font-size: 12px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 8px; }
        .big-step-text { font-size: 18px; line-height: 1.6; }
        .nutri-stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); }
        
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
