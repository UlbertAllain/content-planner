import { deleteAssetAction } from "@/features/assets/actions";
import type { ContentAsset } from "@/features/assets/types";
import { assetSourceLabels, assetTypeLabels } from "@/features/contents/labels";

function externalHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Tautan eksternal";
  }
}

function FileInfo({ asset }: { asset: ContentAsset }) {
  const size = asset.bytes && asset.bytes > 0
    ? asset.bytes >= 1024 * 1024
      ? `${(asset.bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(asset.bytes / 1024))} KB`
    : null;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">{asset.label}</p>
      <p className="mt-1 text-xs text-slate-400">
        {assetTypeLabels[asset.type]} · {assetSourceLabels[asset.source]}
        {asset.format ? ` · ${asset.format.toUpperCase()}` : ""}
        {size ? ` · ${size}` : ""}
      </p>
    </div>
  );
}

export function AssetPreviewCard({
  asset,
  editable,
  contentId,
}: {
  asset: ContentAsset;
  editable: boolean;
  contentId: string;
}) {
  const isImage = asset.source === "CLOUDINARY" && asset.resourceType === "IMAGE";
  const isVideo = asset.source === "CLOUDINARY" && asset.resourceType === "VIDEO";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {isImage ? (
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="group block border-b border-slate-100 bg-slate-50"
          aria-label={`Buka ${asset.label} dalam ukuran penuh`}
        >
          <div className="flex min-h-56 items-center justify-center p-2 sm:min-h-64">
            <img
              src={asset.url}
              alt={asset.label}
              loading="lazy"
              className="max-h-[520px] w-full rounded-xl object-contain transition duration-200 group-hover:scale-[1.01]"
            />
          </div>
        </a>
      ) : null}

      {isVideo ? (
        <div className="border-b border-slate-100 bg-black">
          <video
            src={asset.url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[520px] w-full"
          >
            Browser kamu belum mendukung preview video.
          </video>
        </div>
      ) : null}

      {!isImage && !isVideo ? (
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-32 items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 transition hover:bg-slate-100"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {asset.source === "EXTERNAL" ? externalHost(asset.url) : "File"}
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-800">{asset.label}</p>
            <p className="mt-1 text-xs text-slate-500">Klik untuk membuka tautan</p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            Buka
          </span>
        </a>
      ) : null}

      <div className="flex items-start justify-between gap-3 p-4">
        <FileInfo asset={asset} />
        <div className="flex shrink-0 items-center gap-2">
          {(isImage || isVideo) ? (
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Buka penuh
            </a>
          ) : null}
          {editable ? (
            <form action={deleteAssetAction.bind(null, contentId, asset.id)}>
              <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                Hapus
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
