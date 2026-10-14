"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Listing, ListingStatus } from "@/types/database";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

export default function MyListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyListings = React.useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Chyba při načítání mých inzerátů:", error);
      } else {
        setListings((data as Listing[]) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchMyListings(user.id);
    }
  }, [user, authLoading, router, fetchMyListings]);

  const handleStatusChange = async (id: string, newStatus: ListingStatus) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        alert("Chyba při změně stavu: " + error.message);
      } else {
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Opravdu si přejete smazat inzerát "${title}"?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) {
        alert("Chyba při mazání: " + error.message);
      } else {
        setListings((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("cs-CZ");
    } catch {
      return dateString;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 pt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Moje inzeráty
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Správa vašich nabídek, rychlá změna stavu na rezervováno/prodáno a editace.
          </p>
        </div>

        <Link
          href="/pridat-inzerat"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-4 w-4" />
          Vytvořit nový inzerát
        </Link>
      </div>

      {/* Listings Table / Cards */}
      <div className="mt-8">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-5xl">📋</span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Zatím jste nevytvořili žádný inzerát
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
              Máte skripta, starou kalkulačku nebo vybavení na kolej, které už nepotřebujete? Nabídněte je dalším studentům.
            </p>
            <div className="mt-6">
              <Link
                href="/pridat-inzerat"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                <PlusIcon className="h-4 w-4" />
                Vložit první inzerát
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Thumbnail & Title */}
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400 text-lg">
                        📦
                      </div>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/inzerat/${item.id}`}
                      className="text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(item.price)}
                      </span>
                      <span>•</span>
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>Přidáno {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500">Stav:</span>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(
                          item.id,
                          e.target.value as ListingStatus
                        )
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                          : item.status === "reserved"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      <option value="active">Aktivní</option>
                      <option value="reserved">Rezervováno</option>
                      <option value="sold">Prodáno</option>
                    </select>
                  </div>

                  {/* Edit button */}
                  <Link
                    href={`/upravit-inzerat/${item.id}`}
                    className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    Upravit
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60 disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    {deletingId === item.id ? "Mažu..." : "Smazat"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
