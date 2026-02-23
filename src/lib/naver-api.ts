import axios from "axios";
import type { NaverApiResponse, NaverShoppingItem, SortType } from "@/types";

const NAVER_API_BASE = "https://openapi.naver.com/v1/search/shop.json";

interface SearchOptions {
  keyword: string;
  count: number;
  sort: SortType;
}

/**
 * 네이버 쇼핑 검색 API 호출
 * - 서버 사이드에서만 호출 (API 키 보호)
 * - 검색 API 결과에는 광고 상품이 포함되지 않음
 */
export async function searchNaverShopping(
  options: SearchOptions
): Promise<NaverShoppingItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 설정해주세요."
    );
  }

  const response = await axios.get<NaverApiResponse>(NAVER_API_BASE, {
    params: {
      query: options.keyword,
      display: options.count,
      start: 1,
      sort: options.sort,
    },
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  return response.data.items;
}

/**
 * 네이버 API 정렬 옵션 설명
 * - sim: 정확도순 (네이버 랭킹순)
 * - date: 등록일순
 * - asc: 가격 낮은순 (리뷰 좋은 순 대체)
 * - review: 리뷰 많은 순 (비공식, 실제 API 지원 여부 확인 필요)
 */
export const SORT_MAP: Record<SortType, string> = {
  sim: "정확도순",
  review: "리뷰 많은 순",
  asc: "리뷰 좋은 순",
  date: "등록일순",
};
