"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  ListingWithProfile,
  Profile,
  ListingStatus,
} from "@/types/database";
import {
  ShieldIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
} from "@/components/icons";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<ListingWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "users">("listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAdminData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all listings with author profiles
      const { data: listingsData, error: listingsError } = await supabase
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

      if (!listingsError && listingsData) {
        setListings(listingsData as ListingWithProfile[]);
      } else {
        const { data: fallbackData } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallbackData) {
          const userIds = [
            ...new Set(fallbackData.map((l: ListingWithProfile) => l.user_id)),
          ];
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, email, full_name, phone, university")
            .in("id", userIds);

          const pMap = new Map((profs || []).map((p: { id: string }) => [p.id, p]));
          const comb = fallbackData.map((item: ListingWithProfile) => ({
            ...item,
            profiles: pMap.get(item.user_id) || null,
          }));
          setListings(comb as ListingWithProfile[]);
        }
      }

      // 2. Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Chyba při načítání profilů:", profilesError);
      } else if (profilesData) {
        setProfiles(profilesData as Profile[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (isAdmin) {
        loadAdminData();
      }
    }
  }, [user, isAdmin, authLoading, router, loadAdminData]);

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

  const handleDeleteListing = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `MODERACE: Opravdu chcete smazat inzerát "${title}" z celého systému?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) {
        alert("Chyba při mazání inzerátu: " + error.message);
      } else {
        setListings((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAdmin = async (targetProfile: Profile) => {
    const willBeAdmin = !targetProfile.is_admin;
    const actionText = willBeAdmin ? "udělit roli administrátora" : "odebrat roli administrátora";
    const confirmed = window.confirm(
      `Opravdu si přejete uživateli ${targetProfile.email || targetProfile.full_name} ${actionText}?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: willBeAdmin, updated_at: new Date().toISOString() })
        .eq("id", targetProfile.id);

      if (error) {
        alert("Chyba při změně role: " + error.message);
      } else {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === targetProfile.id ? { ...p, is_admin: willBeAdmin } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
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

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchAuthor = item.profiles?.full_name?.toLowerCase().includes(q);
        const matchEmail = item.profiles?.email?.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        return matchTitle || matchAuthor || matchEmail || matchCat;
      }
      return true;
    });
  }, [listings, searchQuery, statusFilter]);

  // Authorization check fallback
  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl dark:bg-red-950/50">
          🚫
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
          Přístup odepřen
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tato sekce je vyhrazena pouze pro administrátory Studentského bazaru.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    );
  }

  // Metrics
  const totalListings = listings.length;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const reservedCount = listings.filter((l) => l.status === "reserved").length;
  const soldCount = listings.filter((l) => l.status === "sold").length;
  const totalUsers = profiles.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
              <ShieldIcon className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Administrátorské rozhraní
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Moderace všech inzerátů v systému, správa uživatelů a dohled nad bazarem.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "listings"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            Všechny inzeráty ({totalListings})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "users"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            Uživatelé ({totalUsers})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500">Celkem inzerátů</span>
          <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {totalListings}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Aktivní inzeráty
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Rezervováno / Prodáno
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {reservedCount + soldCount}
          </div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-950 dark:bg-purple-950/20">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
            Registrovaní uživatelé
          </span>
          <div className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-400">
            {totalUsers}
          </div>
        </div>
      </div>

      {/* TAB 1: LISTINGS MODERATION */}
      {activeTab === "listings" && (
        <div className="mt-8 space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrovat dle názvu, autora, e-mailu..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Stav:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">Všechny stavy</option>
                <option value="active">Pouze aktivní</option>
                <option value="reserved">Pouze rezervované</option>
                <option value="sold">Pouze prodané</option>
              </select>
            </div>
          </div>

          {/* Listings Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <tr>
                    <th className="py-3 px-4">Předmět / Název</th>
                    <th className="py-3 px-4">Autor inzerátu</th>
                    <th className="py-3 px-4">Kategorie & Cena</th>
                    <th className="py-3 px-4">Datum</th>
                    <th className="py-3 px-4">Stav (moderace)</th>
                    <th className="py-3 px-4 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                        Nebyly nalezeny žádné inzeráty odpovídající filtru.
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        {/* Item title & thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              {item.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="max-w-[200px]">
                              <Link
                                href={`/inzerat/${item.id}`}
                                className="font-semibold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate block"
                                title={item.title}
                              >
                                {item.title}
                              </Link>
                              <span className="text-[11px] text-zinc-400 truncate block">
                                ID: {item.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {item.profiles?.full_name || "Neznámý"}
                          </div>
                          <div className="text-zinc-400">{item.profiles?.email}</div>
                          {item.profiles?.phone && (
                            <div className="text-zinc-400">{item.profiles.phone}</div>
                          )}
                        </td>

                        {/* Category & Price */}
                        <td className="py-3 px-4 text-xs">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {formatPrice(item.price)}
                          </div>
                          <div className="text-zinc-400">{item.category}</div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-xs text-zinc-400">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Status selector */}
                        <td className="py-3 px-4">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(
                                item.id,
                                e.target.value as ListingStatus
                              )
                            }
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none ${
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
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/upravit-inzerat/${item.id}`}
                              className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              title="Upravit inzerát jako administrátor"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => handleDeleteListing(item.id, item.title)}
                              disabled={deletingId === item.id}
                              className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60 disabled:opacity-50"
                              title="Smazat inzerát jako administrátor"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <tr>
                    <th className="py-3 px-4">Uživatel</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Telefon</th>
                    <th className="py-3 px-4">Škola / Univerzita</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Akce role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {p.full_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-xs">{p.email}</td>
                      <td className="py-3 px-4 text-xs">{p.phone || "—"}</td>
                      <td className="py-3 px-4 text-xs">{p.university || "—"}</td>
                      <td className="py-3 px-4">
                        {p.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                            <ShieldIcon className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Student
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleAdmin(p)}
                          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {p.is_admin ? "Odebrat admin" : "Povýšit na admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
