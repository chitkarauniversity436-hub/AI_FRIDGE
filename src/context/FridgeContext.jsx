import { createContext, useReducer, useEffect } from 'react';

export const FridgeContext = createContext();

const getSafeToken = () => {
  const t = localStorage.getItem('fridgeToken');
  return (t === 'null' || t === 'undefined' || !t) ? null : t;
};

const getSafeUser = () => {
  try {
    const u = localStorage.getItem('fridgeUser');
    if (!u || u === 'null' || u === 'undefined') return null;
    return JSON.parse(u);
  } catch (e) {
    localStorage.removeItem('fridgeUser');
    return null;
  }
};

const initialState = {
  inventory: [],
  orders: [],
  family: [],
  settings: {
    apiKey: '',
    healthMode: 'none',
    notifications: true,
  },
  theme: 'dark',
  token: getSafeToken(),
  user: getSafeUser(),
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('fridgeToken', action.payload.token);
      localStorage.setItem('fridgeUser', JSON.stringify(action.payload.user));
      return { ...state, token: action.payload.token, user: action.payload.user };
    case 'LOGOUT':
      localStorage.removeItem('fridgeToken');
      localStorage.removeItem('fridgeUser');
      return { ...state, token: null, user: null, inventory: [], orders: [], family: [] };
    case 'LOAD_STATE':
      return { 
        ...state, 
        ...action.payload, 
        inventory: Array.isArray(action.payload?.inventory) ? action.payload.inventory : [],
        orders: Array.isArray(action.payload?.orders) ? action.payload.orders : [],
        family: Array.isArray(action.payload?.family) ? action.payload.family : [],
        settings: action.payload?.settings || initialState.settings,
        token: state.token, 
        user: state.user 
      };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_FAMILY':
      return { ...state, family: action.payload };
    case 'ADD_ITEM':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };
    case 'UPDATE_ITEM':
      return { ...state, inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    default:
      return state;
  }
};

export const FridgeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchData = async () => {
      if (!state.token) return;
      try {
        const headers = { 'Authorization': `Bearer ${state.token}` };
        
        const [invRes, ordRes, famRes] = await Promise.all([
          fetch('/api/inventory', { headers }),
          fetch('/api/orders', { headers }),
          fetch('/api/family', { headers }),
        ]);

        if (invRes.ok) {
          const invData = await invRes.json();
          dispatch({ type: 'SET_INVENTORY', payload: invData });
        }
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          dispatch({ type: 'SET_ORDERS', payload: ordData });
        }
        if (famRes.ok) {
          const famData = await famRes.json();
          dispatch({ type: 'SET_FAMILY', payload: famData });
        }
      } catch (err) {
        console.error('Failed to fetch data from API', err);
      }
    };

    const saved = localStorage.getItem('fridgeStateLocal');
    if (saved) {
      const parsed = JSON.parse(saved);
      dispatch({ type: 'LOAD_STATE', payload: { ...parsed, inventory: [], orders: [], family: [] } });
    }

    fetchData();
  }, [state.token]);

  useEffect(() => {
    const localState = { ...state, inventory: [], orders: [], family: [], token: null, user: null };
    localStorage.setItem('fridgeStateLocal', JSON.stringify(localState));
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.settings, state.theme]);

  const login = async (email, password) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid credentials');
      }
      const data = await res.json();
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return true;
    } catch (err) { 
      if (err.name === 'AbortError') throw new Error('Connection timed out. Server might be slow.');
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return true;
    } catch (err) { 
      throw err;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    window.location.href = '/';
  };

  const apiDispatch = async (action) => {
    if (!state.token) return;

    const headers = { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${state.token}` 
    };

    if (action.type === 'ADD_ITEM') {
      try {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers,
          body: JSON.stringify(action.payload)
        });
        if (res.ok) {
          const savedItem = await res.json();
          dispatch({ type: 'ADD_ITEM', payload: savedItem });
        }
      } catch (err) { console.error('Add Item API failed', err); }
      return;
    }
    
    if (action.type === 'REMOVE_ITEM') {
      try {
        await fetch(`/api/inventory/${action.payload}`, { 
          method: 'DELETE',
          headers
        });
        dispatch({ type: 'REMOVE_ITEM', payload: action.payload });
      } catch (err) { console.error('Delete Item API failed', err); }
      return;
    }

    if (action.type === 'UPDATE_ITEM') {
      try {
        const res = await fetch(`/api/inventory/${action.payload.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(action.payload)
        });
        if (res.ok) {
          const updatedItem = await res.json();
          dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
        }
      } catch (err) { console.error('Update Item API failed', err); }
      return;
    }

    dispatch(action);
  };

  const value = { state, dispatch: apiDispatch, login, register, logout };
  return <FridgeContext.Provider value={value}>{children}</FridgeContext.Provider>;
};
