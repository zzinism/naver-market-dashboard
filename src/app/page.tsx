"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import SearchForm from "@/components/search/SearchForm";
import FeatureTags from "@/components/search/FeatureTags";
import ScatterChart from "@/components/chart/ScatterChart";
import PriceDistribution from "@/components/chart/PriceDistribution";
import type { ChartDataPoint } from "@/components/chart/ScatterChart";
import type { Product, SearchParams } from "@/types";
import * as XLSX from "xlsx";

type SortKey = "name" | "price" | "brand" | string;
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface Filters {
  name: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  features: Record<string, "all" | "O" | "-">;
}

interface HoveredImage {
  src: string;
  x: number;
  y: number;
}

// 수동 오버라이드: { [productId]: { [tag]: true/false } }
type ManualOverrides = Record<string, Record<string, boolean>>;

const OVERRIDES_STORAGE_KEY = "naver-dashboard-manual-overrides";
const TAGS_STORAGE_KEY = "naver-dashboard-feature-tags";
const YAXIS_STORAGE_KEY = "naver-dashboard-yaxis";

function loadOverrides(): ManualOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: ManualOverrides) {
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

// 키워드별 특징 태그 저장/로드
function loadTagsForKeyword(keyword: string): string[] {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    return map[keyword] || [];
  } catch {
    return [];
  }
}

function saveTagsForKeyword(keyword: string, tags: string[]) {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    map[keyword] = tags;
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// 키워드별 Y축 선택 저장/로드
function loadYAxisForKeyword(keyword: string): string | null {
  try {
    const raw = localStorage.getItem(YAXIS_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    return map[keyword] || null;
  } catch {
    return null;
  }
}

function saveYAxisForKeyword(keyword: string, key: string | null) {
  try {
    const raw = localStorage.getItem(YAXIS_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (key) {
      map[keyword] = key;
    } else {
      delete map[keyword];
    }
    localStorage.setItem(YAXIS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState<string>("");
  const [featureTags, setFeatureTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState | null>(null);
  const [yAxisKey, setYAxisKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    brand: "",
    priceMin: "",
    priceMax: "",
    features: {},
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<HoveredImage | null>(null);
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>(loadOverrides);

  // localStorage 동기화: 수동 오버라이드
  useEffect(() => {
    saveOverrides(manualOverrides);
  }, [manualOverrides]);

  // localStorage 동기화: 키워드별 특징 태그
  useEffect(() => {
    if (currentKeyword) {
      saveTagsForKeyword(currentKeyword, featureTags);
    }
  }, [featureTags, currentKeyword]);

  // localStorage 동기화: 키워드별 Y축 선택
  useEffect(() => {
    if (currentKeyword) {
      saveYAxisForKeyword(currentKeyword, yAxisKey);
    }
  }, [yAxisKey, currentKeyword]);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "검색에 실패했습니다.");
      }

      const keyword = params.keyword.trim();
      setProducts(data.products);
      setCurrentKeyword(keyword);
      setSort(null);
      setFilters({ name: "", brand: "", priceMin: "", priceMax: "", features: {} });

      // 해당 키워드에 저장된 특징 태그/Y축 복원
      const savedTags = loadTagsForKeyword(keyword);
      setFeatureTags(savedTags);
      const savedYAxis = loadYAxisForKeyword(keyword);
      setYAxisKey(savedYAxis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasMatch = (productName: string, tag: string) => {
    return productName.toLowerCase().includes(tag.toLowerCase());
  };

  // 특징 값 결정: 수동 오버라이드 우선, 없으면 자동 매칭
  const getFeatureValue = useCallback(
    (productId: string, productName: string, tag: string): { value: boolean; source: "auto" | "manual" } => {
      const override = manualOverrides[productId]?.[tag];
      if (override !== undefined) {
        return { value: override, source: "manual" };
      }
      return { value: hasMatch(productName, tag), source: "auto" };
    },
    [manualOverrides]
  );

  // 수동 오버라이드 토글: 수동이면 제거(자동 복원), 자동이면 반대값으로 수동 설정
  const toggleManualOverride = useCallback(
    (productId: string, productName: string, tag: string) => {
      setManualOverrides((prev) => {
        const next = { ...prev };
        const hasOverride = prev[productId]?.[tag] !== undefined;

        if (hasOverride) {
          // 수동 오버라이드 제거 → 자동으로 복원
          const productOverrides = { ...prev[productId] };
          delete productOverrides[tag];
          if (Object.keys(productOverrides).length === 0) {
            delete next[productId];
          } else {
            next[productId] = productOverrides;
          }
        } else {
          // 자동 감지 값의 반대로 수동 설정
          const autoValue = hasMatch(productName, tag);
          next[productId] = { ...prev[productId], [tag]: !autoValue };
        }

        return next;
      });
    },
    []
  );

  // Y축에 유효한 키 확인 (선택한 키가 featureTags에 여전히 존재하는지)
  const activeYKey = useMemo(
    () => (yAxisKey && featureTags.includes(yAxisKey) ? yAxisKey : null),
    [yAxisKey, featureTags]
  );

  // 차트 데이터: 단일 Y축 키 기반
  const { chartData, categoryLabels } = useMemo(() => {
    if (!activeYKey) return { chartData: [] as ChartDataPoint[], categoryLabels: [] as string[] };

    const labels = ["-", activeYKey];
    const data: ChartDataPoint[] = products.map((product) => {
      const { value } = getFeatureValue(product.id, product.name, activeYKey);
      return {
        name: product.name,
        price: product.price,
        yValue: value ? 1 : 0,
        yLabel: value ? activeYKey : "-",
        brand: product.brand,
      };
    });

    return { chartData: data, categoryLabels: labels };
  }, [products, activeYKey, getFeatureValue]);

  const chartYLabel = activeYKey || "";

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  const sortIcon = (key: SortKey) => {
    if (sort?.key !== key) return " ↕";
    return sort.dir === "asc" ? " ↑" : " ↓";
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...products];

    if (filters.name) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.brand) {
      result = result.filter((p) =>
        (p.brand || "").toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    if (filters.priceMin) {
      const min = Number(filters.priceMin);
      if (!isNaN(min)) result = result.filter((p) => p.price >= min);
    }
    if (filters.priceMax) {
      const max = Number(filters.priceMax);
      if (!isNaN(max)) result = result.filter((p) => p.price <= max);
    }

    for (const tag of featureTags) {
      const filterVal = filters.features[tag];
      if (filterVal === "O") {
        result = result.filter((p) => getFeatureValue(p.id, p.name, tag).value);
      } else if (filterVal === "-") {
        result = result.filter((p) => !getFeatureValue(p.id, p.name, tag).value);
      }
    }

    if (sort) {
      result.sort((a, b) => {
        let cmp = 0;
        if (sort.key === "name") {
          cmp = a.name.localeCompare(b.name, "ko");
        } else if (sort.key === "price") {
          cmp = a.price - b.price;
        } else if (sort.key === "brand") {
          cmp = (a.brand || "").localeCompare(b.brand || "", "ko");
        } else {
          const aVal = getFeatureValue(a.id, a.name, sort.key).value ? 1 : 0;
          const bVal = getFeatureValue(b.id, b.name, sort.key).value ? 1 : 0;
          cmp = aVal - bVal;
        }
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [products, filters, sort, featureTags, getFeatureValue]);

  const updateFeatureFilter = (tag: string, value: "all" | "O" | "-") => {
    setFilters((prev) => ({
      ...prev,
      features: { ...prev.features, [tag]: value },
    }));
  };

  const handleImageHover = useCallback((e: React.MouseEvent, src: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredImage({ src, x: rect.right + 8, y: rect.top });
  }, []);

  const handleImageLeave = useCallback(() => {
    setHoveredImage(null);
  }, []);

  const exportToExcel = useCallback(() => {
    const rows = filteredAndSorted.map((product) => {
      const row: Record<string, string | number> = {
        상품명: product.name,
        가격: product.price,
        브랜드: product.brand || "",
        이미지URL: product.image || "",
        상품URL: product.url,
      };
      for (const tag of featureTags) {
        const { value } = getFeatureValue(product.id, product.name, tag);
        row[tag] = value ? "O" : "-";
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "검색결과");

    const fileName = currentKeyword
      ? `${currentKeyword}_검색결과.xlsx`
      : "검색결과.xlsx";
    XLSX.writeFile(wb, fileName);
  }, [filteredAndSorted, featureTags, getFeatureValue, currentKeyword]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {products.length > 0 && (
        <PriceDistribution products={products} />
      )}

      {products.length > 0 && (
        <FeatureTags tags={featureTags} onTagsChange={setFeatureTags} />
      )}

      {/* 검색 결과 테이블 */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                검색 결과 ({filteredAndSorted.length}/{products.length}개)
              </h2>
              {featureTags.length > 0 && (
                <span className="text-xs text-gray-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1 align-middle"></span>
                  자동 감지
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-3 mr-1 align-middle"></span>
                  수동 입력
                  <span className="ml-3 text-gray-300">| 셀 클릭으로 토글</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToExcel}
                className="text-sm px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                Excel 다운로드
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  showFilters
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {showFilters ? "필터 숨기기" : "필터 표시"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-16">이미지</th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort("name")}
                  >
                    상품명{sortIcon("name")}
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-blue-600 select-none whitespace-nowrap"
                    onClick={() => toggleSort("price")}
                  >
                    가격{sortIcon("price")}
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort("brand")}
                  >
                    브랜드{sortIcon("brand")}
                  </th>
                  {featureTags.map((tag) => (
                    <th
                      key={tag}
                      className="text-center px-4 py-3 font-medium cursor-pointer hover:text-blue-600 select-none whitespace-nowrap"
                      onClick={() => toggleSort(tag)}
                    >
                      {tag}{sortIcon(tag)}
                    </th>
                  ))}
                </tr>
                {showFilters && (
                  <tr className="bg-gray-100">
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={filters.name}
                        onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                        placeholder="상품명 검색..."
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={filters.priceMin}
                          onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                          placeholder="최소"
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={filters.priceMax}
                          onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                          placeholder="최대"
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={filters.brand}
                        onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
                        placeholder="브랜드 검색..."
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    {featureTags.map((tag) => (
                      <td key={tag} className="px-4 py-2 text-center">
                        <select
                          value={filters.features[tag] || "all"}
                          onChange={(e) => updateFeatureFilter(tag, e.target.value as "all" | "O" | "-")}
                          className="rounded border border-gray-300 px-1 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="all">전체</option>
                          <option value="O">O만</option>
                          <option value="-">-만</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded cursor-pointer"
                          onMouseEnter={(e) => handleImageHover(e, product.image)}
                          onMouseLeave={handleImageLeave}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline line-clamp-2"
                      >
                        {product.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {product.price.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.brand || "-"}
                    </td>
                    {featureTags.map((tag) => {
                      const { value, source } = getFeatureValue(product.id, product.name, tag);
                      return (
                        <td
                          key={tag}
                          className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleManualOverride(product.id, product.name, tag)}
                          title={source === "manual" ? "수동 설정 (클릭하여 자동으로 복원)" : "자동 감지 (클릭하여 수동 전환)"}
                        >
                          {value ? (
                            <span
                              className={`inline-block w-5 h-5 rounded-full text-xs leading-5 font-bold ${
                                source === "manual"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              O
                            </span>
                          ) : source === "manual" ? (
                            <span className="text-red-400 font-bold">-</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td colSpan={4 + featureTags.length} className="px-4 py-8 text-center text-gray-400">
                      필터 조건에 맞는 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 시장 포지셔닝 맵 */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              시장 포지셔닝 맵
            </h2>
          </div>

          {featureTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Y축 항목:</span>
              {featureTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setYAxisKey((prev) => (prev === tag ? null : tag))}
                  className={`rounded-full px-3 py-1 text-sm transition-colors select-none ${
                    activeYKey === tag
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {!activeYKey ? (
            <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">
                {featureTags.length === 0
                  ? "제품 특징 키워드를 추가한 뒤 Y축 항목을 선택하세요."
                  : "위에서 Y축에 표시할 항목을 하나 선택하세요."}
              </p>
            </div>
          ) : (
            <ScatterChart
              data={chartData}
              yAxisLabel={chartYLabel}
              categoryLabels={categoryLabels}
              isEmpty={false}
            />
          )}
        </div>
      )}

      {/* 이미지 확대 팝업 (fixed) */}
      {hoveredImage && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: hoveredImage.x, top: hoveredImage.y }}
        >
          <img
            src={hoveredImage.src}
            alt="확대 이미지"
            className="w-60 h-60 object-contain rounded-lg border border-gray-200 bg-white shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
