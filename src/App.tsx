import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { trackEvent } from './lib/analytics';
import { HomePage } from './pages/HomePage';
import { OutfitDetailPage } from './pages/OutfitDetailPage';
import { RationalePage } from './pages/RationalePage';
import { WardrobePage } from './pages/WardrobePage';
import { SavedPage } from './pages/SavedPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PageTransition } from './components/shared/PageTransition';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex justify-center" style={{ background: '#F0EBE0' }}>
      <div className="w-full max-w-[390px] bg-cream shadow-lg relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/outfit/:id" element={<PageTransition><OutfitDetailPage /></PageTransition>} />
        <Route path="/outfit/:id/rationale" element={<PageTransition><RationalePage /></PageTransition>} />
        <Route path="/wardrobe" element={<PageTransition><WardrobePage /></PageTransition>} />
        <Route path="/saved" element={<PageTransition><SavedPage /></PageTransition>} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  useEffect(() => {
    if (!sessionStorage.getItem('visited')) {
      trackEvent('visit');
      sessionStorage.setItem('visited', '1');
    }
  }, []);

  return (
    <BrowserRouter>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </BrowserRouter>
  );
}
