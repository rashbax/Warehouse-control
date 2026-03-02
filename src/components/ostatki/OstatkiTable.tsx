"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Row = {
  id: string;
  artikul: string;
  model: string;
  color: string;
  imageUrl: string | null;
  stock: number;
  lastDate: string | null;
};

type SortKey = "artikul" | "model" | "color" | "stock" | "lastDate";
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block ${active ? "text-blue-600" : "text-slate-300"}`}>
      {active && dir === "desc" ? "↓" : "↑"}
    </span>
  );
}

export default function OstatkiTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("artikul");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter(
        (r) =>
          !q ||
          r.artikul.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.color.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let av: string | number = a[sortKey] ?? "";
        let bv: string | number = b[sortKey] ?? "";
        if (sortKey === "stock") {
          av = a.stock;
          bv = b.stock;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [rows, search, sortKey, sortDir]);

  const thClass =
    "px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900 whitespace-nowrap";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Остатки</h1>
        <span className="text-sm text-slate-500">{filtered.length} из {rows.length} товаров</span>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по артикулу, модели, цвету..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium">{search ? "Ничего не найдено" : "Нет данных"}</p>
            <p className="text-sm mt-1">{search ? "Попробуйте другой запрос" : "Запишите приход товара"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 w-16">Фото</th>
                  <th className={thClass} onClick={() => toggleSort("artikul")}>
                    Артикул <SortIcon active={sortKey === "artikul"} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("model")}>
                    Модель <SortIcon active={sortKey === "model"} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("color")}>
                    Цвет <SortIcon active={sortKey === "color"} dir={sortDir} />
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => toggleSort("stock")}>
                    Остаток <SortIcon active={sortKey === "stock"} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("lastDate")}>
                    Последнее движение <SortIcon active={sortKey === "lastDate"} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={row.model}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tovary?highlight=${row.id}`}
                        className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {row.artikul}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.model}</td>
                    <td className="px-4 py-3 text-slate-700">{row.color}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-full text-sm font-semibold ${
                          row.stock <= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {row.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.lastDate ? formatDate(row.lastDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
