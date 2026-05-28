import type { UserProfile, ClothingItem, OutfitRecommendation } from '../types';

// 데모 사용자
export const demoUser: UserProfile = {
  id: 'demo-user-1',
  name: '지수',
  bodyMeasurements: {
    shoulderWidth: 'narrow',
    waistRatio: 0.72,
    legRatio: 0.55,
  },
};

// 데모 의류 8벌
export const demoClothingItems: ClothingItem[] = [
  {
    id: 'item-1',
    ownerId: 'demo-user-1',
    category: 'top',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#E8DCC4',
    attributes: { material: '니트', style: '캐주얼', season: ['봄', '가을'] },
    wearCount: 12,
    createdAt: new Date('2024-09-01'),
    label: '오트 드롭숄더 니트',
  },
  {
    id: 'item-2',
    ownerId: 'demo-user-1',
    category: 'bottom',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#5A5946',
    attributes: { material: '면', style: '세미캐주얼', season: ['봄', '여름', '가을'] },
    wearCount: 8,
    createdAt: new Date('2024-09-15'),
    label: '올리브 와이드 트라우저',
  },
  {
    id: 'item-3',
    ownerId: 'demo-user-1',
    category: 'shoes',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#8B6F47',
    attributes: { material: '가죽', style: '클래식', season: ['봄', '가을'] },
    wearCount: 20,
    createdAt: new Date('2024-08-01'),
    label: '레더 로퍼',
  },
  {
    id: 'item-4',
    ownerId: 'demo-user-1',
    category: 'bag',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#C56F45',
    attributes: { material: '캔버스', style: '캐주얼', season: ['봄', '여름', '가을', '겨울'] },
    wearCount: 15,
    createdAt: new Date('2024-07-20'),
    label: '테라코타 토트백',
  },
  {
    id: 'item-5',
    ownerId: 'demo-user-1',
    category: 'outerwear',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#2A2A28',
    attributes: { material: '울', style: '클래식', season: ['가을', '겨울'] },
    wearCount: 5,
    createdAt: new Date('2024-10-01'),
    label: '블랙 오버핏 코트',
  },
  {
    id: 'item-6',
    ownerId: 'demo-user-1',
    category: 'top',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#FFFFFF',
    attributes: { material: '면', style: '베이직', season: ['봄', '여름', '가을'] },
    wearCount: 25,
    createdAt: new Date('2024-06-01'),
    label: '화이트 크루넥 티셔츠',
  },
  {
    id: 'item-7',
    ownerId: 'demo-user-1',
    category: 'bottom',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#3D3833',
    attributes: { material: '데님', style: '캐주얼', season: ['봄', '가을'] },
    wearCount: 18,
    createdAt: new Date('2024-08-20'),
    label: '다크 스트레이트 데님',
  },
  {
    id: 'item-8',
    ownerId: 'demo-user-1',
    category: 'shoes',
    imageUrl: '',
    isolatedImageUrl: '',
    colorHex: '#F0E2CC',
    attributes: { material: '캔버스', style: '캐주얼', season: ['봄', '여름'] },
    wearCount: 10,
    createdAt: new Date('2024-05-15'),
    label: '스킨톤 스니커즈',
  },
];

// 추천 코디 2개
export const demoRecommendations: OutfitRecommendation[] = [
  {
    id: 'outfit-1',
    userId: 'demo-user-1',
    context: {
      date: new Date('2026-05-27'),
      weather: { tempMin: 18, tempMax: 24, condition: '맑음' },
      schedule: { title: '카페 미팅', time: '오후' },
    },
    items: [demoClothingItems[0], demoClothingItems[1], demoClothingItems[2], demoClothingItems[3]],
    tryOnImageUrl: '',
    heroStatement: '어깨 라인을 부드럽게 풀어주는 코디예요',
    rationale: {
      body: '어깨가 좁은 편이라, 드롭 숄더 실루엣의 오트 컬러 니트가 라인을 자연스럽게 확장시켜줘요.',
      schedule: '오후 카페 미팅이라는 캐주얼-세미캐주얼 톤에 맞춰, 격식보다 편안함을 우선했어요.',
      weather: '18-24°C 일교차에 얇은 니트 한 겹이 적당해요. 더우면 소매를 살짝 걷어도 핏이 유지돼요.',
    },
    createdAt: new Date('2026-05-27'),
  },
  {
    id: 'outfit-2',
    userId: 'demo-user-1',
    context: {
      date: new Date('2026-05-27'),
      weather: { tempMin: 18, tempMax: 24, condition: '맑음' },
      schedule: { title: '캐주얼 외출', time: '낮' },
    },
    items: [demoClothingItems[5], demoClothingItems[6], demoClothingItems[7], demoClothingItems[3]],
    tryOnImageUrl: '',
    heroStatement: '긴 다리 비율을 살린 데일리 스트릿 룩',
    rationale: {
      body: '다리 비율이 긴 편이라, 스트레이트 데님과 크루넥 티의 조합이 전체 실루엣을 더 길어 보이게 해줘요.',
      schedule: '캐주얼 외출이라는 자유로운 상황에 맞춰, 코디 전체를 편안한 베이직 톤으로 구성했어요.',
      weather: '18-24°C의 화창한 날씨에 얇은 면 티셔츠 한 겹이 딱 맞아요. 기온이 떨어지면 가방에 재킷 하나 추가하세요.',
    },
    createdAt: new Date('2026-05-27'),
  },
];

// 오늘 날짜 포맷
export function formatKoreanDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[date.getDay()];
  const month = date.getMonth() + 1;
  const dateNum = date.getDate();
  return `${day} · ${month}월 ${dateNum}일`;
}
