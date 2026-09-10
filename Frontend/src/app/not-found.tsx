import Link from "next/link";

export default function NotFound() {
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
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem", fontWeight: 800 }}>
        404
      </h1>
      <p style={{ opacity: 0.7, marginBottom: "1.5rem", textAlign: "center" }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "0.5rem",
          background: "#7c3aed",
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
