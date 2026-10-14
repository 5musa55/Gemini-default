"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ListingWithProfile } from "@/types/database";
import { SchoolIcon, TagIcon } from "./icons";

interface ListingCardProps {
  listing: ListingWithProfile;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [imageError, setImageError] = useState(false);

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
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: {
      label: "Aktivní",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    },
    reserved: {
      label: "Rezervováno",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    },
    sold: {
      label: "Prodáno",
      className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    },
  };

  const currentStatus = statusLabels[listing.status] || statusLabels.active;

  return (
    <Link
      href={`/inzerat/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {listing.image_url && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
            <span className="text-4xl mb-1">📦</span>
            <span className="text-xs">Bez obrázku</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm shadow-xs ${currentStatus.className}`}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="flex items-center gap-1 rounded-md bg-zinc-900/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
            <TagIcon className="h-3 w-3" />
            {listing.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 transition">
          {listing.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400 flex-1">
          {listing.description}
        </p>

        {/* Price & Date */}
        <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(listing.price)}
          </span>
          <span className="text-[11px] text-zinc-400">
            {formatDate(listing.created_at)}
          </span>
        </div>

        {/* Seller Info */}
        {listing.profiles && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="truncate max-w-[130px]">
              {listing.profiles.full_name || "Student"}
            </span>
            {listing.profiles.university && (
              <span className="flex items-center gap-1 truncate max-w-[130px] text-zinc-400">
                <SchoolIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{listing.profiles.university}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
