import { useNavigate, useLocation } from 'react-router-dom';

// 아이콘 SVG 인라인
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#C56F45' : '#8A8378';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function WardrobeIcon({ active }: { active: boolean }) {
  const color = active ? '#C56F45' : '#8A8378';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

function SaveIcon({ active }: { active: boolean }) {
  const color = active ? '#C56F45' : '#8A8378';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const tabs = [
    { label: '홈', icon: HomeIcon, path: '/' },
    { label: '옷장', icon: WardrobeIcon, path: '/wardrobe' },
    { label: '저장', icon: SaveIcon, path: '/saved' },
  ];

  return (
    <div className="flex justify-around items-end px-5 pt-[18px] pb-[14px] mt-3.5 border-t border-border-light">
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = path === '/' ? isHome : location.pathname.startsWith(path);
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5"
          >
            <Icon active={active} />
            <span className={`text-[11px] mt-0.5 ${active ? 'text-brand font-medium' : 'text-ink-hint'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
