import Link from "next/link";

export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-2xl bg-slate-100" />
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {href && action ? <Link className="btn-primary mt-5" href={href}>{action}</Link> : null}
    </div>
  );
}
