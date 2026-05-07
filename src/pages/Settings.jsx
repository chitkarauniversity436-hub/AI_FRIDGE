import React, { useContext, useState } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { HEALTH_MODES } from '../utils/nutritionUtils';
import { Settings, Users, Key, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const { state, dispatch } = useContext(FridgeContext);
  
  const [apiKey, setApiKey]           = useState(state.settings.apiKey || '');
  const [voiceApiKey, setVoiceApiKey] = useState(state.settings.voiceApiKey || '');
  const [voiceProvider, setVoiceProvider] = useState(state.settings.voiceProvider || 'groq');
  const [saved, setSaved]             = useState(false);

  const PROVIDERS = [
    { id: 'groq',   label: 'Groq (Llama 3)',        badge: '🟢 Free',       hint: 'Get free key → console.groq.com',     placeholder: 'gsk_...' },
    { id: 'gemini', label: 'Google Gemini',          badge: '🟡 Free/Paid',  hint: 'Get key → aistudio.google.com',       placeholder: 'AIza...' },
    { id: 'openai', label: 'OpenAI (ChatGPT)',        badge: '🔵 Paid',       hint: 'Get key → platform.openai.com',       placeholder: 'sk-...' },
  ];
  const activeProvider = PROVIDERS.find(p => p.id === voiceProvider) || PROVIDERS[0];

  const saveSettings = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { apiKey, voiceApiKey, voiceProvider } });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-content fade-in">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Settings /> Settings</h1>
      <p className="page-subtitle">Configure your smart fridge preferences.</p>

      <div className="grid grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Key size={20} /> AI Configuration</h2>

            {/* Main API key */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Gemini API Key <span style={{ fontSize: '11px' }}>(Recipes, Nutrition, Meal Plan…)</span></label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AI Studio API Key..."
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Required for AI features. If empty, app uses mock data.
              </small>
            </div>

            {/* Voice assistant section */}
            <div style={{ marginBottom: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                🎙️ Voice Assistant Provider
              </label>

              {/* Provider pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setVoiceProvider(p.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: `2px solid ${voiceProvider === p.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: voiceProvider === p.id ? 'rgba(0,245,160,0.12)' : 'transparent',
                      color: voiceProvider === p.id ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: voiceProvider === p.id ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {p.badge} {p.label}
                  </button>
                ))}
              </div>

              {/* Key input for selected provider */}
              <input
                type="password"
                value={voiceApiKey}
                onChange={e => setVoiceApiKey(e.target.value)}
                placeholder={`${activeProvider.label} API key... (${activeProvider.placeholder})`}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                {activeProvider.hint} &nbsp;·&nbsp; Leave empty to use the main Gemini key above.
              </small>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Diet / Health Mode</label>
              <select 
                value={state.settings.healthMode} 
                onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { healthMode: e.target.value }})}
              >
                {HEALTH_MODES.map(mode => (
                  <option key={mode.id} value={mode.id}>{mode.icon} {mode.label}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
            {saved && <span style={{ color: 'var(--green)', marginLeft: '12px' }}>Saved!</span>}
          </div>

          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Moon size={20} /> Appearance</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Theme Preference</span>
              <button className="btn" onClick={() => dispatch({ type: 'TOGGLE_THEME' })}>
                {state.theme === 'dark' ? <><Sun size={16}/> Light Mode</> : <><Moon size={16}/> Dark Mode</>}
              </button>
            </div>
          </div>

        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Users size={20} /> Family Members</h2>
          <div className="item-list">
            {state.family.map(member => (
              <div key={member.id} className="item-row">
                <div className="item-left">
                  <span style={{ fontSize: '24px' }}>{member.avatar}</span>
                  <div>
                    <strong>{member.name}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{member.email}</div>
                  </div>
                </div>
                <div className="item-right">
                  <span className="badge" style={{ background: member.role === 'Admin' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255,255,255,0.1)', color: member.role === 'Admin' ? 'var(--primary)' : 'var(--text-main)' }}>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn" style={{ width: '100%', marginTop: '20px' }}>Add Family Member</button>
        </div>
      </div>
    </div>
  );
}
