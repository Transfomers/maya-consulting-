const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5001;
const DB_PATH = path.join(__dirname, "data", "db.json");
const SALT = "3M_SERVICES_SALT_2026";

// Built-in JSON body parser with 50mb limit for uploads and base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database Helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { admin: {}, cars: [], bookings: [], contacts: [], subscribers: [] };
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erreur lecture db.json:", err);
    return { admin: {}, cars: [], bookings: [], contacts: [], subscribers: [] };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Erreur écriture db.json:", err);
    return false;
  }
}

function hashPassword(pass) {
  return crypto.createHash("sha256").update(pass + SALT).digest("hex");
}

// In-memory active tokens
const activeTokens = new Map();

function generateToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  activeTokens.set(token, {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  return token;
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Jeton d'authentification manquant." });
  }

  const session = activeTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeTokens.delete(token);
    return res.status(403).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
  }

  req.user = session;
  next();
}

/* ==========================================================================
   PUBLIC & HEALTH ROUTES
   ========================================================================== */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "3M SERVICES Car Rental API",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

/* ==========================================================================
   AUTH ROUTES
   ========================================================================== */

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez fournir un email et un mot de passe." });
  }

  const db = readDb();
  const admin = db.admin;

  if (!admin || !admin.email) {
    return res.status(500).json({ error: "Compte administrateur non configuré." });
  }

  const inputHash = hashPassword(password);
  const emailMatch = admin.email.trim().toLowerCase() === email.trim().toLowerCase();
  const passMatch = admin.passwordHash === inputHash;

  if (!emailMatch || !passMatch) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }

  const token = generateToken(admin);
  res.json({
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role
    }
  });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/change-password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires." });
  }

  const db = readDb();
  if (db.admin.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: "Le mot de passe actuel est erroné." });
  }

  db.admin.passwordHash = hashPassword(newPassword);
  writeDb(db);
  res.json({ success: true, message: "Mot de passe modifié avec succès." });
});

/* ==========================================================================
   HELPERS FOR BOOKING & AUDIT LOGS & CONFLICTS
   ========================================================================== */

function logActivity(action, details, user = "Administrateur") {
  const db = readDb();
  db.activity_logs = db.activity_logs || [];
  const entry = {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    user,
    timestamp: new Date().toISOString()
  };
  db.activity_logs.unshift(entry);
  if (db.activity_logs.length > 250) {
    db.activity_logs = db.activity_logs.slice(0, 250);
  }
  writeDb(db);
  return entry;
}

function checkCarConflict(carNameOrId, startDate, endDate, excludeBookingId = null) {
  const db = readDb();
  const bookings = db.bookings || [];
  if (!carNameOrId || !startDate || !endDate) return null;

  const newStart = new Date(startDate).getTime();
  const newEnd = new Date(endDate).getTime();

  for (const b of bookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    // Only check active or confirmed bookings that block vehicle
    if (["Annulée", "Rejetée", "Terminée"].includes(b.status)) continue;

    const sameCar =
      (b.carId && carNameOrId && b.carId === carNameOrId) ||
      (b.carName && carNameOrId && b.carName.toLowerCase().trim() === carNameOrId.toLowerCase().trim());

    if (!sameCar) continue;

    const bStart = new Date(b.pickTime).getTime();
    const bEnd = new Date(b.dropTime || b.pickTime).getTime();

    if (newStart <= bEnd && newEnd >= bStart) {
      return {
        conflict: true,
        conflictingBooking: b,
        message: `Conflit détecté : ${b.carName} est déjà bloqué par ${b.clientName} du ${b.pickTime} au ${b.dropTime || b.pickTime} (Réf : ${b.id}, Statut : ${b.status}).`
      };
    }
  }
  return null;
}

function upsertCustomerFromBooking(booking) {
  const db = readDb();
  db.customers = db.customers || [];
  const phone = (booking.phone || "").trim();
  const email = (booking.email || "").trim().toLowerCase();

  let customer = db.customers.find((c) =>
    (phone && c.phone && c.phone === phone) ||
    (email && c.email && c.email.toLowerCase() === email)
  );

  const now = new Date().toISOString();
  if (customer) {
    if (booking.clientName && (!customer.name || customer.name === "Client 3M")) {
      customer.name = booking.clientName;
    }
    if (booking.email && !customer.email) customer.email = booking.email;
    if (booking.address && !customer.address) customer.address = booking.address;
    if (booking.city && !customer.city) customer.city = booking.city;
    customer.lastBookingAt = now;
  } else {
    customer = {
      id: `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: booking.clientName || "Client 3M Services",
      phone: booking.phone || "",
      whatsapp: booking.phone || "",
      email: booking.email || "",
      address: booking.address || "",
      city: booking.city || "Yaoundé",
      zipcode: booking.zipcode || "",
      age: booking.age || "",
      marketingConsent: Boolean(booking.marketingConsent),
      createdAt: now,
      lastBookingAt: now,
      status: "Actif",
      notes: ""
    };
    db.customers.push(customer);
  }
  writeDb(db);
  return customer;
}

/* ==========================================================================
   STATS / DASHBOARD OVERVIEW
   ========================================================================== */

app.get("/api/stats", authenticateToken, (req, res) => {
  const db = readDb();
  const bookings = db.bookings || [];
  const cars = db.cars || [];
  const contacts = db.contacts || [];
  const apartments = db.apartments || [];
  const customers = db.customers || [];
  const payments = db.payments || [];
  const activityLogs = db.activity_logs || [];

  const { dateRange } = req.query; // 'today', '7days', '30days', 'month', 'all'
  let filteredBookings = [...bookings];
  const now = new Date();

  if (dateRange === "today") {
    const todayStr = now.toISOString().split("T")[0];
    filteredBookings = bookings.filter((b) => (b.createdAt || "").startsWith(todayStr));
  } else if (dateRange === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredBookings = bookings.filter((b) => new Date(b.createdAt) >= sevenDaysAgo);
  } else if (dateRange === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredBookings = bookings.filter((b) => new Date(b.createdAt) >= thirtyDaysAgo);
  } else if (dateRange === "month") {
    const currentYearMonth = now.toISOString().slice(0, 7);
    filteredBookings = bookings.filter((b) => (b.createdAt || "").startsWith(currentYearMonth));
  }

  const totalBookings = filteredBookings.length;
  const newBookings = filteredBookings.filter((b) => b.status === "Nouvelle" || b.status === "En attente").length;
  const pendingBookings = filteredBookings.filter((b) => b.status === "En attente" || b.status === "En cours d'examen").length;
  const confirmedBookings = filteredBookings.filter((b) => ["Confirmée", "Contrat préparé", "Payée"].includes(b.status)).length;
  const activeRentals = filteredBookings.filter((b) => b.status === "En cours").length;
  const completedBookings = filteredBookings.filter((b) => b.status === "Terminée").length;
  const cancelledBookings = filteredBookings.filter((b) => b.status === "Annulée" || b.status === "Rejetée").length;

  const totalRevenue = filteredBookings
    .filter((b) => ["Confirmée", "Contrat préparé", "Payée", "En cours", "Terminée"].includes(b.status))
    .reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  // Fleet availability counts
  const availableCars = cars.filter((c) => c.status === "Disponible").length;
  const rentedCars = cars.filter((c) => c.status === "Loué").length;
  const reservedCars = cars.filter((c) => c.status === "Réservé").length;
  const maintenanceCars = cars.filter((c) => c.status === "En maintenance").length;
  const neuvesCount = cars.filter((c) => (c.condition && c.condition.includes("Neuve")) || (c.mileage && c.mileage.includes("0 km"))).length;
  const occasionsCount = cars.length - neuvesCount;

  // Upcoming Pick-ups (confirmed or pending, pickTime >= today)
  const todayStr = now.toISOString().split("T")[0];
  const upcomingPickups = bookings
    .filter((b) => b.pickTime && b.pickTime >= todayStr && !["Annulée", "Rejetée", "Terminée"].includes(b.status))
    .sort((a, b) => (a.pickTime || "").localeCompare(b.pickTime || ""))
    .slice(0, 6);

  // Upcoming Returns (active or confirmed, dropTime >= today)
  const upcomingReturns = bookings
    .filter((b) => b.dropTime && b.dropTime >= todayStr && ["En cours", "Confirmée", "Payée"].includes(b.status))
    .sort((a, b) => (a.dropTime || "").localeCompare(b.dropTime || ""))
    .slice(0, 6);

  res.json({
    totalBookings,
    newBookings,
    pendingBookings,
    confirmedBookings,
    activeRentals,
    completedBookings,
    cancelledBookings,
    totalRevenue,
    fleetTotal: cars.length,
    availableCars,
    rentedCars,
    reservedCars,
    maintenanceCars,
    apartmentsTotal: apartments.length,
    totalCustomers: customers.length,
    totalPayments: payments.length,
    neuvesCount,
    occasionsCount,
    totalMessages: contacts.length,
    recentBookings: bookings.slice(0, 8),
    upcomingPickups,
    upcomingReturns,
    recentActivities: (activityLogs || []).slice(0, 10)
  });
});

/* ==========================================================================
   IMAGE UPLOAD ROUTE
   ========================================================================== */

app.post("/api/upload", authenticateToken, (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Aucune image fournie." });
    }
    // If already an absolute or relative path, return directly
    if (!imageBase64.startsWith("data:")) {
      return res.json({ url: imageBase64 });
    }
    const matches = imageBase64.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Format Base64 invalide." });
    }
    const mime = matches[1].toLowerCase();
    const ext = mime.includes("webp")
      ? "webp"
      : mime.includes("png")
      ? "png"
      : mime.includes("jpeg") || mime.includes("jpg")
      ? "jpg"
      : "png";
    const buffer = Buffer.from(matches[2], "base64");
    const safeName = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);
    res.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'image." });
  }
});

/* ==========================================================================
   APARTMENTS (MEUBLÉS YAOUNDÉ) ROUTES
   ========================================================================== */

app.get("/api/apartments", (req, res) => {
  const db = readDb();
  res.json(db.apartments || []);
});

app.get("/api/apartments/:id", (req, res) => {
  const db = readDb();
  const apt = (db.apartments || []).find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: "Appartement introuvable." });
  }
  res.json(apt);
});

app.post("/api/apartments", authenticateToken, (req, res) => {
  const db = readDb();
  db.apartments = db.apartments || [];
  const imagePath = req.body.image || req.body.img || "/Asset/appartements/appartement-meuble-suite-parentale.webp";
  const newApt = {
    id: `apt-${Date.now()}`,
    title: req.body.title || "Appartement Meublé 3M Services",
    type: req.body.type || "T3 Meublé Haut Standing",
    location: req.body.location || "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: req.body.rooms || "2 Chambres • Salon • Salle de bain",
    price: req.body.price || "65 000 FCFA / nuitée",
    photosCount: Number(req.body.photosCount) || 1,
    image: imagePath,
    img: imagePath,
    status: req.body.status || "Disponible",
    description: req.body.description || ""
  };
  db.apartments.unshift(newApt);
  writeDb(db);
  res.status(201).json(newApt);
});

app.put("/api/apartments/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.apartments = db.apartments || [];
  const index = db.apartments.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Appartement introuvable." });
  }
  const imagePath = req.body.image || req.body.img || db.apartments[index].image;
  const updated = {
    ...db.apartments[index],
    ...req.body,
    id: req.params.id,
    image: imagePath,
    img: imagePath
  };
  db.apartments[index] = updated;
  writeDb(db);
  res.json(updated);
});

app.delete("/api/apartments/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.apartments = db.apartments || [];
  const initialLen = db.apartments.length;
  db.apartments = db.apartments.filter((a) => a.id !== req.params.id);
  if (db.apartments.length === initialLen) {
    return res.status(404).json({ error: "Appartement introuvable." });
  }
  writeDb(db);
  res.json({ success: true, message: "Appartement supprimé." });
});

/* ==========================================================================
   VEHICLES / CARS ROUTES
   ========================================================================== */

app.get("/api/cars", (req, res) => {
  const db = readDb();
  let cars = db.cars || [];
  const { status, category, search } = req.query;

  if (status) {
    cars = cars.filter((c) => c.status && c.status.toLowerCase() === status.toLowerCase());
  }
  if (category) {
    cars = cars.filter((c) => c.category && c.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (search) {
    const q = search.toLowerCase();
    cars = cars.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.mark && c.mark.toLowerCase().includes(q)) ||
        (c.model && c.model.toLowerCase().includes(q))
    );
  }

  res.json(cars);
});

app.get("/api/cars/:id", (req, res) => {
  const db = readDb();
  const car = (db.cars || []).find((c) => c.id === req.params.id);
  if (!car) {
    return res.status(404).json({ error: "Véhicule introuvable." });
  }
  res.json(car);
});

app.post("/api/cars", authenticateToken, (req, res) => {
  const db = readDb();
  const pricePerDay = Number(req.body.pricePerDay) || 50000;
  const imagePath = req.body.image || req.body.img || "/images/cars-big/toyotacamry.jpg";
  const brandName = req.body.brand || req.body.mark || "Toyota";
  const newCar = {
    id: `car-${Date.now()}`,
    name: req.body.name || "Véhicule 3M SERVICES",
    model: req.body.model || req.body.name || "",
    mark: brandName,
    brand: brandName,
    category: req.body.category || "SUV 4x4",
    year: req.body.year ? String(req.body.year) : new Date().getFullYear().toString(),
    condition: req.body.condition || "Occasion Certifiée",
    mileage: req.body.mileage || "Faible kilométrage certifié",
    pricePerDay: pricePerDay,
    price: req.body.price || `À partir de ${pricePerDay.toLocaleString("fr-FR")} FCFA / jour`,
    doors: req.body.doors ? String(req.body.doors) : "5",
    seats: req.body.seats ? String(req.body.seats) : "5 places",
    transmission: req.body.transmission || "Automatique",
    fuel: req.body.fuel || "Essence",
    air: req.body.air || "Oui",
    status: req.body.status || "Disponible",
    plate: req.body.plate || "CE-000-XX",
    img: imagePath,
    image: imagePath,
    description: req.body.description || ""
  };

  db.cars.unshift(newCar);
  writeDb(db);
  res.status(201).json(newCar);
});

app.put("/api/cars/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const index = (db.cars || []).findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Véhicule introuvable." });
  }

  const existing = db.cars[index];
  const brandName = req.body.brand || req.body.mark || existing.brand || existing.mark;
  const imagePath = req.body.image || req.body.img || existing.image || existing.img;
  const pricePerDay = req.body.pricePerDay ? Number(req.body.pricePerDay) : existing.pricePerDay;

  const updated = {
    ...existing,
    ...req.body,
    id: req.params.id,
    mark: brandName,
    brand: brandName,
    image: imagePath,
    img: imagePath,
    pricePerDay: pricePerDay,
    price: req.body.price || (pricePerDay ? `À partir de ${pricePerDay.toLocaleString("fr-FR")} FCFA / jour` : existing.price)
  };

  db.cars[index] = updated;
  writeDb(db);
  res.json(updated);
});

app.patch("/api/cars/:id/status", authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Nouveau statut requis." });
  }
  const db = readDb();
  const car = (db.cars || []).find((c) => c.id === req.params.id);
  if (!car) {
    return res.status(404).json({ error: "Véhicule introuvable." });
  }
  car.status = status;
  writeDb(db);
  res.json(car);
});

app.delete("/api/cars/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const initialLength = (db.cars || []).length;
  db.cars = (db.cars || []).filter((c) => c.id !== req.params.id);
  if (db.cars.length === initialLength) {
    return res.status(404).json({ error: "Véhicule introuvable." });
  }
  writeDb(db);
  res.json({ success: true, message: "Véhicule supprimé." });
});

/* ==========================================================================
   FLEET AVAILABILITY & CONFLICT PREVENTION
   ========================================================================== */

app.get("/api/fleet/availability", authenticateToken, (req, res) => {
  const { carName, carId, pickTime, dropTime, bookingId } = req.query;
  const conflict = checkCarConflict(carId || carName, pickTime, dropTime, bookingId);
  if (conflict) {
    return res.json({ available: false, ...conflict });
  }
  res.json({ available: true, message: "Véhicule disponible sur cette période." });
});

/* ==========================================================================
   BOOKINGS / RÉSERVATIONS ROUTES
   ========================================================================== */

app.get("/api/bookings", authenticateToken, (req, res) => {
  const db = readDb();
  let bookings = db.bookings || [];
  const { status, search, vehicle, pickDate, location } = req.query;

  if (status && status !== "Toutes" && status !== "all") {
    bookings = bookings.filter((b) => b.status && b.status.toLowerCase() === status.toLowerCase());
  }

  if (vehicle && vehicle !== "Toutes" && vehicle !== "all") {
    bookings = bookings.filter((b) => b.carName && b.carName.toLowerCase().includes(vehicle.toLowerCase()));
  }

  if (pickDate) {
    bookings = bookings.filter((b) => b.pickTime && b.pickTime.startsWith(pickDate));
  }

  if (location && location !== "Toutes") {
    bookings = bookings.filter((b) => (b.pickUp && b.pickUp.includes(location)) || (b.dropOff && b.dropOff.includes(location)));
  }

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        (b.id && b.id.toLowerCase().includes(q)) ||
        (b.clientName && b.clientName.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.carName && b.carName.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q))
    );
  }

  res.json(bookings);
});

app.get("/api/bookings/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const booking = (db.bookings || []).find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }
  // Also attach vehicle details from fleet if available
  const car = (db.cars || []).find(
    (c) => (booking.carId && c.id === booking.carId) || (booking.carName && c.name && c.name.toLowerCase() === booking.carName.toLowerCase())
  );
  // Also attach payments and contract if exists
  const payments = (db.payments || []).filter((p) => p.bookingId === booking.id);
  const contract = (db.contracts || []).find((c) => c.bookingId === booking.id);

  res.json({ ...booking, carDetails: car || null, payments, contract: contract || null });
});

// PUBLIC or AUTHENTICATED creation of bookings
app.post("/api/bookings", (req, res) => {
  const db = readDb();
  const year = new Date().getFullYear();
  const count = (db.bookings || []).length + 1;
  const refCode = `3M-RES-${year}-${String(count).padStart(3, "0")}`;

  const clientName = req.body.clientName || `${req.body.name || ""} ${req.body.lastName || ""}`.trim() || "Client 3M Services";
  const days = Number(req.body.days) || 1;
  const pricePerDay = Number(req.body.pricePerDay) || 50000;
  const totalPrice = Number(req.body.totalPrice) || days * pricePerDay;

  const newBooking = {
    id: refCode,
    clientName,
    firstName: req.body.firstName || req.body.name || "",
    lastName: req.body.lastName || "",
    phone: req.body.phone || "+237",
    whatsapp: req.body.whatsapp || req.body.phone || "+237",
    age: req.body.age || "",
    email: req.body.email || "",
    address: req.body.address || "",
    city: req.body.city || "Yaoundé",
    zipcode: req.body.zipcode || "",
    marketingConsent: Boolean(req.body.marketingConsent),
    carName: req.body.carName || req.body.carType || "Toyota Prado VIP",
    carId: req.body.carId || "",
    rentalType: req.body.rentalType || "Avec Chauffeur",
    pickUp: req.body.pickUp || "Yaoundé-Nsimalen",
    dropOff: req.body.dropOff || "Yaoundé-Centre",
    pickTime: req.body.pickTime || new Date().toISOString().split("T")[0],
    dropTime: req.body.dropTime || "",
    days,
    pricePerDay,
    totalPrice,
    agreedPrice: totalPrice,
    deposit: 0,
    paidAmount: 0,
    balance: totalPrice,
    paymentStatus: "En attente",
    status: req.body.status || "En attente",
    source: "Site Web",
    withDriver: req.body.withDriver !== false,
    assignedDriverId: "",
    internalNotes: req.body.notes ? [{ id: `nt-${Date.now()}`, text: req.body.notes, author: "Système", createdAt: new Date().toISOString() }] : [],
    statusHistory: [
      {
        status: req.body.status || "En attente",
        changedAt: new Date().toISOString(),
        changedBy: req.user ? req.user.name || req.user.email : "Client (Formulaire Web)",
        note: "Création initiale de la réservation"
      }
    ],
    createdAt: new Date().toISOString()
  };

  db.bookings = db.bookings || [];
  db.bookings.unshift(newBooking);
  writeDb(db);

  // Auto-upsert into customer database
  upsertCustomerFromBooking(newBooking);

  // Log activity
  logActivity("NOUVELLE_RÉSERVATION", `Réservation ${refCode} créée pour ${clientName} (${newBooking.carName})`, "Site Web");

  res.status(201).json(newBooking);
});

// Update booking status with audit history and conflict detection
app.put("/api/bookings/:id/status", authenticateToken, (req, res) => {
  const { status, note, forceOverride } = req.body;
  const validStatuses = [
    "En attente",
    "En cours d'examen",
    "Confirmée",
    "Contrat préparé",
    "En attente de paiement",
    "Payée",
    "En cours",
    "Terminée",
    "Annulée",
    "Rejetée"
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Statuts autorisés : ${validStatuses.join(", ")}` });
  }

  const db = readDb();
  const index = (db.bookings || []).findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  const booking = db.bookings[index];

  // Conflict detection before confirming or activating
  if (["Confirmée", "En cours"].includes(status) && !forceOverride) {
    const conflict = checkCarConflict(booking.carId || booking.carName, booking.pickTime, booking.dropTime, booking.id);
    if (conflict) {
      return res.status(409).json({
        error: conflict.message,
        conflict: true,
        conflictingBooking: conflict.conflictingBooking
      });
    }
  }

  const previousStatus = booking.status;
  booking.status = status;
  booking.statusHistory = booking.statusHistory || [];
  booking.statusHistory.push({
    status,
    previousStatus,
    changedAt: new Date().toISOString(),
    changedBy: req.user ? req.user.name || req.user.email : "Administrateur",
    note: note || `Statut mis à jour : ${previousStatus} → ${status}`
  });

  // Update vehicle fleet status if booking becomes Active
  if (status === "En cours" && booking.carName) {
    const carIdx = (db.cars || []).findIndex(
      (c) => (booking.carId && c.id === booking.carId) || (c.name && c.name.toLowerCase() === booking.carName.toLowerCase())
    );
    if (carIdx !== -1) {
      db.cars[carIdx].status = "Loué";
    }
  } else if (status === "Terminée" && booking.carName) {
    const carIdx = (db.cars || []).findIndex(
      (c) => (booking.carId && c.id === booking.carId) || (c.name && c.name.toLowerCase() === booking.carName.toLowerCase())
    );
    if (carIdx !== -1 && db.cars[carIdx].status === "Loué") {
      db.cars[carIdx].status = "Disponible";
    }
  }

  db.bookings[index] = booking;
  writeDb(db);

  logActivity(
    "STATUT_RÉSERVATION",
    `Réservation ${booking.id} : ${previousStatus} → ${status}`,
    req.user ? req.user.name || req.user.email : "Admin"
  );

  res.json({ success: true, booking });
});

// Add internal admin note to a booking
app.post("/api/bookings/:id/notes", authenticateToken, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Le texte de la note est requis." });
  }

  const db = readDb();
  const index = (db.bookings || []).findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  const noteObj = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    author: req.user ? req.user.name || req.user.email : "Admin 3M",
    createdAt: new Date().toISOString()
  };

  db.bookings[index].internalNotes = db.bookings[index].internalNotes || [];
  db.bookings[index].internalNotes.push(noteObj);
  writeDb(db);

  logActivity(
    "NOTE_INTERNE",
    `Nouvelle note ajoutée sur la réservation ${db.bookings[index].id}`,
    req.user ? req.user.name || req.user.email : "Admin"
  );

  res.status(201).json(noteObj);
});

app.put("/api/bookings/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const index = (db.bookings || []).findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  db.bookings[index] = { ...db.bookings[index], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.bookings[index]);
});

app.delete("/api/bookings/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const initialLength = (db.bookings || []).length;
  const deleted = (db.bookings || []).find((b) => b.id === req.params.id);
  db.bookings = (db.bookings || []).filter((b) => b.id !== req.params.id);
  if (db.bookings.length === initialLength) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }
  writeDb(db);

  if (deleted) {
    logActivity("SUPPRESSION_RÉSERVATION", `Réservation ${deleted.id} supprimée`, req.user ? req.user.name : "Admin");
  }

  res.json({ success: true, message: "Réservation supprimée." });
});

/* ==========================================================================
   CUSTOMERS / CLIENTS MANAGEMENT MODULE
   ========================================================================== */

app.get("/api/customers", authenticateToken, (req, res) => {
  const db = readDb();
  const customers = db.customers || [];
  const bookings = db.bookings || [];
  const payments = db.payments || [];
  const { search } = req.query;

  // Enrich customers with aggregated booking stats
  const enriched = customers.map((c) => {
    const custBookings = bookings.filter(
      (b) =>
        (b.phone && c.phone && b.phone === c.phone) ||
        (b.email && c.email && b.email.toLowerCase() === c.email.toLowerCase())
    );
    const totalSpent = custBookings
      .filter((b) => ["Confirmée", "Contrat préparé", "Payée", "En cours", "Terminée"].includes(b.status))
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    return {
      ...c,
      totalBookings: custBookings.length,
      totalSpent,
      bookings: custBookings.slice(0, 5)
    };
  });

  if (search) {
    const q = search.toLowerCase();
    return res.json(
      enriched.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q))
      )
    );
  }

  res.json(enriched);
});

app.get("/api/customers/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const customer = (db.customers || []).find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Client introuvable." });
  }
  const custBookings = (db.bookings || []).filter(
    (b) =>
      (b.phone && customer.phone && b.phone === customer.phone) ||
      (b.email && customer.email && b.email.toLowerCase() === customer.email.toLowerCase())
  );
  res.json({ ...customer, allBookings: custBookings });
});

app.post("/api/customers", authenticateToken, (req, res) => {
  const db = readDb();
  const newCust = {
    id: `CUST-${Date.now()}`,
    name: req.body.name || "Nouveau Client",
    phone: req.body.phone || "",
    whatsapp: req.body.whatsapp || req.body.phone || "",
    email: req.body.email || "",
    address: req.body.address || "",
    city: req.body.city || "Yaoundé",
    zipcode: req.body.zipcode || "",
    age: req.body.age || "",
    marketingConsent: Boolean(req.body.marketingConsent),
    createdAt: new Date().toISOString(),
    status: req.body.status || "Actif",
    notes: req.body.notes || ""
  };
  db.customers = db.customers || [];
  db.customers.unshift(newCust);
  writeDb(db);
  res.status(201).json(newCust);
});

app.put("/api/customers/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const index = (db.customers || []).findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Client introuvable." });
  }
  db.customers[index] = { ...db.customers[index], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.customers[index]);
});

app.delete("/api/customers/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.customers = (db.customers || []).filter((c) => c.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Client supprimé." });
});

/* ==========================================================================
   PAYMENTS MANAGEMENT MODULE
   ========================================================================== */

app.get("/api/payments", authenticateToken, (req, res) => {
  const db = readDb();
  let payments = db.payments || [];
  const { bookingId, method, status } = req.query;

  if (bookingId) {
    payments = payments.filter((p) => p.bookingId === bookingId);
  }
  if (method) {
    payments = payments.filter((p) => p.method === method);
  }
  if (status) {
    payments = payments.filter((p) => p.status === status);
  }
  res.json(payments);
});

app.post("/api/payments", authenticateToken, (req, res) => {
  const { bookingId, amount, method, reference, note } = req.body;
  if (!bookingId || !amount) {
    return res.status(400).json({ error: "La réservation et le montant sont requis." });
  }

  const db = readDb();
  const bIndex = (db.bookings || []).findIndex((b) => b.id === bookingId);
  if (bIndex === -1) {
    return res.status(404).json({ error: "Réservation liée introuvable." });
  }

  const booking = db.bookings[bIndex];
  const paidNum = Number(amount) || 0;

  const newPayment = {
    id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId,
    clientName: booking.clientName,
    amount: paidNum,
    method: method || "Espèces", // Espèces, MTN Mobile Money, Orange Money, Virement bancaire
    reference: reference || `REF-${Date.now().toString().slice(-6)}`,
    status: "Confirmé",
    note: note || "",
    recordedBy: req.user ? req.user.name || req.user.email : "Admin",
    createdAt: new Date().toISOString()
  };

  db.payments = db.payments || [];
  db.payments.unshift(newPayment);

  // Update booking paidAmount and balance
  booking.paidAmount = (Number(booking.paidAmount) || 0) + paidNum;
  booking.balance = Math.max(0, (Number(booking.totalPrice) || 0) - booking.paidAmount);
  if (booking.balance === 0) {
    booking.paymentStatus = "Payée";
  } else if (booking.paidAmount > 0) {
    booking.paymentStatus = "Acompte versé";
  }

  db.bookings[bIndex] = booking;
  writeDb(db);

  logActivity(
    "PAIEMENT_ENREGISTRÉ",
    `Paiement de ${paidNum.toLocaleString("fr-FR")} FCFA enregistré pour ${booking.id} (${method})`,
    req.user ? req.user.name : "Admin"
  );

  res.status(201).json({ payment: newPayment, booking });
});

/* ==========================================================================
   RENTAL CONTRACTS MODULE
   ========================================================================== */

app.get("/api/contracts", authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.contracts || []);
});

app.post("/api/contracts", authenticateToken, (req, res) => {
  const { bookingId, clauses, driverAssigned, securityDeposit } = req.body;
  if (!bookingId) {
    return res.status(400).json({ error: "L'identifiant de réservation est requis." });
  }

  const db = readDb();
  const booking = (db.bookings || []).find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  const count = (db.contracts || []).length + 1;
  const contractNumber = `3M-CTR-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;

  const newContract = {
    id: `CTR-${Date.now()}`,
    contractNumber,
    bookingId,
    clientName: booking.clientName,
    clientPhone: booking.phone,
    carName: booking.carName,
    pickUp: booking.pickUp,
    dropOff: booking.dropOff,
    pickTime: booking.pickTime,
    dropTime: booking.dropTime,
    totalPrice: booking.totalPrice,
    securityDeposit: securityDeposit || 100000,
    driverAssigned: driverAssigned || booking.assignedDriverId || "Chauffeur professionnel 3M",
    clauses: clauses || "Véhicule mis à disposition avec plein carburant de départ. Restitution dans l'état de mise à disposition.",
    status: "Établi",
    generatedAt: new Date().toISOString()
  };

  db.contracts = db.contracts || [];
  db.contracts.unshift(newContract);

  // Update booking contract reference
  const bIndex = db.bookings.findIndex((b) => b.id === bookingId);
  if (bIndex !== -1) {
    db.bookings[bIndex].contractId = newContract.id;
    db.bookings[bIndex].contractNumber = contractNumber;
    if (db.bookings[bIndex].status === "Confirmée") {
      db.bookings[bIndex].status = "Contrat préparé";
    }
  }

  writeDb(db);

  logActivity(
    "CONTRAT_GÉNÉRÉ",
    `Contrat de location ${contractNumber} créé pour ${booking.clientName} (${booking.id})`,
    req.user ? req.user.name : "Admin"
  );

  res.status(201).json(newContract);
});

/* ==========================================================================
   DRIVERS / TEAM MANAGEMENT MODULE
   ========================================================================== */

app.get("/api/drivers", authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.drivers || []);
});

app.post("/api/drivers", authenticateToken, (req, res) => {
  const { name, phone, licenseNumber, experienceYears, status } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Nom et téléphone du chauffeur requis." });
  }
  const db = readDb();
  const newDriver = {
    id: `DRV-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    licenseNumber: licenseNumber || "B-CM-2022-X",
    experienceYears: Number(experienceYears) || 5,
    status: status || "Disponible", // Disponible, En mission, Repos
    photo: req.body.photo || "",
    rating: 5.0,
    createdAt: new Date().toISOString()
  };
  db.drivers = db.drivers || [];
  db.drivers.unshift(newDriver);
  writeDb(db);
  res.status(201).json(newDriver);
});

app.put("/api/drivers/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const index = (db.drivers || []).findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Chauffeur introuvable." });
  }
  db.drivers[index] = { ...db.drivers[index], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.drivers[index]);
});

app.delete("/api/drivers/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.drivers = (db.drivers || []).filter((d) => d.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Chauffeur supprimé." });
});

/* ==========================================================================
   REVIEWS & TESTIMONIALS MODULE
   ========================================================================== */

app.get("/api/reviews", (req, res) => {
  const db = readDb();
  res.json(db.reviews || []);
});

app.post("/api/reviews", (req, res) => {
  const { name, location, comment, rating, serviceType } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ error: "Nom et avis requis." });
  }
  const db = readDb();
  const newRev = {
    id: `REV-${Date.now()}`,
    name: name.trim(),
    location: location || "Yaoundé",
    serviceType: serviceType || "Location de Véhicule VIP",
    comment: comment.trim(),
    rating: Number(rating) || 5,
    status: "En attente", // En attente, Approuvé, Rejeté
    createdAt: new Date().toISOString()
  };
  db.reviews = db.reviews || [];
  db.reviews.unshift(newRev);
  writeDb(db);
  res.status(201).json(newRev);
});

app.put("/api/reviews/:id/status", authenticateToken, (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const index = (db.reviews || []).findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Avis introuvable." });
  }
  db.reviews[index].status = status;
  writeDb(db);
  res.json(db.reviews[index]);
});

app.delete("/api/reviews/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.reviews = (db.reviews || []).filter((r) => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Avis supprimé." });
});

/* ==========================================================================
   STAFF USERS & ROLES MODULE
   ========================================================================== */

app.get("/api/users", authenticateToken, (req, res) => {
  const db = readDb();
  const users = (db.users || []).map((u) => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json(users);
});

app.post("/api/users", authenticateToken, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nom, email et mot de passe requis." });
  }
  const db = readDb();
  const exists = (db.users || []).some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
  }
  const newUser = {
    id: `USR-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim(),
    role: role || "Gestionnaire Réservations", // Super Admin, Gestionnaire Réservations, Responsable Flotte, Comptable, Concierge
    active: true,
    createdAt: new Date().toISOString()
  };
  db.users = db.users || [];
  db.users.push(newUser);
  writeDb(db);
  const { password: _, ...clean } = newUser;
  res.status(201).json(clean);
});

app.put("/api/users/:id", authenticateToken, (req, res) => {
  const db = readDb();
  const index = (db.users || []).findIndex((u) => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }
  db.users[index] = { ...db.users[index], ...req.body, id: req.params.id };
  writeDb(db);
  const { password, ...clean } = db.users[index];
  res.json(clean);
});

app.delete("/api/users/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.users = (db.users || []).filter((u) => u.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Utilisateur supprimé." });
});

/* ==========================================================================
   ACTIVITY LOGS AUDIT TRAIL
   ========================================================================== */

app.get("/api/activity-logs", authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.activity_logs || []);
});

/* ==========================================================================
   CONTACTS / INQUIRIES ROUTES
   ========================================================================== */

app.get("/api/contacts", authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.contacts || []);
});

app.post("/api/contacts", (req, res) => {
  const db = readDb();
  const newContact = {
    id: `msg-${Date.now()}`,
    name: req.body.name || "Client Anonyme",
    contact: req.body.contact || req.body.phone || "",
    email: req.body.email || "",
    message: req.body.message || "",
    status: "Nouveau",
    createdAt: new Date().toISOString()
  };

  db.contacts = db.contacts || [];
  db.contacts.unshift(newContact);
  writeDb(db);
  res.status(201).json(newContact);
});

app.delete("/api/contacts/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.contacts = (db.contacts || []).filter((c) => c.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Message supprimé." });
});

/* ==========================================================================
   NEWSLETTER
   ========================================================================== */

app.get("/api/newsletter", authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.subscribers || []);
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }
  const db = readDb();
  db.subscribers = db.subscribers || [];
  if (!db.subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    db.subscribers.unshift({ email, subscribedAt: new Date().toISOString() });
    writeDb(db);
  }
  res.json({ success: true, message: "Inscription réussie à la newsletter 3M Services." });
});

/* ==========================================================================
   LOCATIONS (CAMEROON PICK-UP & DROP-OFF)
   ========================================================================== */

app.get("/api/locations", (req, res) => {
  const db = readDb();
  res.json(db.locations || { pickup: [], dropoff: [] });
});

app.post("/api/locations/pickup", authenticateToken, (req, res) => {
  const { name, city } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le nom du lieu est requis." });
  }
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  const newLoc = {
    id: `pk-${Date.now()}`,
    name: name.trim(),
    city: city ? city.trim() : "Cameroun",
    active: true
  };
  db.locations.pickup.push(newLoc);
  writeDb(db);
  res.status(201).json(newLoc);
});

app.put("/api/locations/pickup/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  const index = (db.locations.pickup || []).findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Lieu introuvable." });
  }
  db.locations.pickup[index] = { ...db.locations.pickup[index], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.locations.pickup[index]);
});

app.delete("/api/locations/pickup/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  db.locations.pickup = (db.locations.pickup || []).filter((l) => l.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Lieu de prise en charge supprimé." });
});

app.post("/api/locations/dropoff", authenticateToken, (req, res) => {
  const { name, city } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le nom du lieu est requis." });
  }
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  const newLoc = {
    id: `dp-${Date.now()}`,
    name: name.trim(),
    city: city ? city.trim() : "Cameroun",
    active: true
  };
  db.locations.dropoff.push(newLoc);
  writeDb(db);
  res.status(201).json(newLoc);
});

app.put("/api/locations/dropoff/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  const index = (db.locations.dropoff || []).findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Lieu introuvable." });
  }
  db.locations.dropoff[index] = { ...db.locations.dropoff[index], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.locations.dropoff[index]);
});

app.delete("/api/locations/dropoff/:id", authenticateToken, (req, res) => {
  const db = readDb();
  db.locations = db.locations || { pickup: [], dropoff: [] };
  db.locations.dropoff = (db.locations.dropoff || []).filter((l) => l.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Lieu de restitution supprimé." });
});

/* ==========================================================================
   START SERVER
   ========================================================================== */

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 3M SERVICES Backend Server running on port ${PORT}`);
  console.log(` 🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(` 🔑 Default Admin: admin@3mservices.cm / admin3m2026`);
  console.log(`=======================================================`);
});

