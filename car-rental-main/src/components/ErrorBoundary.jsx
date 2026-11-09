import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    // Clear caches and reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Poppins', sans-serif",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#F9FAFB",
          color: "#1F2937"
        }}>
          <div style={{
            maxWidth: "520px",
            background: "#FFFFFF",
            padding: "2.5rem",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            border: "1px solid #E5E7EB"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚗</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#E20713", marginBottom: "0.5rem" }}>
              3M SERVICES YAOUNDÉ
            </h1>
            <p style={{ color: "#4B5563", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Une mise à jour vient d'être déployée sur le site. Cliquez ci-dessous pour actualiser instantanément l'affichage.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: "#E20713",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 28px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(226,7,19,0.3)"
              }}
            >
              🔄 Actualiser le site
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

