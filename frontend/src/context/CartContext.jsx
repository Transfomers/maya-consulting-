import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CATALOG_INFO } from "@/data/catalogVehicles";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "3m_services_cart_v1";
const COMMENT_STORAGE_KEY = "3m_services_cart_comment_v1";

// Helper to extract numeric price from strings like "18 500 000 FCFA" or "18500000"
export const parsePrice = (priceStr) => {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

// Helper to format FCFA with thousand separators (e.g., 18 500 000 FCFA)
export const formatFCFA = (amount) => {
  if (!amount || amount === 0) return "Sur devis";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load cart from localStorage", e);
      return [];
    }
  });

  const [customerComment, setCustomerComment] = useState(() => {
    try {
      return localStorage.getItem(COMMENT_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to persist cart", e);
    }
  }, [cartItems]);

  // Persist comment
  useEffect(() => {
    try {
      localStorage.setItem(COMMENT_STORAGE_KEY, customerComment);
    } catch (e) {
      console.error("Failed to persist comment", e);
    }
  }, [customerComment]);

  const isInCart = (vehicleId) => {
    return cartItems.some((item) => String(item.id) === String(vehicleId));
  };

  const addToCart = (vehicle) => {
    if (!vehicle || !vehicle.id) return false;

    // Check if vehicle is marked as unavailable/sold
    if (vehicle.status && (vehicle.status.toLowerCase().includes("vendu") || vehicle.status.toLowerCase().includes("indisponible"))) {
      toast.error("Ce véhicule n'est actuellement pas disponible à la commande.");
      return false;
    }

    if (isInCart(vehicle.id)) {
      toast.info(`« ${vehicle.model} » est déjà dans votre panier.`);
      return false;
    }

    const newItem = {
      id: vehicle.id,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      price: vehicle.price || "Sur devis / Leasing MUPOCAM",
      image: vehicle.image,
      condition: vehicle.condition || "Occasion Certifiée",
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      section: vehicle.section,
      sectionTitle: vehicle.sectionTitle,
      quantity: 1, // 1 unit per vehicle listing
      addedAt: new Date().toISOString(),
    };

    setCartItems((prev) => [...prev, newItem]);
    toast.success(`« ${vehicle.model} » ajouté au panier !`, {
      action: {
        label: "Voir le panier",
        onClick: () => {
          window.location.href = "/panier";
        },
      },
    });
    return true;
  };

  const removeFromCart = (vehicleId) => {
    setCartItems((prev) => {
      const itemToRemove = prev.find((i) => String(i.id) === String(vehicleId));
      const filtered = prev.filter((i) => String(i.id) !== String(vehicleId));
      if (itemToRemove) {
        toast.info(`« ${itemToRemove.model} » a été retiré du panier.`);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerComment("");
    toast.info("Votre panier a été vidé.");
  };

  // Cart total calculations
  const { totalNumeric, hasQuotesOnly, itemsWithPricesCount } = useMemo(() => {
    let sum = 0;
    let pricedCount = 0;

    cartItems.forEach((item) => {
      const parsed = parsePrice(item.price);
      if (parsed > 0) {
        sum += parsed;
        pricedCount += 1;
      }
    });

    return {
      totalNumeric: sum,
      hasQuotesOnly: pricedCount === 0 && cartItems.length > 0,
      itemsWithPricesCount: pricedCount,
    };
  }, [cartItems]);

  const cartTotalFormatted = useMemo(() => {
    if (cartItems.length === 0) return "0 FCFA";
    if (totalNumeric > 0) {
      const base = formatFCFA(totalNumeric);
      if (itemsWithPricesCount < cartItems.length) {
        return `${base} (+ véhicules sur devis)`;
      }
      return base;
    }
    return "Sur devis & conditions leasing";
  }, [cartItems, totalNumeric, itemsWithPricesCount]);

  // WhatsApp order URL generation
  const generateWhatsAppOrderUrl = (overrideComment = null) => {
    const commentToUse = (overrideComment !== null ? overrideComment : customerComment).trim();
    const phone = CATALOG_INFO.whatsapp || "237691786447";

    if (cartItems.length === 0) {
      const fallbackMsg = `Bonjour 3M SERVICES, je souhaite avoir des informations sur votre catalogue automobile 2025.`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(fallbackMsg)}`;
    }

    let messageLines = [
      "Bonjour 3M SERVICES, je souhaite passer une commande.\n",
    ];

    cartItems.forEach((item, index) => {
      const itemPrice = item.price && item.price !== "Sur devis" ? item.price : "Sur devis / Leasing MUPOCAM";
      const yearInfo = item.year ? ` (${item.year})` : "";
      messageLines.push(`• ${item.model}${yearInfo} — 1 véhicule`);
      messageLines.push(`  Prix affiché : ${itemPrice}`);
      if (item.condition) {
        messageLines.push(`  État : ${item.condition}`);
      }
      if (index < cartItems.length - 1) {
        messageLines.push("");
      }
    });

    messageLines.push("");
    if (totalNumeric > 0) {
      messageLines.push(`Total estimé : ${formatFCFA(totalNumeric)}`);
    } else {
      messageLines.push(`Modalité : Sur devis & conditions de leasing`);
    }

    if (commentToUse) {
      messageLines.push(`Commentaire : ${commentToUse}`);
    } else {
      messageLines.push(`Commentaire : Je souhaite être recontacté pour les modalités et la disponibilité.`);
    }

    messageLines.push("");
    messageLines.push("Merci de me contacter pour la suite.");

    const fullMessage = messageLines.join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.length,
        isInCart,
        addToCart,
        removeFromCart,
        clearCart,
        customerComment,
        setCustomerComment,
        totalNumeric,
        cartTotalFormatted,
        hasQuotesOnly,
        generateWhatsAppOrderUrl,
        officialWhatsAppNumber: CATALOG_INFO.phone || "+237 691 78 64 47",
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
