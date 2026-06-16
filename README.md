# Closet AI

> 내 옷장 · 내 체형 기반 AI 코디 & 가상 피팅 — "이게 나한테 어울릴까?"라는 확신의 부재를 푸는 앱
> 비즈니스 응용 설계 기말 프로젝트

**라이브 데모:** https://ai-telier.netlify.app  
**GitHub:** https://github.com/HYUNAHKO/closet-ai

---

## 평가자께 (가장 빠른 실행 경로)

**경로 A — 설치 없이 바로 확인 (권장)**

https://ai-telier.netlify.app 에 접속하면 데모 사용자 데이터(옷 15벌 + 코디 추천 + try-on 사전 캐싱)가 **바로** 표시됩니다. 별도 로그인 불필요. 추천 → 가상 피팅 → 코디 설명까지 즉시 체험 가능합니다.

**경로 B — 로컬 실행**

프론트엔드만 띄우면 됩니다. AI 호출(가상 피팅·코디 설명)은 이미 배포된 Supabase Edge Function이 서버에서 처리하므로 **평가자는 Anthropic / Replicate 키가 필요 없습니다.** 프론트는 공개 안전한 `VITE_SUPABASE_ANON_KEY`만 사용합니다 (보안 경계 = 모든 테이블 RLS).

```bash
git clone https://github.com/HYUNAHKO/closet-ai.git
cd closet-ai
cp .env.example .env.local   # 실제 값이 이미 들어있습니다
npm install
npm run dev                  # http://localhost:5173/onboarding 으로 들어가시면 됩니다.
```

---

## 기능

- **체형 반영 Virtual Try-On** — 추천 조합을 마네킹이 아닌 사용자 본인 전신에 합성 (IDM-VTON, CVPR 2024)
- **설명 가능한 스타일링** — 체형·일정·날씨 근거로 AI가 코디 이유를 자연어 설명 (Claude API)
- **자동 코디 추천** — 날씨·일정·착용 이력 기반 매일 아침 추천
- **10벌 챌린지 온보딩** — 자주 입는 10벌만 등록하면 즉시 try-on 와우 모먼트

---

## 아키텍처

```
[ React + Vite PWA ]  --(supabase-js, anon key)-->  [ Supabase ]
   Netlify 배포                                       ├─ Postgres (RLS, 4 테이블)
                                                      ├─ Storage (옷/체형 이미지)
                                                      └─ Edge Functions (키 프록시)
                                                            ├─ recommend  → Claude API
                                                            ├─ tryon      → Replicate IDM-VTON
                                                            └─ classify   → Claude Vision
```

- `ANTHROPIC_API_KEY` / `REPLICATE_API_TOKEN` 은 **Edge Function 시크릿에만** 저장 — 프론트 코드에 없음
- 체형 추출: MediaPipe PoseLandmarker (CDN)
- 배경 제거: @imgly/background-removal (브라우저 WASM)

---

## 로컬 실행

### 사전 요구사항

- Node.js **18 이상** (권장: 20 LTS)

### 1) 클론 & 설치

```bash
git clone https://github.com/HYUNAHKO/closet-ai.git
cd closet-ai

# 불완전 lockfile 오류 방지
rm -rf node_modules package-lock.json
npm install
```

### 2) 환경변수

```bash
cp .env.example .env.local
```

`.env.example`에 실제 Supabase anon key가 이미 들어있어 **그대로 실행 가능**합니다.  
`ANTHROPIC_API_KEY` / `REPLICATE_API_TOKEN`은 프론트에 넣지 않습니다 — 이미 배포된 Edge Function 시크릿에 있습니다.

### 3) 실행

```bash
npm run dev       # 개발 서버  →  http://localhost:5173
npm run build     # 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
```

---

## 환경변수 정리

| 변수 | 위치 | 공개 여부 | 용도 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | 프론트 `.env.local` | 공개 안전 | Supabase 연결 |
| `VITE_SUPABASE_ANON_KEY` | 프론트 `.env.local` | 공개 안전 (RLS) | Supabase 익명 인증 |
| `ANTHROPIC_API_KEY` | Edge Function 시크릿 | **비공개** | 코디 설명 · 의류 분류 |
| `REPLICATE_API_TOKEN` | Edge Function 시크릿 | **비공개** | IDM-VTON 가상 피팅 |

---

## DB 스키마 & Edge Functions

**마이그레이션 위치:** `supabase/migrations/`

| 파일 | 내용 |
|---|---|
| `20260528000001_initial_schema.sql` | 초기 스키마 + RLS |
| `20260530000002_demo_live_tag.sql` | demo_live 플래그 |
| `20260611000001_storage_upsert_rls.sql` | Storage RLS |

**RLS 적용 테이블 4개:** `users` · `clothing_items` · `outfit_recommendations` · `saved_outfits`

**Edge Functions:** `supabase/functions/recommend/` · `supabase/functions/tryon/` · `supabase/functions/classify/`

---

## 데모 사용자

앱은 별도 로그인 없이 `demo-user-1` 계정 데이터를 자동으로 표시합니다 (홈 화면 진입 시 즉시 추천 로딩).

- 의류 15벌 등록 완료
- 코디 try-on 결과 Supabase Storage에 사전 캐싱 완료 (IDM-VTON 실행 없이 즉시 표시)
- `demo_live` 플래그가 붙은 코디 1건은 실시간 합성 경로를 시연

새 사용자 체험: `/onboarding` 에서 셀카 + 옷 10벌 업로드 → 체형 자동 분석 → 분류 → 코디 생성

---

## (선택) 전체 백엔드 직접 배포

본인 키로 재구성하려는 경우:

```bash
supabase db push                         # 마이그레이션 적용
supabase db seed                         # 데모 데이터 삽입
supabase functions deploy recommend tryon classify
supabase secrets set ANTHROPIC_API_KEY=<값> REPLICATE_API_TOKEN=<값>
```

---

## 폴더 구조

```
closet-ai/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── OutfitDetailPage.tsx
│   │   ├── RationalePage.tsx
│   │   ├── WardrobePage.tsx
│   │   ├── SavedPage.tsx
│   │   └── OnboardingPage.tsx
│   ├── components/
│   │   ├── home/        # OutfitCard, ContextLine, ActionChips, TryOnSilhouette
│   │   ├── outfit/      # TryOnView, OutfitItemsStrip, ContextBadge, RationaleCTA
│   │   ├── rationale/   # ReasoningBlock, OutfitMiniReference
│   │   └── shared/      # TopBar, BottomNav, PageTransition, EmailCaptureModal
│   ├── lib/
│   │   ├── api/         # clothing.ts, recommendations.ts, virtualTryOn.ts, vision.ts
│   │   ├── supabase.ts
│   │   ├── bodyAnalysis.ts
│   │   ├── backgroundRemoval.ts
│   │   ├── analytics.ts
│   │   └── mockData.ts
│   └── types/           # index.ts, database.ts
├── supabase/
│   ├── functions/
│   │   ├── recommend/
│   │   ├── tryon/
│   │   ├── classify/
│   │   └── _shared/
│   ├── migrations/
│   └── seed.sql
├── public/              # PWA 매니페스트, 아이콘
├── .env.example         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (실제 값 포함)
└── netlify.toml
```

---

## 트러블슈팅

- **`@vitejs/plugin-react` not found** → `rm -rf node_modules package-lock.json && npm install`
- **try-on 응답 없음** → Edge Function 시크릿 미설정 또는 Replicate 토큰 만료 확인
- **배경 제거 느림** → 첫 실행 시 WASM ~50MB 다운로드 — 이후 캐시됨

---

## 통계 검증 (XYZ 가설)

"에타 → 랜딩(검정 A) → 앱(검정 B)" 체인을 Exact Binomial + Z검정으로 검정 — `xyz_test.py` 참고.

- **검정 A** (수요, 중간발표 4월): 30/68 = 44.1%, p<0.0001 → H₀(p≤10%) 기각
- **검정 B** (활성화, 기말 6월): 14/45 = 31.1%, p=0.00008 → H₀ 기각  
  (런칭 퍼널: 방문 129 → 온보딩 45 → 트라이온 14)

---

## 출처 / 라이선스

IDM-VTON (ECCV 2024) · MediaPipe (Apache 2.0) · @imgly/background-removal  
본 저장소는 학습용 기말 프로젝트입니다.
