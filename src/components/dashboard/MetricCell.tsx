import React from 'react';

export interface MetricCellProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: 'indigo' | 'red';
  subtitle?: string;
}

const MetricCell: React.FC<MetricCellProps> = ({ label, value, icon, accent, subtitle }) => (
  <div className="px-3 py-2.5 border-b border-r border-slate-800">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-[11px] font-mono font-medium ${
      accent === 'indigo' ? 'text-indigo-300' :
      accent === 'red' ? 'text-red-300' :
      'text-slate-300'
    }`}>
      {value}
    </span>
    {subtitle && <span className="text-[8px] font-mono text-slate-600 ml-1.5">{subtitle}</span>}
  </div>
);

export default MetricCell;
