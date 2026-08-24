import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <Image className="brand-logo" src="/mailflow-logo.svg" alt="Mailflow" width={34} height={34} priority />
      {!compact && <span>MAILFLOW</span>}
    </div>
  );
}
