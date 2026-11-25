#!/usr/bin/env python3
"""
3M SERVICES — Plateforme Web & Système de Gestion Intégrée
Lanceur officiel de l'application Flask
"""

import os
import secrets
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User, Agency, Bus, Driver, Route, Trip, Booking

app = create_app()

def seed_initial_3m_data():
    """Initialise les données officielles 3M SERVICES si la base est vide"""
    with app.app_context():
        db.create_all()
        
        # 1. Agence principale 3M SERVICES
        agency = Agency.query.filter_by(name="3M SERVICES Yaoundé VIP").first()
        if not agency:
            agency = Agency(
                name="3M SERVICES Yaoundé VIP",
                logo="logorv.png",
                city="Yaoundé",
                address="Omnisports, Face Pharmacie Le Bon Berger",
                phone="+237 691 78 64 47",
                email="contact@3mservice.shop"
            )
            db.session.add(agency)
            db.session.commit()
            print(" Agence 3M SERVICES créée.")

        # 2. Super Administrateur 3M
        admin = User.query.filter_by(email="admin@3mservice.shop").first()
        if not admin:
            # Mot de passe initial : ADMIN_INITIAL_PASSWORD, sinon aléatoire (affiché une seule fois)
            initial_pw = os.environ.get('ADMIN_INITIAL_PASSWORD') or secrets.token_urlsafe(12)
            admin = User(
                username="admin3m",
                email="admin@3mservice.shop",
                password_hash=generate_password_hash(initial_pw, method='pbkdf2:sha256'),
                role="super_admin",
                phone="+237 691 78 64 47",
                is_verified=True,
                real_name="Administrateur Général 3M SERVICES",
                agency_id=agency.id
            )
            db.session.add(admin)
            db.session.commit()
            if os.environ.get('ADMIN_INITIAL_PASSWORD'):
                print(" Super Admin 3M SERVICES créé : admin@3mservice.shop (mot de passe = ADMIN_INITIAL_PASSWORD)")
            else:
                print(f" Super Admin 3M SERVICES créé : admin@3mservice.shop / {initial_pw}  (à changer dès la 1re connexion)")

        # 3. Flotte Officielle des 7 Véhicules VIP 3M
        fleet_data = [
            {"plate": "CE-982-LT", "brand": "Toyota", "model": "Land Cruiser V8 LC200 Prestige", "seats": 7},
            {"plate": "LT-104-AB", "brand": "Toyota", "model": "Land Cruiser V8 LC300 VIP", "seats": 7},
            {"plate": "CE-452-X",  "brand": "Toyota", "model": "Land Cruiser Prado TXL VIP", "seats": 7},
            {"plate": "CE-789-HT", "brand": "Toyota", "model": "Hilux Double Cabine 4x4", "seats": 5},
            {"plate": "CE-331-BC", "brand": "Toyota", "model": "Camry Berline Prestige", "seats": 5},
            {"plate": "LT-554-ME", "brand": "Mercedes-Benz", "model": "Classe E Berline VIP", "seats": 5},
            {"plate": "CE-112-RV", "brand": "Toyota", "model": "RAV4 4x4 Urbain", "seats": 5},
        ]

        for car in fleet_data:
            existing = Bus.query.filter_by(bus_number=car["plate"]).first()
            if not existing:
                bus = Bus(
                    bus_number=car["plate"],
                    brand=car["brand"],
                    model=car["model"],
                    capacity=car["seats"],
                    agency_id=agency.id,
                    status="active"
                )
                db.session.add(bus)
        db.session.commit()
        print(" Flotte des 7 Véhicules VIP 3M synchronisée.")

        # 4. Chauffeurs VIP Bilingues
        drivers_data = [
            {"name": "Martin Essomba", "phone": "+237 698 66 87 61", "license": "B-C-4982-YDE"},
            {"name": "Alain Ngono", "phone": "+237 671 22 45 88", "license": "B-C-3310-YDE"},
            {"name": "Jean-Paul Kamga", "phone": "+237 695 33 11 00", "license": "B-C-8821-DLA"},
        ]
        for d in drivers_data:
            if not Driver.query.filter_by(license_number=d["license"]).first():
                driver = Driver(
                    name=d["name"],
                    phone=d["phone"],
                    license_number=d["license"],
                    agency_id=agency.id,
                    status="available"
                )
                db.session.add(driver)
        db.session.commit()
        print(" Chauffeurs VIP 3M synchronisés.")

        # 5. Missions & Lignes VIP 3M
        routes_data = [
            {"origin": "Yaoundé Centre (Omnisports)", "dest": "Aéroport International Nsimalen", "dur": "45 min", "dist": 25.0, "price": 25000.0},
            {"origin": "Yaoundé (Omnisports)", "dest": "Douala (Bonanjo VIP)", "dur": "3h30", "dist": 240.0, "price": 60000.0},
            {"origin": "Yaoundé (Omnisports)", "dest": "Kribi (Station Balnéaire VIP)", "dur": "4h00", "dist": 290.0, "price": 80000.0},
            {"origin": "Yaoundé Ville", "dest": "Mise à Disposition Journée Chauffeur", "dur": "8h00", "dist": 80.0, "price": 50000.0},
        ]
        for r in routes_data:
            if not Route.query.filter_by(origin=r["origin"], destination=r["dest"]).first():
                route = Route(
                    origin=r["origin"],
                    destination=r["dest"],
                    duration=r["dur"],
                    distance=r["dist"],
                    base_price=r["price"],
                    agency_id=agency.id
                )
                db.session.add(route)
        db.session.commit()
        print(" Missions & Trajets VIP 3M initialisés.")

        # Aucune donnée fictive n'est créée ici : pas de client « VIP » générique, pas de missions
        # automatiques, pas d'import des demandes du site comme réservations payées.
        # Les réservations réelles sont créées par l'équipe ou par le site client.

if __name__ == '__main__':
    seed_initial_3m_data()
    port = int(os.environ.get('PORT', 5002))
    print(f"=======================================================")
    print(f" 🚀 3M SERVICES WebApp running on http://127.0.0.1:{port}")
    print(f"=======================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
