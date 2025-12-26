import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div 
      ref={containerRef} 
      className={cn("relative overflow-auto", className)}
      style={{ 
        transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined,
      }}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity z-50",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: -50,
          height: 50,
        }}
      >
        <div className={cn(
          "p-3 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30",
          isRefreshing && "animate-pulse"
        )}>
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-primary transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{ 
              transform: !isRefreshing ? `rotate(${progress * 360}deg)` : undefined,
            }}
          />
        </div>
      </div>
      
      {children}
    </div>
  );
};
