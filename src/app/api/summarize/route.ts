import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { text, speakerCount } = (await request.json()) as {
      text: string;
      speakerCount: number;
    };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "요약할 텍스트가 없습니다." },
        { status: 400 }
      );
    }

    const systemPrompt = `당신은 회의록 및 대화 내용을 요약하는 전문가입니다.
다음 규칙을 따라 요약해주세요:
- 한국어로 요약할 것
- 핵심 논의 사항을 구조화하여 정리
- 각 발화자의 주요 발언을 요약
- 결론 및 액션 아이템이 있으면 별도로 정리
- 마크다운 형식으로 작성`;

    const userPrompt = `다음은 ${speakerCount}명이 참여한 대화/회의 녹음의 전사 내용입니다. 이 내용을 요약해주세요.

---
${text}
---`;

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(
        `Anthropic API 오류 (${anthropicResponse.status}): ${errText}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await anthropicResponse.json();
    const summary =
      data.content?.[0]?.text ?? "요약을 생성할 수 없습니다.";

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "요약 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
