import React, { useContext } from 'react';
import { FridgeContext } from '../context/FridgeContext';
import { getCategoryBreakdown } from '../utils/nutritionUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';

const COLORS = ['#00f5a0', '#00d9f5', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Analytics() {
  const { state } = useContext(FridgeContext);
  const categoryData = getCategoryBreakdown(state.inventory);

  // Mock data for waste tracker
  const wasteData = [
    { month: 'Jan', waste: 12 },
    { month: 'Feb', waste: 15 },
    { month: 'Mar', waste: 8 },
    { month: 'Apr', waste: 4 }, // AI helped reduce waste!
  ];

  return (
    <div className="page-content fade-in">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart2 /> Analytics & Reports</h1>
      <p className="page-subtitle">Track your consumption, waste, and savings over time.</p>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Food Waste Tracker</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Food wasted (in kg) per month. You are saving more food!</p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteData}>
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="waste" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Inventory by Category</h2>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            {categoryData.map((entry, index) => (
              <span key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
