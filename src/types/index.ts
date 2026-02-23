// 정렬 기준 옵션
export type SortType = "sim" | "date" | "asc" | "dsc";

export const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "sim", label: "정확도순" },
  { value: "date", label: "등록일순" },
  { value: "asc", label: "가격 낮은순" },
  { value: "dsc", label: "가격 높은순" },
];

// 검색 파라미터
export interface SearchParams {
  keyword: string;
  count: number; // 1~50
  sort: SortType;
}

// 네이버 쇼핑 API 응답의 개별 아이템
export interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

// 네이버 쇼핑 API 전체 응답
export interface NaverApiResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

// 제품 특징 (스펙 테이블에서 추출)
export interface ProductSpec {
  key: string;
  value: string;
  numericValue?: number;
}

// 대시보드에서 사용하는 정제된 상품 데이터
export interface Product {
  id: string;
  name: string;
  image: string;
  url: string;
  price: number;
  brand?: string;
  mallName?: string;
  category?: string;
  specs: ProductSpec[];
  isManual?: boolean; // 수동 추가 여부
}

// 필터 설정
export interface FilterSettings {
  priceRange: [number, number];
  specRange?: {
    key: string;
    range: [number, number];
  };
}

// 분석 세션 (저장 단위)
export interface AnalysisSession {
  id: string;
  keyword: string;
  count: number;
  sort: SortType;
  selectedSpec?: string;
  filters: FilterSettings;
  products: Product[];
  manualProducts: Product[];
  createdAt: string;
  updatedAt: string;
}
