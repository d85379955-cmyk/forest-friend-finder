import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconColor?: string;
}

export const SectionHeader = ({ 
  icon: Icon, 
  title, 
  subtitle,
  iconColor = 'text-primary' 
}: SectionHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
      )}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
