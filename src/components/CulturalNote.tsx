import React from 'react';
import { cn } from '@/lib/utils';

interface CulturalNoteProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export const CulturalNote = ({ 
  title, 
  children, 
  icon = "📚", 
  className 
}: CulturalNoteProps) => {
  return (
    <div className={cn(
      "mt-8 p-6 rounded-lg border border-premium-border bg-premium-background",
      "shadow-premium backdrop-blur-sm",
      "relative overflow-hidden",
      className
    )}>
      {/* Subtle accent border */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-premium-accent" />
      
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-premium-accent/20">
          <span className="text-premium-accent text-sm">{icon}</span>
        </div>
        <h5 className="font-serif text-lg font-medium text-premium-foreground tracking-wide">
          {title}
        </h5>
      </div>
      
      {/* Content */}
      <div className="text-premium-muted leading-relaxed font-light text-sm">
        {children}
      </div>
      
      {/* Decorative element */}
      <div className="absolute bottom-2 right-4 w-12 h-12 rounded-full bg-premium-accent/5 -z-10" />
    </div>
  );
};