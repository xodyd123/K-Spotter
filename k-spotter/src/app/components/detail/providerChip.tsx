import Image from "next/image";
import { WatchProvider } from "../../../../type/type";

// Provider chip with logo + name
export function ProviderChip({ p }: { p: WatchProvider }) {
  return (
    <a
      className="group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:shadow transition"
      title={p.provider_name}
      href="#"
      onClick={(e) => e.preventDefault()}
    >
      {p.logo_path ? (
        <Image
          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
          alt={p.provider_name}
          width={20}
          height={20}
          className="rounded"
          priority={false}
        />
      ) : (
        <div className="h-5 w-5 rounded bg-gray-200" />
      )}
      <span className="whitespace-nowrap">{p.provider_name}</span>
    </a>
  );
}
