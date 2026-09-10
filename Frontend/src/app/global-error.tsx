"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
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
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Error inesperado
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "1.5rem", textAlign: "center" }}>
            Ocurrió un error crítico. Puedes intentar recargar la página.
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
      </body>
    </html>
  );
}
