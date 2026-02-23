"use client";

import { useState, useRef } from "react";

interface FeatureTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function FeatureTags({ tags, onTagsChange }: FeatureTagsProps) {
  const [input, setInput] = useState("");
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addTag = () => {
    const value = input.trim();
    if (!value || tags.includes(value)) return;
    onTagsChange([...tags, value]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) {
      setDragOverIndex(null);
      return;
    }
    const updated = [...tags];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(index, 0, moved);
    onTagsChange(updated);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h2 className="text-base font-semibold text-gray-900 mb-3">
        제품 특징 키워드
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        상품명에서 매칭할 키워드를 입력하세요. 드래그하여 순서를 변경할 수 있습니다.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="키워드 입력 후 Enter"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          추가
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={tag}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium cursor-grab active:cursor-grabbing select-none transition-all ${
                dragOverIndex === index
                  ? "bg-blue-200 text-blue-800 ring-2 ring-blue-400"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <span className="text-blue-300 mr-0.5">⠿</span>
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
