"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ListingWithProfile } from "@/types/database";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  SchoolIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  ShieldIcon,
  CopyIcon,
  CheckIcon,
} from "@/components/icons";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [listing, setListing] = useState<ListingWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const listingId = params?.id as string;

  const fetchListingDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:user_id (
            id,
            email,
            full_name,
            phone,
            university
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Inzerát nebyl nalezen nebo byl již odstraněn.");
      } else {
        setListing(data as ListingWithProfile);
      }
    } catch (err) {
      console.error("Chyba při načítání detailu:", err);
      setError("Při načítání inzerátu došlo k chybě.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (listingId) {
      fetchListingDetail(listingId);
    }
  }, [listingId, fetchListingDetail]);

  const handleDelete = async () => {
    if (!listing) return;
    const confirmed = window.confirm(
      "Opravdu si přejete tento inzerát trvale smazat?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);

      if (error) {
        alert("Chyba při mazání inzerátu: " + error.message);
      } else {
        alert("Inzerát byl úspěšně smazán.");
        if (isAdmin && user?.id !== listing.user_id) {
          router.push("/admin");
        } else {
          router.push("/moje-inzeraty");
        }
      }
    } catch (err) {
      console.error("Chyba při mazání:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyPhoneToClipboard = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
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
      const date = new Date(dateString);
      return date.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const isOwner = user && listing && user.id === listing.user_id;

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: {
      label: "Aktivní nabídka",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    },
    reserved: {
      label: "Rezervováno",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    },
    sold: {
      label: "Prodáno",
      className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    },
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 aspect-video rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
          Inzerát nenalezen
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {error || "Tento inzerát neexistuje nebo již vypršel."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět na hlavní stránku
        </Link>
      </div>
    );
  }

  const currentStatus = statusLabels[listing.status] || statusLabels.active;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět na všechny inzeráty
        </Link>
      </div>

      {/* Moderation Banner if viewer is Admin but not owner */}
      {isAdmin && !isOwner && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-purple-50 p-4 border border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold">
              Režim moderace: Tento inzerát si prohlížíte s právy administrátora.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/upravit-inzerat/${listing.id}`}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
            >
              Upravit inzerát
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Mažu..." : "Smazat"}
            </button>
          </div>
        </div>
      )}

      {/* Owner controls banner */}
      {isOwner && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 p-4 border border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
          <span className="text-sm font-medium">
            Toto je váš inzerát. Můžete jej upravit nebo smazat.
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/upravit-inzerat/${listing.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <EditIcon className="h-3.5 w-3.5" />
              Upravit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {isDeleting ? "Mažu..." : "Smazat"}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left Column (2/3): Image and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            {listing.image_url && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt={listing.title}
                onError={() => setImageError(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
                <span className="text-6xl mb-2">📦</span>
                <span className="text-sm">Inzerát nemá přiloženou fotografii</span>
              </div>
            )}

            <div className="absolute top-4 right-4">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-sm ${currentStatus.className}`}
              >
                {currentStatus.label}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              Popis inzerátu
            </h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {listing.description}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Summary & Seller Contact Card */}
        <div className="space-y-6">
          {/* Price & Overview Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <TagIcon className="h-3.5 w-3.5" />
                {listing.category}
              </span>
              <span className="text-xs text-zinc-400">
                Přidáno {formatDate(listing.created_at)}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {listing.title}
            </h1>

            <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Cena
              </span>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatPrice(listing.price)}
              </div>
            </div>
          </div>

          {/* Seller Contact Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
              Kontakt na prodejce
            </h3>

            {listing.profiles ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300 text-lg">
                    {listing.profiles.full_name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white text-base">
                      {listing.profiles.full_name || "Student"}
                    </div>
                    {listing.profiles.university && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <SchoolIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>{listing.profiles.university}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {/* Phone */}
                  {listing.profiles.phone ? (
                    <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <a
                          href={`tel:${listing.profiles.phone}`}
                          className="text-sm font-semibold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                        >
                          {listing.profiles.phone}
                        </a>
                      </div>
                      <button
                        onClick={() => copyPhoneToClipboard(listing.profiles?.phone || "")}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        title="Kopírovat telefon"
                      >
                        {copiedPhone ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600">Zkopírováno</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3.5 w-3.5" />
                            <span>Kopírovat</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800">
                      Prodejce nemá uvedené telefonní číslo.
                    </div>
                  )}

                  {/* Email */}
                  {listing.profiles.email && (
                    <a
                      href={`mailto:${listing.profiles.email}?subject=Zájem o inzerát: ${encodeURIComponent(listing.title)}`}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      <MailIcon className="h-4 w-4" />
                      Napsat e-mail prodejci
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Informace o prodejci nejsou k dispozici.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
