import React from 'react';
import { Shield, Landmark } from 'lucide-react';

export default function CampusIcon({ className, ...props }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className || 'h-6 w-6'}`} {...props}>
      <Shield className="w-full h-full text-current" strokeWidth={2} />
      <Landmark className="w-[50%] h-[50%] absolute text-current" strokeWidth={2} style={{ transform: 'translateY(5%)' }} />
    </div>
  );
}
