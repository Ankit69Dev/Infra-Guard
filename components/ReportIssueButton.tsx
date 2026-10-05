"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import ReportIssueModal from "@/components/ReportIssueModal";

export default function ReportIssueButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        <Plus size={18} />
        Report Issue
      </button>

      <ReportIssueModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}