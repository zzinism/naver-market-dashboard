"use client";

import { useMemo, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Product } from "@/types";

const BRAND_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#d946ef",
  "#22c55e", "#eab308", "#64748b", "#fb923c", "#2dd4bf",
];

interface BarDataPoint {
  index: number;
  name: string;
  price: number;
  brand: string;
  url: string;
  image: string;
}

interface PriceDistributionProps {
  products: Product[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BarDataPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm max-w-xs">
      <p className="font-semibold text-gray-900 mb-1 line-clamp-2">{d.name}</p>
      <p className="text-gray-600">가격: {d.price.toLocaleString()}원</p>
      {d.brand && <p className="text-gray-600">브랜드: {d.brand}</p>}
      <p className="text-xs text-gray-400 mt-1">더블클릭하면 상품 페이지로 이동합니다.</p>
    </div>
  );
}

export default function PriceDistribution({ products }: PriceDistributionProps) {
  const lastClickRef = useRef<{ index: number; time: number } | null>(null);

  // 브랜드별 색상 매핑
  const brandColorMap = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand || "(브랜드 없음)"))];
    const map: Record<string, string> = {};
    brands.forEach((b, i) => {
      map[b] = BRAND_COLORS[i % BRAND_COLORS.length];
    });
    return map;
  }, [products]);

  // 가격순 정렬된 차트 데이터
  const barData = useMemo(() => {
    return [...products]
      .sort((a, b) => a.price - b.price)
      .map((p, i) => ({
        index: i,
        name: p.name,
        price: p.price,
        brand: p.brand || "(브랜드 없음)",
        url: p.url,
        image: p.image,
      }));
  }, [products]);

  // 통계
  const stats = useMemo(() => {
    const prices = products.map((p) => p.price);
    return {
      count: products.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
    };
  }, [products]);

  // 브랜드 목록 (범례용)
  const brandList = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const b = p.brand || "(브랜드 없음)";
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([brand]) => brand);
  }, [products]);

  // 더블클릭 감지
  const handleBarClick = useCallback((data: BarDataPoint) => {
    const now = Date.now();
    const last = lastClickRef.current;

    if (last && last.index === data.index && now - last.time < 400) {
      window.open(data.url, "_blank", "noopener,noreferrer");
      lastClickRef.current = null;
    } else {
      lastClickRef.current = { index: data.index, time: now };
    }
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 통계 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">상품 수</p>
          <p className="text-xl font-bold text-gray-900">{stats.count}건</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">최저가</p>
          <p className="text-xl font-bold text-gray-900">{stats.min.toLocaleString()}원</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">최고가</p>
          <p className="text-xl font-bold text-gray-900">{stats.max.toLocaleString()}원</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">평균가</p>
          <p className="text-xl font-bold text-gray-900">{stats.avg.toLocaleString()}원</p>
        </div>
      </div>

      {/* 가격 분포 차트 */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">가격 분포</h3>
      <p className="text-xs text-gray-400 mb-3">
        막대를 더블클릭하면 상품 페이지가 열립니다.
      </p>

      {/* 브랜드 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4 text-xs">
        <span className="text-gray-500 font-medium">브랜드</span>
        {brandList.map((brand) => (
          <span key={brand} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: brandColorMap[brand] }}
            />
            {brand}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="index" tick={false} axisLine={false} />
          <YAxis
            tickFormatter={(v: number) => {
              if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
              if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
              return String(v);
            }}
            label={{ value: "가격 (원)", angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 11 } }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
          <Bar
            dataKey="price"
            radius={[2, 2, 0, 0]}
            onClick={(_data: unknown, index: number) => handleBarClick(barData[index])}
            style={{ cursor: "pointer" }}
          >
            {barData.map((entry) => (
              <Cell key={entry.index} fill={brandColorMap[entry.brand]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
