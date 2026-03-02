"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSku, updateSku, deleteSku } from "@/app/(dashboard)/tovary/actions";
import SkuDrawer from "./SkuDrawer";

type Sku = {
  id: string;
  artikul: string;
  model: string;
  color: string;
  imageUrl: string | null;
  note: string | null;
};

export default function SkuList({ skus }: { skus: Sku[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (!highlightId) return;
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(() => {
      router.replace("/tovary", { scroll: false });
    }, 2000);
    return () => clearTimeout(t);
  }, [highlightId, router]);

  const [drawerSkuId, setDrawerSkuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; sku: Sku } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setImagePreview(null);
    setError(null);
    setModal({ mode: "add" });
  }

  function openEdit(sku: Sku) {
    setImagePreview(sku.imageUrl);
    setError(null);
    setModal({ mode: "edit", sku });
  }

  function closeModal() {
    setModal(null);
    setImagePreview(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        if (modal!.mode === "add") {
          await createSku(fd);
        } else {
          await updateSku((modal as { mode: "edit"; sku: Sku }).sku.id, fd);
        }
        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка при сохранении.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSku(id);
      setDeleteId(null);
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Товары (SKU)</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить товар
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {skus.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="font-medium">Товаров нет</p>
            <p className="text-sm mt-1">Добавьте первый товар</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 w-16">Фото</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Артикул</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Модель</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Цвет</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Примечание</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 w-24 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skus.map((sku) => (
                  <tr
                    key={sku.id}
                    ref={sku.id === highlightId ? highlightRef : undefined}
                    className={`transition-colors ${
                      sku.id === highlightId
                        ? "bg-blue-50 ring-2 ring-inset ring-blue-300"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      {sku.imageUrl ? (
                        <img
                          src={sku.imageUrl}
                          alt={sku.model}
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
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{sku.artikul}</td>
                    <td className="px-4 py-3 text-slate-700">{sku.model}</td>
                    <td className="px-4 py-3 text-slate-700">{sku.color}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{sku.note ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDrawerSkuId(sku.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Открыть карточку"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-5">
              {modal.mode === "add" ? "Добавить товар" : "Редактировать товар"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Артикул *
                </label>
                <input
                  name="artikul"
                  defaultValue={modal.mode === "edit" ? modal.sku.artikul : ""}
                  disabled={modal.mode === "edit"}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Например: WB-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Модель *
                </label>
                <input
                  name="model"
                  defaultValue={modal.mode === "edit" ? modal.sku.model : ""}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Название модели"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Цвет *
                </label>
                <input
                  name="color"
                  defaultValue={modal.mode === "edit" ? modal.sku.color : ""}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Чёрный"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Примечание
                </label>
                <textarea
                  name="note"
                  defaultValue={modal.mode === "edit" ? (modal.sku.note ?? "") : ""}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Необязательно"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Фото <span className="text-xs font-normal text-slate-400">(JPG или PNG, 1 файл)</span>
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg mb-2 border border-slate-200"
                  />
                )}
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!["image/jpeg", "image/png"].includes(file.type)) {
                      setError("Допустимы только форматы JPG и PNG.");
                      e.target.value = "";
                      setImagePreview(null);
                      return;
                    }
                    setError(null);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Удалить товар?</h2>
            <p className="text-sm text-slate-500 mb-6">
              Это действие нельзя отменить. Все операции по этому товару также будут удалены.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKU Drawer */}
      <SkuDrawer
        skuId={drawerSkuId}
        onClose={() => setDrawerSkuId(null)}
        onEditClick={() => {
          const sku = skus.find((s) => s.id === drawerSkuId);
          if (sku) { setDrawerSkuId(null); openEdit(sku); }
        }}
        onDeleteClick={() => {
          const id = drawerSkuId;
          if (id) { setDrawerSkuId(null); setDeleteId(id); }
        }}
      />
    </>
  );
}
