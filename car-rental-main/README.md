# 3M SERVICES — Plateforme Officielle de Location de Véhicules VIP & Résidences Meublées

Plateforme web progressive (PWA) et système de gestion intégrée (ERP / CRM) pour **3M SERVICES SARL** à Yaoundé, Cameroun.

---

## 🏛️ Architecture du Projet

Le projet est conçu selon une architecture moderne full-stack découplée :

```
3MSERVICES/
├── car-rental-main/
│   ├── public/                 # Assets statiques, manifest PWA, robots, uploads
│   │   ├── Asset/              # Catalogues PDF officiels, logos partenaires
│   │   ├── images/             # Images flotte VIP, appartements, bannières
│   │   └── uploads/            # Fichiers uploadés via l'admin panel
│   ├── server/                 # Backend API REST (Node.js & Express)
│   │   ├── data/
│   │   │   └── db.json         # Base de données persistante (Flotte, Réservations, etc.)
│   │   └── index.js            # Contrôleurs REST, Auth JWT, Logs & Sécurité
│   ├── src/
│   │   ├── components/         # Composants d'interface réutilisables (Navbar, Footer, etc.)
│   │   ├── config/             # Configuration des environnements & API_BASE
│   │   ├── constants/          # Constantes applicatives (Coordonnées 3M, Statuts, Routes)
│   │   ├── context/            # Contextes React (Bilinguisme FR/EN)
│   │   ├── data/               # Catalogues de données (Flotte officielle 3M, Seed CRM)
│   │   ├── Pages/              # Pages et Vues applicatives
│   │   │   ├── Admin/          # Espace Administration RentQ (Dashboard, Login, Fleet, etc.)
│   │   │   ├── About.jsx       # Présentation de 3M Services & Chiffres clés
│   │   │   ├── ApartmentsPage.jsx # Résidences meublées haut standing
│   │   │   ├── Contact.jsx     # Formulaire de contact & géolocalisation
│   │   │   ├── Home.jsx        # Landing page interactive & réservation rapide
│   │   │   ├── Models.jsx      # Catalogue Marketo E-commerce & Galerie Multi-Angles
│   │   │   ├── Team.jsx        # Équipe de direction & chauffeurs VIP
│   │   │   └── TestimonialsPage.jsx # Avis clients vérifiés
│   │   ├── services/           # Couche de services API centralisée (fetch avec tokens)
│   │   ├── styles/             # Feuilles de styles modulaires & SCSS
│   │   ├── utils/              # Fonctions utilitaires, formatage FCFA, CRM LocalStorage
│   │   ├── App.js              # Définition des routes React Router v6
│   │   └── index.js            # Point d'entrée React & Service Worker
│   └── package.json            # Dépendances et scripts de build
```

---

## ✨ Fonctionnalités Clés

1. **Catalogue E-commerce "Nos Véhicules" (`/models`)** :
   - Design moderne inspiré de Marketo Auto Parts.
   - 100% Mobile Responsive (iPhone, Android, Tablettes, Desktop).
   - Offre de la semaine avec compte à rebours dynamique en temps réel.
   - Galerie photo multi-angles interactive pour chaque véhicule de la flotte officielle (LC200, LC300, Prado TXL, Hilux, Camry, Mercedes Classe E, RAV4).
   - Modal de réservation optimisé avec confirmation WhatsApp & Email automatique.

2. **Appartements & Résidences Meublées (`/apartments`)** :
   - Vitrine des appartements de luxe à Yaoundé (Bastos, Omnisports, etc.).
   - Filtrage par standing, prix et équipements inclus.
   - Demande de réservation instantanée avec conciergerie VIP.

3. **Espace Client Dédié (Client Portal Modal)** :
   - Suivi d'historique des réservations en temps réel.
   - Téléchargement des factures proforma et reçus.
   - Synchronisation automatique entre chaque nouvelle commande et le compte client.

4. **Tableau de Bord Administrateur RentQ (`/admin`)** :
   - Thème et ergonomie professionnels inspirés du template RentQ.
   - Gestion de flotte (Ajout, modification, photos multi-angles, disponibilité).
   - Gestion des réservations (Validation de statut, assignation de chauffeur VIP).
   - Gestion des clients et suivi financier (Soldes, paiements, factures).
   - Journal d'activités et alertes notifications.

5. **Application Web Progressive (PWA)** :
   - Bannière d'installation native adaptée aux mobiles.
   - Mode offline avec mise en cache optimisée.
   - Icônes maskables et thème couleur officiel 3M `#E20713`.

---

## 🚀 Installation & Développement Local

### Prérequis
- **Node.js** >= 16.x
- **npm** >= 8.x

### 1. Cloner le dépôt
```bash
git clone https://github.com/Transfomers/maya-consulting-.git
cd maya-consulting-/car-rental-main
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Démarrer le serveur Backend (API REST)
```bash
npm run server
# Le serveur démarre sur http://localhost:5001/api
```

### 4. Démarrer l'application Frontend React
Dans un second terminal :
```bash
npm start
# L'application s'ouvre sur http://localhost:3000 (ou port configuré)
```

### 5. Démarrer la WebApp Intégrée Flask (Admin & Opérations 3M)
Pour exécuter l'application web Python/Flask dédiée à la gestion des opérations de flotte, chauffeurs, réservations et caisse :
```bash
cd car-rental-main
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PORT=5002 python3 run.py
# La WebApp démarre sur http://127.0.0.1:5002
# Identifiants Super Admin : admin@3mservice.shop / admin3m2026
```

---

## 📦 Build & Déploiement en Production

### 1. Compilation pour la production
```bash
CI=false npm run build
```
Le dossier optimisé est généré dans `car-rental-main/build`.

### 2. Déploiement sur le VPS de Production (`85.209.95.4`)
La production est conteneurisée sous Docker via Nginx (`m3_frontend`) :
```bash
tar -czf /tmp/build_deploy.tar.gz -C car-rental-main/build .
scp /tmp/build_deploy.tar.gz root@85.209.95.4:/tmp/
ssh root@85.209.95.4 'tar -xzf /tmp/build_deploy.tar.gz -C /var/www/3mservice_build/ && docker cp /var/www/3mservice_build/. m3_frontend:/usr/share/nginx/html/ && docker exec m3_frontend nginx -s reload && rm -f /tmp/build_deploy.tar.gz'
```

---

## 🛡️ Sécurité & Bonnes Pratiques

- **Mots de passe** : Chiffrement SHA-256 avec salage (`SALT`).
- **Authentification** : Sessions avec jetons Bearer vérifiés à chaque requête protégée.
- **Limites de requêtes** : Analyseur de corps JSON limité à 50MB pour l'envoi sécurisé des images.
- **Validation** : Nettoyage et vérification des données entrantes sur tous les formulaires.

---

## 📞 Coordonnées 3M SERVICES

- **Site Web** : [https://3mservice.shop](https://3mservice.shop)
- **Adresse** : Omnisports, Face Pharmacie Le Bon Berger, Yaoundé, Cameroun
- **Téléphone / WhatsApp Conciergerie 24/7** : +237 691 78 64 47 / +237 698 66 87 61
- **Email Officiel** : [contact@3mservice.shop](mailto:contact@3mservice.shop)
