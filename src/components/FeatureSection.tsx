import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeatureSectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'warning' | 'success';
}

export const FeatureSection = ({ 
  children, 
  className,
  variant = 'default' 
}: FeatureSectionProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlight':
        return 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20';
      case 'warning':
        return 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20';
      case 'success':
        return 'bg-gradient-to-br from-success/10 to-success/5 border-success/20';
      default:
        return 'bg-card/50 border-border/50';
    }
  };

  return (
    <section className={cn(
      "mx-4 p-4 rounded-2xl border backdrop-blur-sm",
      getVariantStyles(),
      className
    )}>
      {children}
    </section>
  );
};
