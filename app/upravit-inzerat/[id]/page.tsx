"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES, ListingStatus, Listing } from "@/types/database";
import { ImageUpload } from "@/components/ImageUpload";
import {
  ArrowLeftIcon,
  TrashIcon,
  CheckIcon,
  AlertCircleIcon,
  ShieldIcon,
} from "@/components/icons";

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const listingId = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("Učebnice a skripta");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [status, setStatus] = useState<ListingStatus>("active");
  const [listingOwnerId, setListingOwnerId] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadListing = React.useCallback(
    async (id: string) => {
      setInitialLoading(true);
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          setError("Inzerát nebyl nalezen.");
        } else {
          const item = data as Listing;
          // Check authorization: user must be author OR admin
          if (item.user_id !== user?.id && !isAdmin) {
            setError("Nemáte oprávnění upravovat tento inzerát.");
            return;
          }

          setTitle(item.title);
          setDescription(item.description);
          setPrice(item.price.toString());
          setCategory(item.category);
          setImageUrl(item.image_url || "");
          setStatus(item.status);
          setListingOwnerId(item.user_id);
        }
      } catch (err) {
        console.error(err);
        setError("Chyba při načítání dat.");
      } finally {
        setInitialLoading(false);
      }
    },
    [user?.id, isAdmin]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user && listingId) {
      loadListing(listingId);
    }
  }, [user, authLoading, listingId, router, loadListing]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Zadejte platnou nezápornou cenu.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Vyplňte prosím název i popis.");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        image_url: imageUrl.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", listingId);

      if (updateError) {
        throw updateError;
      }

      router.push(`/inzerat/${listingId}`);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Chyba při ukládání změn."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Opravdu si přejete tento inzerát trvale smazat?"
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) {
        alert("Chyba při mazání: " + error.message);
      } else {
        alert("Inzerát byl úspěšně smazán.");
        if (isAdmin && user?.id !== listingOwnerId) {
          router.push("/admin");
        } else {
          router.push("/moje-inzeraty");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const formCategories = CATEGORIES.filter((c) => c !== "Všechny kategorie");

  if (authLoading || initialLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/inzerat/${listingId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět na detail inzerátu
        </Link>

        {isAdmin && user?.id !== listingOwnerId && (
          <span className="flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldIcon className="h-3.5 w-3.5" />
            Moderátorská úprava
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Upravit inzerát
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Upravte informace, cenu, stav nebo fotografii nabídky.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span>{deleting ? "Mažu..." : "Smazat inzerát"}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
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
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Kategorie, Cena, Stav */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 pr-12 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                  Kč
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Stav inzerátu *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="active">Aktivní (k prodeji)</option>
                <option value="reserved">Rezervováno</option>
                <option value="sold">Prodáno</option>
              </select>
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

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <Link
              href={`/inzerat/${listingId}`}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Zrušit
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{saving ? "Ukládám změny..." : "Uložit změny"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
