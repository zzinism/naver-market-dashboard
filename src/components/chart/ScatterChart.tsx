"use client";

import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

export interface ChartDataPoint {
  name: string;
  price: number;
  yValue: number;
  yLabel: string;
  brand?: string;
}

interface ScatterChartProps {
  data: ChartDataPoint[];
  yAxisLabel: string;
  categoryLabels?: string[];
  isEmpty: boolean;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm max-w-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.name}</p>
      <p className="text-gray-600">가격: {d.price.toLocaleString()}원</p>
      <p className="text-blue-600 font-medium">{d.yLabel}</p>
      {d.brand && <p className="text-gray-600">브랜드: {d.brand}</p>}
    </div>
  );
}

export default function ScatterChart({
  data,
  yAxisLabel,
  categoryLabels = [],
  isEmpty,
}: ScatterChartProps) {
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">
          키워드를 검색하면 여기에 Scatter Plot이 표시됩니다.
        </p>
      </div>
    );
  }

  const maxY = Math.max(...data.map((d) => d.yValue), 0);
  const ticks = Array.from({ length: maxY + 1 }, (_, i) => i);

  // Y축 높이를 카테고리 수에 맞게 조정 (최소 300, 카테고리당 60px)
  const chartHeight = Math.max(300, categoryLabels.length * 60 + 80);

  // Y축 라벨 왼쪽 여백 계산
  const maxLabelLength = categoryLabels.reduce((max, l) => Math.max(max, l.length), 0);
  const leftMargin = Math.max(20, maxLabelLength * 8 + 10);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <RechartsScatterChart margin={{ top: 20, right: 30, bottom: 20, left: leftMargin }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="price"
          name="가격"
          tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}만`}
          label={{ value: "가격", position: "insideBottom", offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="yValue"
          name={yAxisLabel}
          domain={[-0.5, maxY + 0.5]}
          ticks={ticks}
          allowDecimals={false}
          tickFormatter={(v: number) => categoryLabels[v] ?? String(v)}
          width={leftMargin}
        />
        <ZAxis range={[80, 80]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={data} fill="#3b82f6" fillOpacity={0.7} />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}
