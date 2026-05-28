export type BodyMeasurements = {
  shoulderWidth: 'narrow' | 'medium' | 'wide';
  waistRatio: number;
  legRatio: number;
};

export type UserProfile = {
  id: string;
  name: string;
  bodyMeasurements: BodyMeasurements;
};

export type ClothingItem = {
  id: string;
  ownerId: string;
  category: 'top' | 'bottom' | 'shoes' | 'bag' | 'outerwear' | 'dress';
  imageUrl: string;
  isolatedImageUrl: string;
  colorHex: string;
  attributes: { material?: string; style?: string; season?: string[] };
  wearCount: number;
  createdAt: Date;
  label: string;
};

export type TodayContext = {
  date: Date;
  weather: { tempMin: number; tempMax: number; condition: string };
  schedule?: { title: string; time: string };
};

export type OutfitRationale = {
  body: string;
  schedule: string;
  weather: string;
};

export type OutfitRecommendation = {
  id: string;
  userId: string;
  context: TodayContext;
  items: ClothingItem[];
  tryOnImageUrl: string;
  rationale: OutfitRationale;
  heroStatement: string;
  createdAt: Date;
};
