// ─── GoBarcelona Shared Types ───────────────────────────────────────────────

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string; // standardized spelling (American English)
  priceLevel: 1 | 2 | 3 | null;
  beerPrice: number | null; // in euros e.g. 3.5
  beerPriceStr: string; // formatted e.g. "€3.50"
  vibe: string[];
  features: string[];
  isOpenNow: boolean | null;
  isOpen: boolean | null;
  openingHoursStr?: string;
  openingMon?: string;
  openingTue?: string;
  openingWed?: string;
  openingThu?: string;
  openingFri?: string;
  openingSat?: string;
  openingSun?: string;
  tapCount: number | null;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  photoUrl?: string;
  googlePlaceId: string | null;
  // Extra features
  outdoorSeating: boolean;
  hasSports: boolean;
  groupFriendly: boolean;
  dogFriendly: boolean;
  liveMusic: boolean;
  dateSpot: boolean;
  rooftop: boolean;
  openLate: boolean;
  irishPub: boolean;
  craftBeer: boolean;
  beerHall: boolean;
  studentDiscount: boolean;
  studentFriendly: boolean;
  studentPrice: number | null;
  happyHourStart?: string;
  happyHourEnd?: string;
  happyHourPrice?: number;
  beersOnTap?: string[];
  openedAt?: string;
  status: string;
  closureNote?: string;
  reopeningDate?: string;
  priceConfidence: string;
  lastUpdated?: string;
  popularTimes?: number[][] | null;
  currentPopularity?: number | null;
  website?: string;
  phone?: string;
  openingToday?: string;
}

export interface FilterState {
  open: boolean;
  terrace: boolean;
  sports: boolean;
  rooftop: boolean;
  late: boolean;
  group: boolean;
  dog: boolean;
  music: boolean;
  student: boolean;
  date: boolean;
  happyHour: boolean;
  new: boolean;
  closed: boolean;
  irish: boolean;
  craft: boolean;
}

export type FilterKey = keyof FilterState;

export interface WalkInfo {
  mins: number;
  label: string;
}

export interface RealWalk {
  mins: string;
  dist: string;
}
