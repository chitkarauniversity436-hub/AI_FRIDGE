import React, { useState, useEffect, useRef, useContext } from 'react';
import { ScanBarcode, Upload, Loader2, Camera } from 'lucide-react';
import Quagga from 'quagga';
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

  // Phone camera listener (QuaggaJS)
  useEffect(() => {
    if (activeTab !== 'camera') {
      try { Quagga.stop(); } catch(e){}
      return;
    }

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#interactive'), // The DOM element to attach the camera to
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment" // Prefer back camera
        },
      },
      decoder: {
        readers: [
          "code_128_reader", // Crucial for your custom text barcodes
          "ean_reader"       // Crucial for standard grocery items
        ]
      }
    }, function (err) {
        if (err) {
            console.error("Quagga initialization failed:", err);
            alert("Camera access failed. Please ensure you have granted camera permissions.");
            setActiveTab('barcode');
            return;
        }
        Quagga.start();
    });

    const onDetected = (data) => {
      const code = data.codeResult.code;
      // Stop scanner immediately so it doesn't scan 50 times in one second
      try { Quagga.stop(); } catch(e){}
      
      // We found a code!
      handleBarcodeScanned(code);
      
      // Optionally reset tab or leave it. We'll reset it to 'barcode' so it stops completely.
      setActiveTab('barcode');
    };

    Quagga.onDetected(onDetected);

    return () => {
      try { Quagga.stop(); } catch(e){}
      Quagga.offDetected(onDetected);
    };
  }, [activeTab]);

  const handleBarcodeScanned = async (barcode) => {
    setResult(barcode);
    setIsFetchingProduct(true);
    try {
      // 1. Try to parse as custom structured barcode
      let parsedName = null;
      let parsedQuantity = 1;
      let parsedExpiry = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];

      // Format guesser: check for JSON first
      if (barcode.startsWith('{') && barcode.endsWith('}')) {
        try {
          const data = JSON.parse(barcode);
          parsedName = data.name || data.item || data.product;
          if (data.quantity || data.qty) parsedQuantity = Number(data.quantity || data.qty);
          if (data.expiry || data.date || data.exp) parsedExpiry = data.expiry || data.date || data.exp;
        } catch (e) { /* ignore JSON parse error */ }
      } 
      // Format guesser: check for common delimiters
      else if (barcode.includes('|') || barcode.includes(',') || barcode.includes(';')) {
        const delimiter = barcode.includes('|') ? '|' : (barcode.includes(',') ? ',' : ';');
        const parts = barcode.split(delimiter).map(s => s.trim());
        if (parts.length >= 1) parsedName = parts[0];
        if (parts.length >= 2) parsedQuantity = Number(parts[1]) || 1;
        if (parts.length >= 3) {
          parsedExpiry = parts[2];
        }
      }
      // Format guesser: check for space-separated format (e.g. "Apple 5 2026-05-20" or "Organic Milk 2")
      else if (barcode.includes(' ')) {
        const spaceMatch = barcode.match(/^(.*?)\s+(\d+)\s+(.+)$/);
        if (spaceMatch) {
          parsedName = spaceMatch[1].trim();
          parsedQuantity = Number(spaceMatch[2]);
          parsedExpiry = spaceMatch[3].trim();
        } else {
          const spaceMatch2 = barcode.match(/^(.*?)\s+(\d+)$/);
          if (spaceMatch2) {
            parsedName = spaceMatch2[1].trim();
            parsedQuantity = Number(spaceMatch2[2]);
          }
        }
      }

      // If we successfully extracted a name from a custom format
      if (parsedName) {
        dispatch({ 
          type: 'ADD_ITEM', 
          payload: { 
            name: parsedName,
            category: 'Other', // Default category
            quantity: parsedQuantity,
            unit: "pc",
            id: Date.now() + Math.random(), 
            expiryDate: parsedExpiry, 
            threshold: 1 
          } 
        });
        alert(`Successfully added ${parsedName} (Qty: ${parsedQuantity}) to your inventory!`);
        setIsFetchingProduct(false);
        setTimeout(() => setResult(null), 3000);
        return; // Exit early!
      }

      // 2. Fallback to Open Food Facts for standard barcodes (UPC/EAN)
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
        alert('Product not found in Open Food Facts database. Scanned text was: "' + barcode + '" - Please add it manually.');
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
      <p className="page-subtitle">Add items via Hardware Scanner, Phone Camera, or AI Vision recognition.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className={`tab-btn ${activeTab === 'barcode' ? 'active' : ''}`} onClick={() => setActiveTab('barcode')}>Hardware Scanner</button>
        <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>Phone Camera</button>
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
              <div style={{ textAlign: 'center', padding: '20px', marginTop: '20px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Scan processed!</div>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '0' }}>Barcode: {result}</p>
              </div>
            )}
          </div>
        ) : activeTab === 'camera' ? (
          <div className="card">
             <h2 style={{ marginBottom: '20px' }}>Phone Camera Scanner</h2>
             <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
                <div id="interactive" className="viewport" style={{ width: '100%', height: '300px', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
                  {/* Quagga will render the video here */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', zIndex: 0 }}>
                    <Loader2 size={32} className="spin" style={{ marginBottom: '10px', margin: '0 auto' }} />
                    Loading Camera...
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Point your camera at a barcode to scan instantly.</p>
             </div>
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
            <strong>Hardware Scanner:</strong> Plug in a USB/Bluetooth scanner and scan. Instantly listens and parses your custom barcodes or looks up standard products.<br/><br/>
            <strong>Phone Camera:</strong> Uses your device's built-in camera to scan barcodes directly on the screen without any extra hardware.<br/><br/>
            <strong>Vision Mode:</strong> Uses Gemini AI to "see" multiple items at once from a photo. Perfect for logging fresh produce or whole shelves.
          </p>
        </div>
      </div>

      <style>{`
        .tab-btn {
          padding: 10px 20px;
          border-radius: 50px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--primary);
          color: var(--primary-text, #fff);
          border-color: transparent;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Quagga Video Overrides */
        #interactive video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
        #interactive canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
