import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { OutfitDetailPage } from './pages/OutfitDetailPage';
import { RationalePage } from './pages/RationalePage';
import { WardrobePage } from './pages/WardrobePage';
import { SavedPage } from './pages/SavedPage';

// 모바일 앱 컨테이너 — 최대 너비 390px로 중앙 정렬 (데스크톱 데모 시 폰 느낌)
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex justify-center" style={{ background: '#F0EBE0' }}>
      <div className="w-full max-w-[390px] bg-cream shadow-lg relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/outfit/:id" element={<OutfitDetailPage />} />
          <Route path="/outfit/:id/rationale" element={<RationalePage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/saved" element={<SavedPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
