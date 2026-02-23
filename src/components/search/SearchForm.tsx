"use client";

import { useState } from "react";
import type { SearchParams, SortType } from "@/types";
import { SORT_OPTIONS } from "@/types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(20);
  const [sort, setSort] = useState<SortType>("sim");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    onSearch({ keyword: keyword.trim(), count, sort });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <h2 className="text-base font-semibold text-gray-900">키워드 검색</h2>

      <div className="flex flex-wrap gap-3 items-end">
        {/* 키워드 입력 */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label htmlFor="keyword" className="text-sm font-medium text-gray-700">
            검색 키워드
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 리클라이너, 원목 테이블"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 조회 수 */}
        <div className="flex flex-col gap-1 w-28">
          <label htmlFor="count" className="text-sm font-medium text-gray-700">
            상위 N개
          </label>
          <input
            id="count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 정렬 기준 */}
        <div className="flex flex-col gap-1 w-44">
          <label htmlFor="sort" className="text-sm font-medium text-gray-700">
            정렬 기준
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "검색 중..." : "검색"}
        </button>
      </div>
    </form>
  );
}
