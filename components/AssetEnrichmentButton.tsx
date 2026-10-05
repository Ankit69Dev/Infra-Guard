"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";

export default function AssetEnrichmentButton() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function enrichAssets() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/ai/enrich-assets",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Enrichment failed"
        );
      }

      setMessage(
        `${data.updated} assets enriched`
      );

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={enrichAssets}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Brain className="h-4 w-4" />
        )}

        {loading
          ? "Researching..."
          : "AI Enrich Assets"}
      </button>

      {message && (
        <span className="text-sm text-slate-500">
          {message}
        </span>
      )}
    </div>
  );
}