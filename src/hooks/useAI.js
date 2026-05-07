import { useCallback } from 'react';

// Primary model (15 RPM free). Falls back to lite (30 RPM free) on quota errors.
const GEMINI_FLASH      = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_FLASH_LITE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

/**
 * Send one request to a Gemini endpoint.
 * Returns { ok, text, status, errorMsg }
 */
const callGemini = async (url, key, prompt, maxTokens = 1500) => {
  let res;
  try {
    res = await fetch(`${url}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens },
      }),
    });
  } catch (networkErr) {
    return { ok: false, status: 0, errorMsg: 'Network error: cannot reach Gemini API.' };
  }

  if (!res.ok) {
    let errorMsg = `Gemini API error (HTTP ${res.status})`;
    try {
      const body = await res.json();
      const detail = body?.error?.message || '';
      if (detail.toLowerCase().includes('api key not valid') || res.status === 400) {
        errorMsg = 'Invalid API key. Double-check the key you entered in Settings.';
      } else if (res.status === 403) {
        errorMsg = 'API key lacks permission. Enable "Generative Language API" in Google Cloud Console.';
      } else if (res.status === 429) {
        errorMsg = 'Rate limit hit on this model — retrying with a faster model...';
      } else if (detail) {
        errorMsg = detail;
      }
    } catch (_) { /* keep default */ }
    return { ok: false, status: res.status, errorMsg };
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return { ok: true, text: text || null };
};

/**
 * Calls flash first; on 429 automatically falls back to flash-lite.
 * Throws a descriptive Error so callers can surface it in the UI.
 */
const geminiPost = async (key, prompt, maxTokens = 1500) => {
  // Try primary model
  let result = await callGemini(GEMINI_FLASH, key, prompt, maxTokens);

  // Auto-fallback to lite on rate limit
  if (!result.ok && result.status === 429) {
    console.warn('gemini-2.0-flash quota hit — falling back to gemini-2.0-flash-lite');
    result = await callGemini(GEMINI_FLASH_LITE, key, prompt, maxTokens);
    if (!result.ok && result.status === 429) {
      throw new Error('Both Gemini models are rate-limited. Wait ~60 seconds and try again.');
    }
  }

  if (!result.ok) throw new Error(result.errorMsg);
  if (!result.text) throw new Error('Gemini returned an empty response. Quota may be exhausted.');
  return result.text;
};

// ─────────────────────────────────────────────────────────────────
// OpenAI (ChatGPT) — gpt-4o-mini is cheap (~$0.00015 / 1K tokens)
// Free trial: $5 credit on sign-up → platform.openai.com
// ─────────────────────────────────────────────────────────────────
const callOpenAI = async (key, prompt, maxTokens = 500) => {
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });
  } catch (err) {
    throw new Error('Network error: cannot reach OpenAI API.');
  }
  if (!res.ok) {
    let msg = `OpenAI error (HTTP ${res.status})`;
    try {
      const b = await res.json();
      if (res.status === 401) msg = 'Invalid OpenAI API key. Check platform.openai.com → API Keys.';
      else if (res.status === 429) msg = 'OpenAI rate limit or quota exceeded. Check your billing at platform.openai.com.';
      else if (res.status === 403) msg = 'OpenAI API key does not have permission for this model.';
      else msg = b?.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI returned an empty response.');
  return text;
};

// ─────────────────────────────────────────────────────────────────
// Groq — FREE tier: 30 req/min, 14 400 req/day, ultra-fast Llama
// Sign up free → console.groq.com → API Keys
// ─────────────────────────────────────────────────────────────────
const callGroq = async (key, prompt, maxTokens = 500) => {
  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });
  } catch (err) {
    throw new Error('Network error: cannot reach Groq API.');
  }
  if (!res.ok) {
    let msg = `Groq error (HTTP ${res.status})`;
    try {
      const b = await res.json();
      if (res.status === 401) msg = 'Invalid Groq API key. Check console.groq.com → API Keys.';
      else if (res.status === 429) msg = 'Groq rate limit hit. Wait a moment — free tier resets every minute.';
      else msg = b?.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned an empty response.');
  return text;
};

export const useAI = (apiKey) => {
  const ask = useCallback(async (prompt) => {
    if (!apiKey) return null;
    const cleanKey = apiKey.trim();
    try {
      return await geminiPost(cleanKey, prompt, 1500);
    } catch (err) {
      console.error('Gemini ask() error:', err.message);
      return null;   // non-voice callers fall back to mock data on null
    }
  }, [apiKey]);
  
  const getNutrition = useCallback(async (itemName) => {
    if (!apiKey) {
      const mockDB = {
        'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
        'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
        'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
        'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
        'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        'oats': { calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
        'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
        'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
        'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
        'protein bar': { calories: 200, protein: 20, carbs: 25, fat: 7 },
      };
      const name = itemName.toLowerCase();
      const match = Object.keys(mockDB).find(k => name.includes(k));
      return mockDB[match] || { calories: 100, protein: 5, carbs: 10, fat: 2 };
    }
    const prompt = `You are a nutrition database. For the item "${itemName}", provide average nutrition facts per 100g.
    Provide: Calories (number), Protein (number in g), Carbs (number in g), Fat (number in g).
    Format as JSON: {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    Only respond with the JSON.`;
    const raw = await ask(prompt);
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
    } catch (e) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }, [ask]);

  const getRecipes = useCallback(async (items, healthMode = 'none', macroGoal = 'balanced') => {
    const itemNames = items.slice(0, 50).map(i => i.name).join(', ');
    const modeText = healthMode !== 'none' ? `The user follows a ${healthMode} diet.` : '';
    const macroText = macroGoal !== 'balanced' ? `The recipes MUST be rich in ${macroGoal}.` : 'The recipes should be balanced.';
    const prompt = `You are a chef AI. Given these fridge items: ${itemNames}. ${modeText} ${macroText}
Suggest 3 recipes I can make RIGHT NOW using ONLY the ingredients listed above. It is very important that you try to use the variety of items provided. Do not suggest recipes that require buying new major ingredients. Small pantry staples like salt, oil, or water are okay.
For each recipe provide:
- Name (emoji + name)
- Prep time
- Difficulty (Easy, Medium, Hard)
- Nutrition (calories, protein, fat)
- ingredientsFromFridge (Array of items EXACTLY as they appear in my inventory)
- pantryStaples (Array of items like salt, oil, water)
- 3 ULTRA-CONCISE, one-sentence steps
Format as JSON array: [{"name":"...","prepTime":"...","difficulty":"...","nutrition":{"calories":0,"protein":"...","fat":"..."},"ingredientsFromFridge":["..."],"pantryStaples":["..."],"steps":["..."],"mood":"..."}]
Only respond with the JSON array, no extra text.`;
    const raw = await ask(prompt);
    if (!raw) return getMockRecipes(items);
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : getMockRecipes(items);
    } catch { return getMockRecipes(items); }
  }, [ask]);

  const getMealPlan = useCallback(async (items, healthMode = 'none') => {
    const itemNames = items.map(i => i.name).join(', ');
    const modeText = healthMode !== 'none' ? `Diet mode: ${healthMode}.` : '';
    const prompt = `You are a nutritionist AI. Available fridge items: ${itemNames}. ${modeText}
Create a UNIQUE and creative 7-day meal plan (Mon–Sun). Each day has Breakfast, Lunch, Dinner.
Ensure the recipes are diverse and use the available ingredients in different ways.
Timestamp: ${Date.now()} (Use this to ensure uniqueness).
Format as JSON: {"Monday":{"breakfast":"...","lunch":"...","dinner":"..."},...}
Only respond with JSON, no extra text.`;
    const raw = await ask(prompt);
    if (!raw) return getMockMealPlan();
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : getMockMealPlan();
    } catch { return getMockMealPlan(); }
  }, [ask]);

  const getShoppingList = useCallback(async (missingItems, healthMode = 'none') => {
    const names = missingItems.map(i => i.name).join(', ');
    const modeText = healthMode !== 'none' ? `User is on a ${healthMode} diet.` : '';
    const prompt = `Based on these low/expired fridge items: ${names}. ${modeText}
Suggest a complete smart shopping list with quantities and categories.
Format as JSON array: [{"name":"...","quantity":"...","unit":"...","category":"...","estimatedPrice":0}]
Only respond with JSON array.`;
    const raw = await ask(prompt);
    if (!raw) return [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch { return []; }
  }, [ask]);

  const analyzeImage = useCallback(async (base64Data, mimeType) => {
    if (!apiKey) return null;
    const cleanKey = apiKey.trim();
    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${cleanKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "You are a fridge vision AI. Identify all food items in this image. For each item, provide: Name, Category, and Estimated Quantity (with unit). Format as JSON array: [{\"name\":\"...\",\"category\":\"...\",\"quantity\":0,\"unit\":\"...\"}] Only respond with JSON." },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
        }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : null;
    } catch (err) {
      console.error("Vision AI Error:", err);
      return null;
    }
  }, [apiKey]);

  const getPriceComparison = useCallback(async (items) => {
    const names = items.map(i => i.name).join(', ');
    const prompt = `Given these shopping list items: ${names}. 
Suggest estimated prices (in local currency ₹) for these items at 3 different stores: BigBasket, Amazon Fresh, and Instamart.
Format as JSON: {"BigBasket": {"total": 0, "items": [{"name": "...", "price": 0}]}, "AmazonFresh": {"total": 0, "items": [{"name": "...", "price": 0}]}, "Instamart": {"total": 0, "items": [{"name": "...", "price": 0}]}}
Only respond with JSON.`;
    const raw = await ask(prompt);
    if (!raw) return null;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch { return null; }
  }, [ask]);


  // askVoice throws real errors so VoiceAssistant can display exactly what failed.
  // provider: 'gemini' | 'openai' | 'groq'
  const askVoice = useCallback(async (prompt, provider = 'gemini') => {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('No API key set for voice assistant. Go to Settings → AI Configuration to add one.');
    }
    const key = apiKey.trim();
    if (provider === 'openai') return await callOpenAI(key, prompt, 500);
    if (provider === 'groq')   return await callGroq(key, prompt, 500);
    // default: gemini (with flash-lite fallback)
    return await geminiPost(key, prompt, 800);
  }, [apiKey]);

  return { getRecipes, getMealPlan, getShoppingList, askVoice, getNutrition, analyzeImage, getPriceComparison };
};

const getMockRecipes = (items = []) => {
  const realNames = items.length > 0 ? items.map(i => i.name) : ['Apples', 'Eggs', 'Milk'];
  const titles = [
    { name: '🍳 Morning Scramble', mood: 'Quick Breakfast', difficulty: 'Easy', nutri: { calories: 350, protein: '20g', fat: '15g' }, steps: ['Whisk eggs.', 'Sauté available veggies.', 'Fold and serve.'] },
    { name: '🥗 Garden Fresh Bowl', mood: 'Light Lunch', difficulty: 'Easy', nutri: { calories: 250, protein: '10g', fat: '8g' }, steps: ['Chop ingredients.', 'Mix in a bowl.', 'Season and serve.'] },
    { name: '🍗 Protein Power Plate', mood: 'Fitness Dinner', difficulty: 'Medium', nutri: { calories: 550, protein: '45g', fat: '12g' }, steps: ['Season protein.', 'Pan sear until golden.', 'Serve with greens.'] },
    { name: '🥘 One-Pot Wonder', mood: 'Easy Dinner', difficulty: 'Medium', nutri: { calories: 480, protein: '25g', fat: '18g' }, steps: ['Combine all items.', 'Simmer for 20 mins.', 'Enjoy hot.'] },
    { name: '🥑 Keto Delight', mood: 'Low Carb', difficulty: 'Easy', nutri: { calories: 400, protein: '15g', fat: '35g' }, steps: ['Slice healthy fats.', 'Combine with protein.', 'Drizzle with oil.'] },
  ];
  
  const shuffle = () => {
    const list = [...titles].sort(() => 0.5 - Math.random());
    return list.slice(0, 3).map(r => {
      const shuffledNames = [...realNames].sort(() => 0.5 - Math.random());
      return {
        ...r,
        nutrition: r.nutri,
        ingredientsFromFridge: shuffledNames.slice(0, 2),
        pantryStaples: ['Salt', 'Oil']
      };
    });
  };
  
  return shuffle();
};

const getMockMealPlan = () => {
  const breakfasts = ['Banana Smoothie', 'Avocado Toast', 'Greek Yogurt & Berries', 'Oatmeal with Honey', 'Scrambled Eggs', 'Fruit Salad', 'Pancakes', 'Chia Pudding'];
  const lunches = ['Quinoa Salad', 'Chicken Wrap', 'Lentil Soup', 'Turkey Sandwich', 'Pasta Primavera', 'Greek Salad', 'Vegetable stir-fry', 'Caprese Panini'];
  const dinners = ['Grilled Salmon', 'Beef Stew', 'Roasted Chicken', 'Vegetable Lasagna', 'Tofu Stir-fry', 'Spaghetti Bolognese', 'Baked Cod', 'Stuffed Peppers'];
  
  const shuffle = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan = {};
  days.forEach(d => {
    plan[d] = {
      breakfast: shuffle(breakfasts),
      lunch: shuffle(lunches),
      dinner: shuffle(dinners)
    };
  });
  return plan;
};
