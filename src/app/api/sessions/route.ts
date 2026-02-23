import { NextRequest, NextResponse } from "next/server";
import type { AnalysisSession } from "@/types";

/**
 * 분석 세션 저장/조회 API
 * TODO: 실제 저장소(DB 또는 파일) 연동 구현
 */

// 임시 인메모리 저장소 (개발용)
const sessions: AnalysisSession[] = [];

// 저장된 세션 목록 조회
export async function GET() {
  return NextResponse.json({ sessions });
}

// 새 세션 저장
export async function POST(request: NextRequest) {
  try {
    const body: Omit<AnalysisSession, "id" | "createdAt" | "updatedAt"> =
      await request.json();

    const session: AnalysisSession = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessions.push(session);

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "세션 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
