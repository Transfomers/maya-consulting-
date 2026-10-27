import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";
import { SettingsProvider } from "@/lib/SettingsContext";
import SmoothScroll from "@/components/SmoothScroll";
import { ScrollProgress } from "@/components/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AnimatedAvatars from "@/components/AnimatedAvatars";
import CustomCursor from "@/components/CustomCursor";
import ChatWidget from "@/components/ChatWidget";
import SiteModalPopup from "@/components/SiteModalPopup";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Programs from "@/pages/Programs";
import ImpactStories from "@/pages/ImpactStories";
import Membership from "@/pages/Membership";
import Partners from "@/pages/Partners";
import NewsEvents from "@/pages/NewsEvents";
import Donate from "@/pages/Donate";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import Resources from "@/pages/Resources";
import Events from "@/pages/Events";
import Join from "@/pages/Join";
import Volunteer from "@/pages/Volunteer";
import GlobalFestival from "@/pages/GlobalFestival";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import BlogPost from "@/pages/BlogPost";
import AcceptInvitation from "@/pages/admin/AcceptInvitation";
import ResetPassword from "@/pages/admin/ResetPassword";
import AdminOverview from "@/pages/admin/Overview";
import AdminPostList from "@/pages/admin/PostList";
import AdminPostEditor from "@/pages/admin/PostEditor";
import AdminApartmentsList from "@/pages/admin/ApartmentsList";
import AdminApartmentEditor from "@/pages/admin/ApartmentEditor";
import AdminEventsList from "@/pages/admin/EventsList";
import AdminMedia from "@/pages/admin/Media";
import AdminCategories from "@/pages/admin/Categories";
import AdminSettings from "@/pages/admin/Settings";
import AdminSubmissions from "@/pages/admin/Submissions";
import AdminResources from "@/pages/admin/Resources";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import ConfirmSubscription from "@/pages/ConfirmSubscription";
import Unsubscribe from "@/pages/Unsubscribe";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Boutique from "@/pages/Boutique";
import Panier from "@/pages/Panier";
import LocationVoitureYaounde from "@/pages/LocationVoitureYaounde";
import LocationPradoYaounde from "@/pages/LocationPradoYaounde";
import AppartementMeubleBastos from "@/pages/AppartementMeubleBastos";
import AppartementMeubleYaounde from "@/pages/AppartementMeubleYaounde";
import VenteVoitureLeasing from "@/pages/VenteVoitureLeasing";
import { CartProvider } from "@/context/CartContext";
import { HelmetProvider } from "react-helmet-async";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Mounted outside the routes so the conversation survives navigation, and kept
// off the admin panel.
const PublicChat = () => null;

const PublicPopup = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <SiteModalPopup />;
};

const MarketingLayout = ({ children }) => (
  <SmoothScroll>
    <CustomCursor />
    <Navbar />
    <main>{children}</main>
    <AnimatedAvatars />
    <Footer />
  </SmoothScroll>
);

const page = (Component, props = {}) => <MarketingLayout><Component {...props} /></MarketingLayout>;

function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <LanguageProvider>
          <SettingsProvider>
            <CartProvider>
              <SEOHead />
              <div className="App">
                <div className="noise-overlay" aria-hidden="true" />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      borderRadius: 0,
                      border: "1px solid #0D0E0D",
                      background: "#FDFCFD",
                      color: "#0D0E0D",
                      fontFamily: "Manrope, sans-serif",
                    },
                  }}
                />
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={page(Home)} />
                  <Route path="/boutique" element={page(Boutique)} />
                  <Route path="/appartements" element={page(Boutique, { defaultTab: "appartements" })} />
                  <Route path="/location-voiture-yaounde" element={page(LocationVoitureYaounde)} />
                  <Route path="/location-de-voiture-yaounde" element={page(LocationVoitureYaounde)} />
                  <Route path="/location-prado-yaounde" element={page(LocationPradoYaounde)} />
                  <Route path="/location-toyota-prado-yaounde" element={page(LocationPradoYaounde)} />
                  <Route path="/appartement-meuble-bastos" element={page(AppartementMeubleBastos)} />
                  <Route path="/appartement-meuble-tsinga" element={page(AppartementMeubleBastos)} />
                  <Route path="/appartement-meuble-tsinga-fecafoot" element={page(AppartementMeubleBastos)} />
                  <Route path="/appartement-meuble-oyomabang" element={page(AppartementMeubleYaounde)} />
                  <Route path="/appartement-meuble-yaounde" element={page(AppartementMeubleYaounde)} />
                  <Route path="/appartement-meuble-essos" element={page(AppartementMeubleYaounde)} />
                  <Route path="/vente-voiture-leasing-cameroun" element={page(VenteVoitureLeasing)} />
                  <Route path="/vente-voiture-yaounde" element={page(VenteVoitureLeasing)} />
                  <Route path="/panier" element={page(Panier)} />
                <Route path="/about" element={page(About)} />
                <Route path="/programs" element={page(Programs)} />
                <Route path="/impact-stories" element={page(ImpactStories)} />
                <Route path="/membership" element={page(Membership)} />
                <Route path="/partners" element={page(Partners)} />
                <Route path="/news-events" element={page(NewsEvents)} />
                <Route path="/resources" element={page(Resources)} />
                <Route path="/programs/resources" element={page(Resources)} />
                <Route path="/blog" element={page(Blog)} />
                <Route path="/blog/:slug" element={page(BlogPost)} />
                <Route path="/events" element={page(Events)} />
                <Route path="/donate" element={page(Donate)} />
                <Route path="/contact" element={page(Contact)} />
                <Route path="/join" element={page(Join)} />
                <Route path="/volunteer" element={page(Volunteer)} />
                <Route path="/global-festival" element={page(GlobalFestival)} />
                <Route path="/privacy" element={page(Privacy)} />
                <Route path="/terms" element={page(Terms)} />
                <Route path="/confirm-subscription" element={page(ConfirmSubscription)} />
                <Route path="/unsubscribe" element={page(Unsubscribe)} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/accept-invitation/:token" element={<AcceptInvitation />} />
                <Route path="/admin/reset-password/:token" element={<ResetPassword />} />
                <Route path="/admin/*" element={<AdminDashboard />}>
                  <Route path="dashboard" element={<AdminOverview />} />
                  <Route path="posts" element={<AdminPostList />} />
                  <Route path="posts/new" element={<AdminPostEditor />} />
                  <Route path="posts/:id/edit" element={<AdminPostEditor />} />
                  <Route path="vehicles" element={<AdminPostList />} />
                  <Route path="vehicles/new" element={<AdminPostEditor />} />
                  <Route path="vehicles/:id/edit" element={<AdminPostEditor />} />
                  <Route path="apartments" element={<AdminApartmentsList />} />
                  <Route path="apartments/new" element={<AdminApartmentEditor />} />
                  <Route path="apartments/:id" element={<AdminApartmentEditor />} />
                  <Route path="apartments/:id/edit" element={<AdminApartmentEditor />} />
                  <Route path="newsletter" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="events" element={<AdminEventsList />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="resources" element={<AdminResources />} />
                  <Route path="submissions" element={<AdminSubmissions />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
              <PublicPopup />
            </div>
            </CartProvider>
          </SettingsProvider>
        </LanguageProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}

export default App;
