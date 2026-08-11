import Link from "next/link";
import type { Content } from "./types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatContentSchedule } from "@/lib/utils/date";

export function ContentCard({ content, companyName, ownerName }: { content: Content; companyName?: string; ownerName?: string }) {
  return (
    <Link
      href={`/contents/${content.id}`}
      prefetch={false}
      className="render-lazy block touch-manipulation rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">{companyName || "Perusahaan belum dipilih"}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-5 text-slate-900">{content.title || "Topik belum ditentukan"}</p>
        <StatusBadge status={content.status} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{ownerName || "Belum ada pemilik"}</span>
        <span>{formatContentSchedule(content.plannedPublishAt, content.scheduleHasTime)}</span>
      </div>
    </Link>
  );
}
