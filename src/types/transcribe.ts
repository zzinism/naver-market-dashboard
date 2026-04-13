// ---------- CLOVA Speech API 타입 ----------

export interface ClovaSpeechParams {
  language: "ko-KR" | "en-US" | "ja" | "zh-cn";
  completion: "sync";
  wordAlignment: boolean;
  fullText: boolean;
  diarization: {
    enable: boolean;
    speakerCountMin?: number;
    speakerCountMax?: number;
  };
}

export interface ClovaSpeechSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  diarization: {
    label: string;
  };
  speaker: {
    label: string;
    name: string;
    edited: boolean;
  };
}

export interface ClovaSpeechResponse {
  result: "COMPLETED" | "FAILED";
  message: string;
  token: string;
  version: string;
  progress: number;
  segments: ClovaSpeechSegment[];
  text?: string;
  speakers?: Array<{
    label: string;
    name: string;
    edited: boolean;
  }>;
}

// ---------- 프론트엔드 타입 ----------

export interface Utterance {
  speaker: string;
  speakerLabel: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface TranscribeResponse {
  utterances: Utterance[];
  fullText: string;
  speakerCount: number;
}

export interface SummarizeResponse {
  summary: string;
}
