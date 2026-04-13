"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TranscribeResponse,
  SummarizeResponse,
  Utterance,
} from "@/types/transcribe";

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.mp4";
const MAX_FILE_SIZE_GB = 2;
const MAX_FILE_SIZE = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;

// 발화자별 색상
const SPEAKER_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-red-100", text: "text-red-700" },
  { bg: "bg-yellow-100", text: "text-yellow-700" },
];

function getSpeakerColor(label: string) {
  const idx =
    (parseInt(label, 10) || label.charCodeAt(0)) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[idx];
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 간단한 마크다운 → HTML 변환
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, "<br />");
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscribeResponse | null>(
    null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((f: File) => {
    setError(null);
    setSummary(null);
    setTranscription(null);

    if (f.size > MAX_FILE_SIZE) {
      setError(`파일 크기가 ${MAX_FILE_SIZE_GB}GB를 초과합니다.`);
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) validateAndSetFile(droppedFile);
    },
    [validateAndSetFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSetFile(selected);
    },
    [validateAndSetFile]
  );

  const handleTranscribe = useCallback(async () => {
    if (!file) return;
    setIsTranscribing(true);
    setError(null);
    setTranscription(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "음성 인식에 실패했습니다.");
      setTranscription(data as TranscribeResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "음성 인식 중 오류가 발생했습니다."
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [file]);

  const handleSummarize = useCallback(async () => {
    if (!transcription) return;
    setIsSummarizing(true);
    setError(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcription.fullText,
          speakerCount: transcription.speakerCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요약에 실패했습니다.");
      setSummary((data as SummarizeResponse).summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "요약 중 오류가 발생했습니다."
      );
    } finally {
      setIsSummarizing(false);
    }
  }, [transcription]);

  const handleReset = useCallback(() => {
    setFile(null);
    setTranscription(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">음성 전사 & 요약</h1>
        {(transcription || file) && (
          <button
            onClick={handleReset}
            className="text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* 업로드 영역 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          오디오 파일 업로드
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <span className="text-3xl mb-2">🎤</span>
          {file ? (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MP3, WAV, M4A, AAC, OGG, FLAC (최대 {MAX_FILE_SIZE_GB}GB)
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && !transcription && (
          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isTranscribing ? "음성 인식 중..." : "전사 시작"}
          </button>
        )}
      </div>

      {/* 로딩 표시 */}
      {isTranscribing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-700">
              음성을 분석하고 있습니다...
            </p>
            <p className="text-xs text-blue-500 mt-0.5">
              파일 길이에 따라 수 분이 소요될 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 전사 결과 */}
      {transcription && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              전사 결과 ({transcription.speakerCount}명의 발화자)
            </h2>
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSummarizing ? "요약 중..." : "AI 요약하기"}
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {transcription.utterances.map((u: Utterance, i: number) => {
              const color = getSpeakerColor(u.speakerLabel);
              return (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-24">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
                    >
                      {u.speaker}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(u.startMs)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed pt-0.5 flex-1">
                    {u.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 요약 로딩 */}
      {isSummarizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-blue-700">
            AI가 내용을 요약하고 있습니다...
          </p>
        </div>
      )}

      {/* 요약 결과 */}
      {summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            AI 요약
          </h2>
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
          />
        </div>
      )}
    </div>
  );
}
