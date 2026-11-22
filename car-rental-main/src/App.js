import "./dist/styles.css";
import "./styles/Animations.css";
import { Route, Routes } from "react-router-dom";
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
import { LanguageProvider } from "./context/LanguageContext";

// Forward any administrative access directly to the official 3M SERVICES Admin Control Center (Port 5002)
const AdminRedirect = () => {
  window.location.replace("http://127.0.0.1:5002/admin/dashboard");
  return null;
};

function App() {
  return (
    <LanguageProvider>
      <ScrollToTop />
      <ScrollReveal />
      <PwaInstallPrompt />
      <Navbar />
      <ClientPortalModal />
      <PrivateChatWidget />
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
        {/* Admin RQ route removed; automatically forwards to the main Flask Admin */}
        <Route path="admin" element={<AdminRedirect />} />
        <Route path="admin/*" element={<AdminRedirect />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
