"use client";

import { useState, useMemo } from "react";

type Row = {
  id: string;
  type: "PRIHOD" | "OTGRUZKA";
  qty: number;
  marketplace: string | null;
  note: string | null;
  date: string;
  artikul: string;
  model: string;
  color: string;
  userName: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function IstoriyaTable({ rows }: { rows: Row[] }) {
  const [skuSearch, setSkuSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PRIHOD" | "OTGRUZKA">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = skuSearch.toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    return rows.filter((row) => {
      if (typeFilter !== "ALL" && row.type !== typeFilter) return false;
      if (q && !row.artikul.toLowerCase().includes(q) && !row.model.toLowerCase().includes(q)) return false;
      const d = new Date(row.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, skuSearch, typeFilter, dateFrom, dateTo]);

  const hasFilters = skuSearch || typeFilter !== "ALL" || dateFrom || dateTo;

  function clearFilters() {
    setSkuSearch("");
    setTypeFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">История операций</h1>
        <span className="text-sm text-slate-500">{filtered.length} из {rows.length} записей</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 flex-shrink-0">
        {/* SKU search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            placeholder="Поиск по SKU..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
          />
          {skuSearch && (
            <button onClick={() => setSkuSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>

        {/* Date from */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">С</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">По</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Operation type */}
        <div className="flex rounded-lg border border-slate-300 overflow-hidden bg-white text-sm">
          {(["ALL", "PRIHOD", "OTGRUZKA"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 font-medium transition-colors ${
                typeFilter === t
                  ? t === "PRIHOD"
                    ? "bg-green-600 text-white"
                    : t === "OTGRUZKA"
                    ? "bg-orange-500 text-white"
                    : "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "ALL" ? "Все" : t === "PRIHOD" ? "Приход" : "Отгрузка"}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{hasFilters ? "Ничего не найдено" : "Нет операций"}</p>
            <p className="text-sm mt-1">{hasFilters ? "Попробуйте изменить фильтры" : "Запишите приход или отгрузку"}</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Дата</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Тип</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Артикул</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Модель / Цвет</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Кол-во</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Маркетплейс</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Примечание</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Пользователь</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.type === "PRIHOD"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {row.type === "PRIHOD" ? "Приход" : "Отгрузка"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      {row.artikul}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.model} / {row.color}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {row.type === "PRIHOD" ? "+" : "−"}{row.qty}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.marketplace ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {row.note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.userName ?? "—"}
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
