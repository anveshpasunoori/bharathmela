import Image from "next/image";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return <Image src="/icon.svg" alt="" width={36} height={36} unoptimized className={className} />;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <LogoMark />
      <span className="font-[family-name:var(--font-display)] text-[1.45rem] font-bold leading-none tracking-tight text-forest">
        BharathMela
      </span>
    </span>
  );
}
