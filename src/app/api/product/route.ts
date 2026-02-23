import { NextRequest, NextResponse } from "next/server";
import type { ProductSpec } from "@/types";

/**
 * 상품 상세 페이지에서 스펙 테이블을 추출하는 API
 * TODO: 실제 스크래핑 로직 구현
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json(
        { error: "상품 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    // TODO: 상품 상세 페이지 스크래핑 및 스펙 테이블 파싱 구현
    const specs: ProductSpec[] = [];

    return NextResponse.json({ specs });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "스펙 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
