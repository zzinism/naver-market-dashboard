import Link from "next/link";

export default function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
      <Link href="/" className="text-lg font-bold text-gray-900">
        Market Positioning Dashboard
      </Link>
      <span className="text-sm text-gray-500">네이버 쇼핑 시장 분석</span>
    </header>
  );
}
