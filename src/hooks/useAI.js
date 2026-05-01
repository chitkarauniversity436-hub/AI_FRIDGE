import { useCallback } from 'react';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const useAI = (apiKey) => {
  const ask = useCallback(async (prompt) => {
    if (!apiKey) return null;
    const cleanKey = apiKey.trim();
    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${cleanKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
        }),
      });
      if (!res.ok) {
        const errorBody = await res.json();
        console.error("Gemini API Error:", errorBody);
        return null;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn("AI returned empty content. Check your API quota.");
        return null;
      }
      return text;
    } catch (err) {
      console.error("Gemini Network Error (Check your Internet):", err);
      return null;
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


  const askVoice = useCallback(async (prompt) => {
    const aiPrompt = `The user is talking to their smart fridge. They said: "${prompt}". 
    Give a short, helpful, and friendly response. If they ask about recipes or food, give a quick suggestion based on common fridge items.
    Keep it under 2 sentences.`;
    return await ask(aiPrompt);
  }, [ask]);

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
