import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { pageOrder } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit" | "idle">("idle");
  const [direction, setDirection] = useState<"left" | "right">("left");
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      const currentIndex = pageOrder.indexOf(previousPath.current);
      const nextIndex = pageOrder.indexOf(location.pathname);
      
      setDirection(nextIndex > currentIndex ? "left" : "right");
      setTransitionStage("exit");
      previousPath.current = location.pathname;
    }
  }, [location]);

  useEffect(() => {
    if (transitionStage === "exit") {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("enter");
      }, 150);
      return () => clearTimeout(timer);
    }
    
    if (transitionStage === "enter") {
      const timer = setTimeout(() => {
        setTransitionStage("idle");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          transitionStage === "exit" && direction === "left" && "translate-x-[-30%] opacity-0 scale-95",
          transitionStage === "exit" && direction === "right" && "translate-x-[30%] opacity-0 scale-95",
          transitionStage === "enter" && direction === "left" && "animate-slide-in-left",
          transitionStage === "enter" && direction === "right" && "animate-slide-in-right",
          transitionStage === "idle" && "translate-x-0 opacity-100 scale-100"
        )}
      >
        {children}
      </div>
    </div>
  );
};
