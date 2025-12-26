import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { pageOrder } from '@/components/BottomNav';

interface SwipeNavigationProps {
  children: React.ReactNode;
}

export const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isScrolling = useRef<boolean | null>(null);

  const minSwipeDistance = 80;

  const getCurrentPageIndex = useCallback(() => {
    return pageOrder.indexOf(location.pathname);
  }, [location.pathname]);

  const handleSwipe = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);
    
    // Ignore if vertical scroll was detected
    if (isScrolling.current === true) return;
    
    // Ignore if swipe is too short or too vertical
    if (Math.abs(deltaX) < minSwipeDistance || deltaY > Math.abs(deltaX)) return;

    const currentIndex = getCurrentPageIndex();
    
    if (deltaX < 0) {
      // Swipe left - go to next page
      const nextIndex = currentIndex + 1;
      if (nextIndex < pageOrder.length) {
        navigate(pageOrder[nextIndex]);
      }
    } else {
      // Swipe right - go to previous page
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        navigate(pageOrder[prevIndex]);
      }
    }
  }, [navigate, getCurrentPageIndex]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isScrolling.current === null) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      isScrolling.current = deltaY > deltaX;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    handleSwipe();
  }, [handleSwipe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  );
};
