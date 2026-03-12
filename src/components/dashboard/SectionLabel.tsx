import React from 'react';

export interface SectionLabelProps {
  icon: React.ReactNode;
  label: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5">
    {icon}
    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default SectionLabel;
