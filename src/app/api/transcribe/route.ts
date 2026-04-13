import { NextRequest, NextResponse } from "next/server";
import type {
  ClovaSpeechParams,
  ClovaSpeechResponse,
  Utterance,
  TranscribeResponse,
} from "@/types/transcribe";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const invokeUrl = process.env.CLOVA_SPEECH_INVOKE_URL?.trim();
    const apiKey = process.env.CLOVA_SPEECH_API_KEY?.trim();

    if (!invokeUrl || !apiKey) {
      return NextResponse.json(
        { error: "CLOVA Speech API 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "오디오 파일을 업로드해주세요." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 100MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const params: ClovaSpeechParams = {
      language: "ko-KR",
      completion: "sync",
      wordAlignment: true,
      fullText: true,
      diarization: {
        enable: true,
        speakerCountMin: -1,
        speakerCountMax: -1,
      },
    };

    const clovaForm = new FormData();
    clovaForm.append("media", file);
    clovaForm.append("params", JSON.stringify(params));

    const clovaResponse = await fetch(`${invokeUrl}/recognizer/upload`, {
      method: "POST",
      headers: {
        "X-CLOVASPEECH-API-KEY": apiKey,
        Accept: "application/json;UTF-8",
      },
      body: clovaForm,
      signal: AbortSignal.timeout(300_000), // 5분 타임아웃
    });

    if (!clovaResponse.ok) {
      const errText = await clovaResponse.text();
      throw new Error(
        `CLOVA Speech API 오류 (${clovaResponse.status}): ${errText}`
      );
    }

    const clovaData: ClovaSpeechResponse = await clovaResponse.json();

    if (clovaData.result !== "COMPLETED") {
      throw new Error(`음성 인식 실패: ${clovaData.message}`);
    }

    // 같은 발화자의 연속 발화를 병합
    const speakerNameMap = new Map<string, string>();
    let speakerCounter = 0;

    function getSpeakerName(label: string): string {
      if (!speakerNameMap.has(label)) {
        speakerCounter++;
        speakerNameMap.set(label, `발화자 ${speakerCounter}`);
      }
      return speakerNameMap.get(label)!;
    }

    const utterances: Utterance[] = [];
    let currentGroup: Utterance | null = null;

    for (const seg of clovaData.segments) {
      const label = seg.speaker?.label ?? seg.diarization?.label ?? "0";
      const speakerName = getSpeakerName(label);

      if (currentGroup && currentGroup.speakerLabel === label) {
        currentGroup.text += " " + seg.text;
        currentGroup.endMs = seg.end;
        currentGroup.confidence = Math.min(
          currentGroup.confidence,
          seg.confidence
        );
      } else {
        if (currentGroup) utterances.push(currentGroup);
        currentGroup = {
          speaker: speakerName,
          speakerLabel: label,
          text: seg.text,
          startMs: seg.start,
          endMs: seg.end,
          confidence: seg.confidence,
        };
      }
    }
    if (currentGroup) utterances.push(currentGroup);

    const fullText = utterances
      .map((u) => `${u.speaker}: ${u.text}`)
      .join("\n");

    const response: TranscribeResponse = {
      utterances,
      fullText,
      speakerCount: speakerNameMap.size,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "음성 인식 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
