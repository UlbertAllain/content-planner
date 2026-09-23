import type { ContentStatus } from "@/features/contents/types";
import { contentStatusLabels } from "@/features/contents/labels";

const styles: Record<ContentStatus, string> = {
  DRAFT: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  READY: "bg-emerald-50 text-emerald-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  PUBLISHED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{contentStatusLabels[status]}</span>;
}
