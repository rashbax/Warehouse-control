"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPrihod } from "@/app/(dashboard)/prihod/actions";

const MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

type Sku = { id: string; artikul: string; model: string; color: string; marketplace: string };

export default function PrihodForm({ skus }: { skus: Sku[] }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");

  // Searchable SKU picker state
  const [skuSearch, setSkuSearch] = useState("");
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const filteredSkus = selectedMarketplace
    ? skus.filter((s) => s.marketplace === selectedMarketplace)
    : skus;

  const searchedSkus = skuSearch
    ? filteredSkus.filter((s) => {
        const q = skuSearch.toLowerCase();
        return (
          s.artikul.toLowerCase().includes(q) ||
          s.model.toLowerCase().includes(q) ||
          s.color.toLowerCase().includes(q)
        );
      })
    : filteredSkus;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset SKU selection when marketplace changes
  useEffect(() => {
    setSelectedSku(null);
    setSkuSearch("");
  }, [selectedMarketplace]);

  function selectSku(sku: Sku) {
    setSelectedSku(sku);
    setSkuSearch("");
    setDropdownOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createPrihod(fd);
      if (result.error) {
        setError(result.error);
      } else {
        form.reset();
        setSelectedMarketplace("");
        setSelectedSku(null);
        setSkuSearch("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Приход товара</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Marketplace filter (UI-only, not submitted) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Маркетплейс
            </label>
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Все маркетплейсы —</option>
              {MARKETPLACES.map((mp) => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
          </div>

          {/* Searchable SKU picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Товар (SKU) *
            </label>
            {/* Hidden input for form submission */}
            <input type="hidden" name="skuId" value={selectedSku?.id ?? ""} />

            {selectedSku ? (
              <div className="flex items-center justify-between px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm">
                <span className="font-mono [font-variant-numeric:slashed-zero]">
                  {selectedSku.artikul} — {selectedSku.model} / {selectedSku.color}
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedSku(null); setSkuSearch(""); }}
                  className="ml-2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => { setSkuSearch(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  disabled={!selectedMarketplace}
                  placeholder={
                    !selectedMarketplace
                      ? "Сначала выберите маркетплейс"
                      : filteredSkus.length === 0
                      ? `Нет товаров для «${selectedMarketplace}»`
                      : "Введите артикул, модель или цвет..."
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                />
                {dropdownOpen && selectedMarketplace && searchedSkus.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchedSkus.map((sku) => (
                      <li key={sku.id}>
                        <button
                          type="button"
                          onClick={() => selectSku(sku)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 font-mono [font-variant-numeric:slashed-zero]"
                        >
                          {sku.artikul} — {sku.model} / {sku.color}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {dropdownOpen && selectedMarketplace && skuSearch && searchedSkus.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm text-slate-400">
                    Ничего не найдено
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Честный знак */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Честный знак *
            </label>
            <input
              name="chestnyZnak"
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Код маркировки"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Количество *
            </label>
            <input
              name="qty"
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Дата *
            </label>
            <input
              name="date"
              type="date"
              defaultValue={today}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Примечание
            </label>
            <textarea
              name="note"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Необязательно"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              Приход успешно записан
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !selectedSku}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Сохранение..." : "Записать приход"}
          </button>
        </form>
      </div>
    </div>
  );
}
