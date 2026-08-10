import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";
import SmoothScroll from "@/components/SmoothScroll";
import { ScrollProgress } from "@/components/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedAvatars from "@/components/AnimatedAvatars";
import CustomCursor from "@/components/CustomCursor";
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
import Events from "@/pages/Events";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import BlogPost from "@/pages/BlogPost";
import AdminOverview from "@/pages/admin/Overview";
import AdminPostList from "@/pages/admin/PostList";
import AdminPostEditor from "@/pages/admin/PostEditor";
import AdminEventsList from "@/pages/admin/EventsList";
import AdminMedia from "@/pages/admin/Media";
import AdminCategories from "@/pages/admin/Categories";


const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const MarketingLayout = ({ children }) => (
  <SmoothScroll>
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <main>{children}</main>
    <AnimatedAvatars />
    <Footer />
  </SmoothScroll>
);

const page = (Component) => <MarketingLayout><Component /></MarketingLayout>;

import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
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
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={page(Home)} />
          <Route path="/about" element={page(About)} />
          <Route path="/programs" element={page(Programs)} />
          <Route path="/impact-stories" element={page(ImpactStories)} />
          <Route path="/membership" element={page(Membership)} />
          <Route path="/partners" element={page(Partners)} />
          <Route path="/news-events" element={page(NewsEvents)} />
          <Route path="/blog" element={page(Blog)} />
          <Route path="/blog/:slug" element={page(BlogPost)} />
          <Route path="/events" element={page(Events)} />
          <Route path="/donate" element={page(Donate)} />
          <Route path="/contact" element={page(Contact)} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="posts" element={<AdminPostList />} />
            <Route path="posts/new" element={<AdminPostEditor />} />
            <Route path="posts/:id/edit" element={<AdminPostEditor />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="events" element={<AdminEventsList />} />
            <Route path="media" element={<AdminMedia />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </div>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
