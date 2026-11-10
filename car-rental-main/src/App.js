import "../src/dist/styles.css";
import "./styles/Animations.css";
import { Route, Routes, useLocation } from "react-router-dom";
import About from "./Pages/About";
import Home from "./Pages/Home";
import Navbar from "../src/components/Navbar";
import Models from "./Pages/Models";
import TestimonialsPage from "./Pages/TestimonialsPage";
import Team from "./Pages/Team";
import Contact from "./Pages/Contact";
import ApartmentsPage from "./Pages/ApartmentsPage";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import ScrollReveal from "./components/ScrollReveal";
import ScrollToTop from "./components/ScrollToTop";
import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <LanguageProvider>
      <ScrollToTop />
      <ScrollReveal />
      {!isAdminPath && <PwaInstallPrompt />}
      {!isAdminPath && <Navbar />}
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
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
