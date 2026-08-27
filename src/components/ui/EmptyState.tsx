import { Compass } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center border border-dashed border-line bg-paper px-6 py-16 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-strong text-coral"><Compass size={22} /></div><h3 className="display mt-5 text-2xl font-bold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p></div>;
}
