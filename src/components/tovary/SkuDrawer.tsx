"use client";

import { useState, useTransition, useEffect } from "react";
import { getSkuDetails, quickPrihod, quickOtgruzka } from "@/app/(dashboard)/tovary/actions";

const MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

type Op = {
  id: string;
  type: "PRIHOD" | "OTGRUZKA";
  qty: number;
  marketplace: string | null;
  note: string | null;
  date: string;
  userName: string | null;
};

type Details = {
  id: string;
  artikul: string;
  model: string;
  color: string;
  honestSign: string | null;
  imageUrl: string | null;
  note: string | null;
  stock: number;
  operations: Op[];
};

type Props = {
  skuId: string | null;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SkuDrawer({ skuId, onClose, onEditClick, onDeleteClick }: Props) {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "prihod" | "otgruzka">("info");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!skuId) { setDetails(null); return; }
    setLoading(true);
    setTab("info");
    setFormError(null);
    setFormSuccess(null);
    getSkuDetails(skuId).then((d) => {
      setDetails(d);
      setLoading(false);
    });
  }, [skuId]);

  function refreshDetails() {
    if (!skuId) return;
    getSkuDetails(skuId).then(setDetails);
  }

  function handlePrihod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setFormError(null);
    startTransition(async () => {
      try {
        await quickPrihod(skuId!, fd);
        form.reset();
        setFormSuccess("Приход записан");
        refreshDetails();
        setTimeout(() => setFormSuccess(null), 2500);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  function handleOtgruzka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setFormError(null);
    startTransition(async () => {
      try {
        await quickOtgruzka(skuId!, fd);
        form.reset();
        setFormSuccess("Отгрузка записана");
        refreshDetails();
        setTimeout(() => setFormSuccess(null), 2500);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  if (!skuId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {loading ? "Загрузка..." : details ? details.artikul : "SKU"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400">Загрузка...</div>
        )}

        {!loading && details && (
          <div className="flex-1 overflow-y-auto">
            {/* SKU Info */}
            <div className="px-5 py-4 flex gap-4 border-b border-slate-100">
              {details.imageUrl ? (
                <img src={details.imageUrl} alt={details.model} className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold text-slate-800">{details.artikul}</p>
                <p className="text-sm text-slate-700 mt-0.5">{details.model}</p>
                <p className="text-sm text-slate-500">{details.color}</p>
                {details.honestSign && (
                  <p className="text-xs text-slate-500 mt-1 font-mono" title="Честный знак">
                    ЧЗ: {details.honestSign}
                  </p>
                )}
                {details.note && <p className="text-xs text-slate-400 mt-1 italic">{details.note}</p>}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                    details.stock <= 10 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    Остаток: {details.stock} шт.
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 py-3 flex gap-2 border-b border-slate-100">
              <button
                onClick={onEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>
              <button
                onClick={() => { setTab("prihod"); setFormError(null); setFormSuccess(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === "prihod" ? "bg-green-600 text-white" : "text-green-700 border border-green-300 hover:bg-green-50"}`}
              >
                + Приход
              </button>
              <button
                onClick={() => { setTab("otgruzka"); setFormError(null); setFormSuccess(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === "otgruzka" ? "bg-orange-500 text-white" : "text-orange-600 border border-orange-300 hover:bg-orange-50"}`}
              >
                − Отгрузка
              </button>
              <button
                onClick={onDeleteClick}
                className="ml-auto p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Удалить товар"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Quick forms */}
            {(tab === "prihod" || tab === "otgruzka") && (
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <form onSubmit={tab === "prihod" ? handlePrihod : handleOtgruzka} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Количество *</label>
                      <input name="qty" type="number" min="1" required className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Дата *</label>
                      <input name="date" type="date" defaultValue={today} required className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  {tab === "otgruzka" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Маркетплейс *</label>
                      <select name="marketplace" required defaultValue="" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="" disabled>— Выберите —</option>
                        {MARKETPLACES.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Примечание</label>
                    <input name="note" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Необязательно" />
                  </div>
                  {formError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                  {formSuccess && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{formSuccess}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTab("info")} className="px-3 py-1.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100">Отмена</button>
                    <button type="submit" disabled={isPending} className={`flex-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${tab === "prihod" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}>
                      {isPending ? "Сохранение..." : tab === "prihod" ? "Записать приход" : "Записать отгрузку"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Operations history */}
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">История операций</h3>
              {details.operations.length === 0 ? (
                <p className="text-sm text-slate-400">Операций нет</p>
              ) : (
                <div className="space-y-2">
                  {details.operations.map((op) => (
                    <div key={op.id} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${op.type === "PRIHOD" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                          {op.type === "PRIHOD" ? "+" : "−"}{op.qty}
                        </span>
                        <div>
                          <p className="text-xs text-slate-600">{formatDate(op.date)}{op.marketplace ? ` · ${op.marketplace}` : ""}</p>
                          {op.note && <p className="text-xs text-slate-400">{op.note}</p>}
                          {op.userName && <p className="text-xs text-slate-400">{op.userName}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
