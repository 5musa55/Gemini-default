"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/types/database";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowLeftIcon, PlusIcon, AlertCircleIcon } from "@/components/icons";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("Učebnice a skripta");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Zadejte platnou cenu (0 Kč a více).");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Vyplňte prosím název i popis inzerátu.");
      return;
    }

    setLoading(true);

    try {
      const newListing = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: category,
        image_url: imageUrl.trim() || null,
        status: "active",
      };

      const { data, error: insertError } = await supabase
        .from("listings")
        .insert(newListing)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      router.push(data?.id ? `/inzerat/${data.id}` : "/moje-inzeraty");
    } catch (err: unknown) {
      console.error("Chyba při vytváření inzerátu:", err);
      const message =
        err instanceof Error ? err.message : "Chyba při ukládání inzerátu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formCategories = CATEGORIES.filter((c) => c !== "Všechny kategorie");

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/moje-inzeraty"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět na moje inzeráty
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Vložit nový inzerát
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Vyplňte parametry předmětu, který chcete nabídnout ostatním studentům.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Název */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Název inzerátu *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Skripta Matematická analýza I nebo Monitor 24 FHD"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Kategorie & Cena */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {formCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Cena (v Kč) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 pr-12 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                  Kč
                </span>
              </div>
            </div>
          </div>

          {/* Popis */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Podrobný popis *
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uveďte stav předmětu, rok vydání skript, předání na kolejích nebo kampusu apod."
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Obrázek */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Obrázek inzerátu
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <Link
              href="/moje-inzeraty"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Zrušit
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{loading ? "Ukládám..." : "Zveřejnit inzerát"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

