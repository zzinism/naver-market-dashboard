import { NextResponse } from "next/server";

export async function GET() {
  const invokeUrl = process.env.CLOVA_SPEECH_INVOKE_URL?.trim();
  const apiKey = process.env.CLOVA_SPEECH_API_KEY?.trim();

  if (!invokeUrl || !apiKey) {
    return NextResponse.json(
      { error: "CLOVA Speech API 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ invokeUrl, apiKey });
}
