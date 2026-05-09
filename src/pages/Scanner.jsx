import React, { useState, useEffect, useRef, useContext } from 'react';
import { ScanBarcode, Upload, Loader2, Search } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { FridgeContext } from '../context/FridgeContext';

export default function Scanner() {
  const { state, dispatch } = useContext(FridgeContext);
  const [result, setResult] = useState(null);
  
  const { analyzeImage } = useAI(state.settings?.apiKey || '');
  const [activeTab, setActiveTab] = useState('barcode');
  const [visionResults, setVisionResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const timeoutRef = useRef(null);

  // Hardware scanner listener
  useEffect(() => {
    if (activeTab !== 'barcode') return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an actual input field somewhere else
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          handleBarcodeScanned(barcodeBuffer);
        }
        setBarcodeBuffer('');
      } else {
        if (e.key.length === 1) { // printable character
          setBarcodeBuffer(prev => prev + e.key);
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          // Hardware scanners type very fast. Clear buffer if there is a pause > 100ms
          timeoutRef.current = setTimeout(() => {
            setBarcodeBuffer('');
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeTab, barcodeBuffer]);

  const handleBarcodeScanned = async (barcode) => {
    setResult(barcode);
    setIsFetchingProduct(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1) {
        const product = data.product;
        const name = product.product_name || 'Unknown Product';
        let rawCategory = product.categories ? product.categories.toLowerCase() : '';
        let mappedCategory = 'Other';
        if (rawCategory.includes('dairy') || rawCategory.includes('lait') || rawCategory.includes('cheese') || rawCategory.includes('milk')) mappedCategory = 'Dairy';
        else if (rawCategory.includes('vegetable') || rawCategory.includes('légume')) mappedCategory = 'Vegetables';
        else if (rawCategory.includes('fruit')) mappedCategory = 'Fruits';
        else if (rawCategory.includes('meat') || rawCategory.includes('fish') || rawCategory.includes('poisson') || rawCategory.includes('viande') || rawCategory.includes('chicken') || rawCategory.includes('poulet')) mappedCategory = 'Protein';
        else if (rawCategory.includes('grain') || rawCategory.includes('cereal') || rawCategory.includes('bread') || rawCategory.includes('pain')) mappedCategory = 'Grains';
        else if (rawCategory.includes('frozen') || rawCategory.includes('glace') || rawCategory.includes('surgelé')) mappedCategory = 'Frozen';
        else if (rawCategory.includes('beverage') || rawCategory.includes('boisson') || rawCategory.includes('drink')) mappedCategory = 'Beverages';
        
        dispatch({ 
          type: 'ADD_ITEM', 
          payload: { 
            name: name,
            category: mappedCategory,
            quantity: 1,
            unit: "pc",
            id: Date.now() + Math.random(), 
            expiryDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], 
            threshold: 1 
          } 
        });
        alert(`Successfully added ${name} to your inventory!`);
      } else {
        alert('Product not found in Open Food Facts database. Please add it manually.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching product details.');
    } finally {
      setIsFetchingProduct(false);
      setTimeout(() => setResult(null), 3000); // Clear result message after 3 seconds
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setVisionResults(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const results = await analyzeImage(base64, file.type);
      setVisionResults(results);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const addAllDetected = () => {
    if (!visionResults) return;
    visionResults.forEach(item => {
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { 
          ...item, 
          id: Date.now() + Math.random(), 
          expiryDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], 
          threshold: 1 
        } 
      });
    });
    alert('Items added to inventory!');
    setVisionResults(null);
  };

  return (
    <div className="page-content fade-in">
      <h1 className="page-title">Smart Scanner</h1>
      <p className="page-subtitle">Add items via Hardware Barcode Scanner or AI Vision recognition.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className={`tab-btn ${activeTab === 'barcode' ? 'active' : ''}`} onClick={() => setActiveTab('barcode')}>Barcode Mode</button>
        <button className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`} onClick={() => setActiveTab('vision')}>AI Vision Mode</button>
      </div>

      <div className="grid grid-2">
        {activeTab === 'barcode' ? (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Hardware Barcode Scanner</h2>
            
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
              {isFetchingProduct ? (
                <>
                  <Loader2 size={48} className="spin" style={{ color: 'var(--primary)', marginBottom: '16px', margin: '0 auto' }} />
                  <p style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Fetching product details for {result}...</p>
                </>
              ) : (
                <>
                  <ScanBarcode size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto' }} />
                  <p style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Ready to scan. Ensure this window is focused.</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7 }}>Use your physical USB/Bluetooth scanner on any product barcode.</p>
                </>
              )}
            </div>

            {result && !isFetchingProduct && (
              <div style={{ textAlign: 'center', padding: '20px', marginTop: '20px', background: 'rgba(0, 245, 160, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Scan processed!</div>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '0' }}>Barcode: {result}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>AI Vision Recognition</h2>
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
              <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto' }} />
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Upload a photo of your fridge shelf</p>
              <input type="file" accept="image/*" style={{ display: 'none' }} id="file-upload" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {isAnalyzing ? <><Loader2 className="spin" size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Analyzing...</> : 'Upload Fridge Photo'}
              </label>
            </div>

            {visionResults && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Detected Items:</h3>
                <div className="item-list">
                  {visionResults.map((item, idx) => (
                    <div key={idx} className="item-row" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="item-left">
                        <strong style={{ display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                        <span className="badge" style={{ fontSize: '10px' }}>{item.category}</span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={addAllDetected}>
                  Add All to Inventory
                </button>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>How it works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Barcode Mode:</strong> Plug in a hardware scanner and simply scan a product. The system instantly listens for the barcode input and looks up the product online to automatically add it to your inventory.<br/><br/>
            <strong>Vision Mode:</strong> Uses Gemini 1.5 Flash to "see" multiple items at once. Perfect for fresh produce, open containers, or quickly logging a whole shelf after shopping.
          </p>
        </div>
      </div>

      <style>{`
        .tab-btn {
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
