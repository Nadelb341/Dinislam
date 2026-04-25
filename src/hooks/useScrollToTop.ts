import { useState, useRef, useCallback, useEffect } from 'react';

// Pour les conteneurs / dialogs (ref + onScroll)
export function useScrollToTop() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    setShowTop(el.scrollTop > 200);
    setShowBottom(el.scrollTop < 200 && !atBottom);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  return { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom };
}

// Pour les pages entières (window.scroll)
export function useWindowScrollToTop() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 20;
      setShowTop(window.scrollY > 200);
      setShowBottom(window.scrollY < 200 && !atBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const scrollToBottom = useCallback(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), []);

  return { showTop, showBottom, scrollToTop, scrollToBottom };
}
