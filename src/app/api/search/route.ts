import { NextRequest, NextResponse } from "next/server";
import { searchNaverShopping } from "@/lib/naver-api";
import type { SearchParams, Product } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: SearchParams = await request.json();

    if (!body.keyword || !body.keyword.trim()) {
      return NextResponse.json(
        { error: "키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (body.count < 1 || body.count > 100) {
      return NextResponse.json(
        { error: "조회 수는 1~100 사이여야 합니다." },
        { status: 400 }
      );
    }

    const items = await searchNaverShopping({
      keyword: body.keyword.trim(),
      count: body.count,
      sort: body.sort,
    });

    // 네이버 API 응답을 Product 타입으로 변환
    const products: Product[] = items.map((item, index) => ({
      id: item.productId,
      rank: index + 1,
      name: item.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
      image: item.image,
      url: item.link,
      price: parseInt(item.lprice, 10) || 0,
      brand: item.brand || item.maker || "",
      mallName: item.mallName || "",
      category: [item.category1, item.category2, item.category3, item.category4]
        .filter(Boolean)
        .join(" > "),
      specs: [],
    }));

    return NextResponse.json({ products });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
