"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { UploadIcon, AlertCircleIcon, CheckIcon } from "./icons";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState(value || "");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Obrázek je příliš velký. Maximální povolená velikost je 5 MB.");
        return;
      }

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file);

      if (uploadError) {
        // Fallback: If bucket is not yet created in Supabase, show clear guidance
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        onChange(publicUrlData.publicUrl);
        setUrlInput(publicUrlData.publicUrl);
      }
    } catch (err: unknown) {
      console.error("Chyba při nahrávání:", err);
      setError(
        "Nahrávání do úložiště selhalo. Ujistěte se, že je spuštěn SQL skript a bucket 'listing-images' existuje. Případně můžete níže vložit přímou URL adresu obrázku."
      );
      setMode("url");
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setError(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 text-xs">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`pb-2 px-3 font-medium transition ${
            mode === "file"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          Nahrát soubor z počítače
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`pb-2 px-3 font-medium transition ${
            mode === "url"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          Zadat URL adresu obrázku
        </button>
      </div>

      {mode === "file" ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-6 transition hover:border-blue-400 dark:border-zinc-700 dark:hover:border-blue-500">
          <UploadIcon className="h-8 w-8 text-zinc-400 mb-2" />
          <label className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            <span>{uploading ? "Nahrávám obrázek..." : "Vyberte soubor z počítače"}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
          <p className="mt-1 text-xs text-zinc-500">PNG, JPG, WebP do velikosti 5 MB</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/obrazek.jpg"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Použít URL
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Tip: Můžete použít i jakýkoliv obrázek např. z Unsplash nebo jiné veřejné galerie.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 relative rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
            Náhled vybraného obrázku:
          </p>
          <div className="relative aspect-video w-full max-h-48 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Náhled inzerátu"
              className="h-full w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setUrlInput("");
            }}
            className="mt-2 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Odstranit obrázek
          </button>
        </div>
      )}
    </div>
  );
}
