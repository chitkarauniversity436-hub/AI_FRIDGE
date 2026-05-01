import React, { useState, useEffect, useRef, useContext } from 'react';
import Quagga from 'quagga';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { FridgeContext } from '../context/FridgeContext';

export default function Scanner() {
  const { state, dispatch } = useContext(FridgeContext);
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  
  const { analyzeImage } = useAI(state.settings?.apiKey || '');
  const [activeTab, setActiveTab] = useState('barcode');
  const [visionResults, setVisionResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    Quagga.init({
      inputStream: { name: "Live", type: "LiveStream", target: scannerRef.current },
      decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"] }
    }, (err) => {
      if (err) { console.error(err); setScanning(false); return; }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      setResult(data.codeResult.code);
      Quagga.stop();
      setScanning(false);
    });
  };

  const stopScanner = () => {
    if(scanning) { Quagga.stop(); setScanning(false); }
  };

  useEffect(() => { return () => stopScanner(); }, [scanning]);

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
      <p className="page-subtitle">Add items via Barcode or AI Vision recognition.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className={`tab-btn ${activeTab === 'barcode' ? 'active' : ''}`} onClick={() => setActiveTab('barcode')}>Barcode Mode</button>
        <button className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`} onClick={() => setActiveTab('vision')}>AI Vision Mode</button>
      </div>

      <div className="grid grid-2">
        {activeTab === 'barcode' ? (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Barcode Scanner</h2>
            
            {!scanning && !result && (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
                <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Point your camera at a product barcode</p>
                <button className="btn btn-primary" onClick={startScanner}>Start Camera</button>
              </div>
            )}

            {scanning && (
              <div>
                <div ref={scannerRef} style={{ width: '100%', height: '300px', background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', transform: 'translateY(-50%)', zIndex: 10 }}></div>
                </div>
                <button className="btn" onClick={stopScanner} style={{ width: '100%', marginTop: '16px' }}>Cancel Scan</button>
              </div>
            )}

            {result && (
              <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0, 245, 160, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉 Barcode Detected!</div>
                <p style={{ fontFamily: 'monospace', fontSize: '18px', marginBottom: '20px' }}>{result}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn btn-primary">Add Item Details</button>
                  <button className="btn" onClick={startScanner}>Scan Another</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>AI Vision Recognition</h2>
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
              <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Upload a photo of your fridge shelf</p>
              <input type="file" accept="image/*" style={{ display: 'none' }} id="file-upload" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                {isAnalyzing ? <><Loader2 className="spin" size={18}/> Analyzing...</> : 'Upload Fridge Photo'}
              </label>
            </div>

            {visionResults && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Detected Items:</h3>
                <div className="item-list">
                  {visionResults.map((item, idx) => (
                    <div key={idx} className="item-row" style={{ padding: '12px 16px' }}>
                      <div className="item-left">
                        <strong>{item.name}</strong>
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
            <strong>Barcode Mode:</strong> Uses your camera to scan traditional product codes. Best for individual packaged items.<br/><br/>
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
