"use client";

import { useState, useTransition } from "react";
import { createOtgruzka } from "@/app/(dashboard)/otgruzka/actions";

const MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

type Sku = { id: string; artikul: string; model: string; color: string };

export default function OtgruzkaForm({ skus }: { skus: Sku[] }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await createOtgruzka(fd);
        form.reset();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка при сохранении.");
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Отгрузка товара</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SKU select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Товар (SKU) *
            </label>
            {skus.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Сначала добавьте товары в разделе «Товары (SKU)»
              </p>
            ) : (
              <select
                name="skuId"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Выберите товар —</option>
                {skus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.artikul} — {sku.model} / {sku.color}
                  </option>
                ))}
              </select>
            )}
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

          {/* Marketplace */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Маркетплейс *
            </label>
            <select
              name="marketplace"
              required
              defaultValue=""
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>— Выберите маркетплейс —</option>
              {MARKETPLACES.map((mp) => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
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
              Отгрузка успешно записана
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || skus.length === 0}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Сохранение..." : "Записать отгрузку"}
          </button>
        </form>
      </div>
    </div>
  );
}
