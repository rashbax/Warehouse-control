"use client";

import { useState, useTransition } from "react";
import { createPrihod } from "@/app/(dashboard)/prihod/actions";

const MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

type Sku = { id: string; artikul: string; model: string; color: string; marketplace: string };

export default function PrihodForm({ skus }: { skus: Sku[] }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const filteredSkus = selectedMarketplace
    ? skus.filter((s) => s.marketplace === selectedMarketplace)
    : skus;

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

          {/* SKU select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Товар (SKU) *
            </label>
            <select
              name="skuId"
              required
              disabled={!selectedMarketplace}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 [font-variant-numeric:slashed-zero]"
            >
              <option value="">
                {!selectedMarketplace
                  ? "— Сначала выберите маркетплейс —"
                  : filteredSkus.length === 0
                  ? `Нет товаров для «${selectedMarketplace}»`
                  : "— Выберите товар —"}
              </option>
              {filteredSkus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.artikul} — {sku.model} / {sku.color}
                </option>
              ))}
            </select>
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
            disabled={isPending || !selectedMarketplace || filteredSkus.length === 0}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Сохранение..." : "Записать приход"}
          </button>
        </form>
      </div>
    </div>
  );
}
