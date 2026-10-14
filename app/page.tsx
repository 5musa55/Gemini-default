"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ListingWithProfile, CATEGORIES } from "@/types/database";
import { ListingCard } from "@/components/ListingCard";
import { SearchIcon, PlusIcon } from "@/components/icons";

export default function HomePage() {
  const [listings, setListings] = useState<ListingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Všechny kategorie");
  const [sortBy, setSortBy] = useState<"newest" | "cheapest" | "expensive">("newest");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const fetchListings = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try with joined profiles
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles (
            id,
            email,
            full_name,
            phone,
            university
          )
        `
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        setListings(data as ListingWithProfile[]);
      } else {
        // Fallback: fetch listings directly if relationship join has schema cache delay
        const { data: fallbackData } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallbackData) {
          const userIds = [
            ...new Set(fallbackData.map((l: ListingWithProfile) => l.user_id)),
          ];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, email, full_name, phone, university")
            .in("id", userIds);

          const profileMap = new Map(
            (profilesData || []).map((p: { id: string }) => [p.id, p])
          );
          const combined = fallbackData.map((item: ListingWithProfile) => ({
            ...item,
            profiles: profileMap.get(item.user_id) || null,
          }));
          setListings(combined as ListingWithProfile[]);
        }
      }
    } catch (err) {
      console.error("Chyba:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Status filter
        if (showOnlyActive && item.status !== "active") {
          return false;
        }

        // Category filter
        if (
          selectedCategory !== "Všechny kategorie" &&
          item.category !== selectedCategory
        ) {
          return false;
        }

        // Text search (search in title and description)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchDesc = item.description.toLowerCase().includes(query);
          const matchCategory = item.category.toLowerCase().includes(query);
          const matchUni = item.profiles?.university?.toLowerCase().includes(query);
          return matchTitle || matchDesc || matchCategory || matchUni;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "cheapest") return a.price - b.price;
        if (sortBy === "expensive") return b.price - a.price;
        // Default: newest
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [listings, searchQuery, selectedCategory, sortBy, showOnlyActive]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-8 sm:p-12 text-white shadow-xl shadow-blue-900/10 mb-10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">
            🎓 Studentská burza pro VŠ & SŠ
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Kup a prodej učebnice i kolejní výbavu
          </h1>
          <p className="mt-3 text-base sm:text-lg text-blue-100">
            Jednoduchý bazar pro studenty bez poplatků. Skripta, notebooky, kalkulačky, nábytek i oblečení od spolužáků.
          </p>

          {/* Search bar inside Hero */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Co hledáte? (např. Matematická analýza, monitor, kalkulačka...)"
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-zinc-900 shadow-lg placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-600"
                >
                  Vymazat
                </button>
              )}
            </div>
            <Link
              href="/pridat-inzerat"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-600 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Vložit inzerát
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-16 h-80 w-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </section>

      {/* Categories & Filter Bar */}
      <section className="mb-8 space-y-4">
        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Secondary controls: Sort, Status toggle, and Count */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 text-sm">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>
              Nalezeno{" "}
              <strong className="text-zinc-900 dark:text-white font-semibold">
                {filteredListings.length}
              </strong>{" "}
              {filteredListings.length === 1
                ? "inzerát"
                : filteredListings.length >= 2 && filteredListings.length <= 4
                ? "inzeráty"
                : "inzerátů"}
            </span>
            {searchQuery && (
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-500">
                filtr: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Show only active toggle */}
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Pouze aktivní</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span>Řadit dle:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "cheapest" | "expensive")}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="newest">Nejnovější</option>
                <option value="cheapest">Od nejlevnějšího</option>
                <option value="expensive">Od nejdražšího</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="aspect-[4/3] rounded-lg bg-zinc-200 dark:bg-zinc-800 mb-3" />
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 mb-2" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
                <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-5xl">🔍</span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Žádné inzeráty neodpovídají zadání
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
              Zkuste upravit hledaný výraz, vybrat jinou kategorii nebo zrušit filtr aktivních inzerátů.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Všechny kategorie");
                  setShowOnlyActive(false);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Resetovat filtry
              </button>
              <Link
                href="/pridat-inzerat"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Přidat první inzerát
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
