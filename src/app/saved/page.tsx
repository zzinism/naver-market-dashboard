"use client";

import { useEffect, useState } from "react";
import type { AnalysisSession } from "@/types";

export default function SavedSessionsPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch("/api/sessions");
        const data = await response.json();
        setSessions(data.sessions);
      } catch {
        // 에러 시 빈 목록 유지
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">저장된 분석</h1>
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">
            저장된 분석 세션이 없습니다. 대시보드에서 검색 후 저장해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">저장된 분석</h1>
      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {session.keyword}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  상위 {session.count}개 | {session.products.length}개 제품 |{" "}
                  {new Date(session.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <button className="text-sm text-blue-600 hover:underline">
                불러오기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
