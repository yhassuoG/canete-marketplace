"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f1f5f9",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Algo salió mal
      </h1>
      <p style={{ opacity: 0.7, marginBottom: "1.5rem", textAlign: "center" }}>
        No pudimos cargar esta página. Intenta nuevamente.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "0.5rem",
          border: "none",
          background: "#7c3aed",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
