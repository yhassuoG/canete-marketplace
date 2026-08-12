import { fetchMaintenanceStatus } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const status = await fetchMaintenanceStatus();
  const message = status.message || "Estamos realizando mejoras. Volveremos pronto.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f2] px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#083d77] shadow-lg">
        <svg
          className="h-10 w-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17 4.75 9A2.652 2.652 0 0 1 9 4.75l5.83 5.83M11.42 15.17 9 17.25m2.42-2.08 2.42-2.08"
          />
        </svg>
      </div>

      <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#083d77] sm:text-5xl">
        En Mantenimiento
      </h1>

      <p className="max-w-md text-lg text-slate-600">{message}</p>

      <div className="mt-10 flex items-center gap-2 text-sm text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        Trabajando en ello...
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Cañete Marketplace · Sistema de gestión
      </p>
    </div>
  );
}
