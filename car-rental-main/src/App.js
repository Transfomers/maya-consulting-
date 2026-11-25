import "./dist/styles.css";
import "./styles/Animations.css";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import About from "./Pages/About";
import Home from "./Pages/Home";
import Navbar from "./components/Navbar";
import Models from "./Pages/Models";
import TestimonialsPage from "./Pages/TestimonialsPage";
import Team from "./Pages/Team";
import Contact from "./Pages/Contact";
import ApartmentsPage from "./Pages/ApartmentsPage";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import ScrollReveal from "./components/ScrollReveal";
import ScrollToTop from "./components/ScrollToTop";
import ClientPortalModal from "./components/ClientPortalModal";
import PrivateChatWidget from "./components/PrivateChatWidget";
import VisitorLocation from "./components/VisitorLocation";
import { LanguageProvider } from "./context/LanguageContext";
import { startPendingContactsSync } from "./utils/pendingContacts";
import ChatPage from "./Pages/ChatPage";
import AccountPage from "./Pages/AccountPage";
import "./styles/Responsive.css"; // correctifs mobile, chargé en dernier

// URL de l'admin Flask : REACT_APP_ADMIN_URL au build, sinon port 5002 en local.
const ADMIN_URL =
  process.env.REACT_APP_ADMIN_URL ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:5002/admin/dashboard"
    : null);

const AdminRedirect = () => {
  if (ADMIN_URL) {
    window.location.replace(ADMIN_URL);
    return null;
  }
  console.error("REACT_APP_ADMIN_URL n'est pas défini pour ce build.");
  return <Navigate to="/" replace />;
};

function App() {
  // Renvoie automatiquement les messages de contact restés en attente (connexion coupée)
  useEffect(() => startPendingContactsSync(), []);

  return (
    <LanguageProvider>
      <ScrollToTop />
      <ScrollReveal />
      <PwaInstallPrompt />
      <Navbar />
      <ClientPortalModal />
      <PrivateChatWidget />
      <VisitorLocation />
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="models" element={<Models />} />
        <Route path="apartments" element={<ApartmentsPage />} />
        <Route path="appartements" element={<ApartmentsPage />} />
        <Route path="appartement" element={<ApartmentsPage />} />
        <Route path="appartements-meubles" element={<ApartmentsPage />} />
        <Route path="appartement-meuble-yaounde" element={<ApartmentsPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="team" element={<Team />} />
        <Route path="contact" element={<Contact />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="messages" element={<ChatPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="account/:tab" element={<AccountPage />} />
        {/* Admin RQ route removed; automatically forwards to the main Flask Admin */}
        <Route path="admin" element={<AdminRedirect />} />
        <Route path="admin/*" element={<AdminRedirect />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
