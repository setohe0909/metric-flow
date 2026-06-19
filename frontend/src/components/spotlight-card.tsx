import React, { useRef } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SpotlightCard({ children, className = '', ...props }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative group overflow-hidden bg-white border-2 border-[#23251d] rounded-2xl transition-all shadow-[4px_4px_0px_0px_#23251d] hover:shadow-[6px_6px_0px_0px_#23251d] hover:-translate-y-0.5 ${className}`}
      {...props}
    >
      {/* Spotlight layers */}
      <div className="spotlight-card-glow" />
      <div className="spotlight-card-border" />
      
      {/* Inner Content */}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
