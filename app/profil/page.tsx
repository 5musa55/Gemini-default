"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/types/database";
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  SchoolIcon,
  ShieldIcon,
  CheckIcon,
  AlertCircleIcon,
} from "@/components/icons";

interface ProfileFormProps {
  profile: Profile | null;
  userEmail: string;
  userId: string;
  onRefresh: () => Promise<void>;
}

function ProfileForm({ profile, userEmail, userId, onRefresh }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [university, setUniversity] = useState(profile?.university || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          university: university.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      await onRefresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Chyba při ukládání profilu:", err);
      setError(
        err instanceof Error ? err.message : "Chyba při ukládání profilu."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
        Nastavení kontaktních údajů
      </h3>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckIcon className="h-4 w-4 shrink-0" />
          <span>Kontaktní údaje byly úspěšně uloženy!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* E-mail (read-only) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            E-mailová adresa (z přihlášení)
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            <MailIcon className="h-4 w-4 text-zinc-400" />
            <span>{userEmail}</span>
          </div>
        </div>

        {/* Jméno a příjmení */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
            Jméno a příjmení *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="např. Jan Novák"
              className="w-full rounded-xl border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
            Telefonní číslo
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+420 777 000 111"
              className="w-full rounded-xl border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Kupující vás budou moci kontaktovat přímo na toto číslo.
          </p>
        </div>

        {/* Univerzita */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
            Univerzita / Fakulta
          </label>
          <div className="relative">
            <SchoolIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="např. VUT Brno FEKT, UK MFF, ČVUT FEL"
              className="w-full rounded-xl border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            <CheckIcon className="h-4 w-4" />
            <span>{saving ? "Ukládám..." : "Uložit změny"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAdmin, refreshProfile, loading: authLoading } = useAuth();
  const [listingCount, setListingCount] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Fetch user's listings count
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => {
          if (count !== null) setListingCount(count);
        });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          Můj profil
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Správa osobních a kontaktních údajů, které se zobrazují zájemcům u vašich inzerátů.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Card: Profile Overview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {profile?.full_name?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase() ||
                "U"}
            </div>

            <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
              {profile?.full_name || "Student"}
            </h2>
            <p className="text-xs text-zinc-500">{user.email}</p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {isAdmin ? (
                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                  <ShieldIcon className="h-3.5 w-3.5" />
                  Administrátor
                </span>
              ) : (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                  Ověřený student
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Moje inzeráty v bazaru:</span>
                <span className="font-bold text-zinc-900 dark:text-white text-sm">
                  {listingCount}
                </span>
              </div>
              <div className="mt-3">
                <Link
                  href="/moje-inzeraty"
                  className="block w-full rounded-xl border border-zinc-300 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Přejít na moje inzeráty
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card (2/3): Edit Profile Form */}
        <div className="md:col-span-2">
          <ProfileForm
            key={profile?.id || "form"}
            profile={profile}
            userEmail={user.email || ""}
            userId={user.id}
            onRefresh={refreshProfile}
          />
        </div>
      </div>
    </div>
  );
}
