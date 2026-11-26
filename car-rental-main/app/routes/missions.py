import json
import os
import random
import uuid
from datetime import datetime, date, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db
from app.models import (
    User, Agency, Bus, Driver, Route, Trip, Booking, Payment,
    AuditLog, SystemNotification, MissionPackage, MissionExpense, MissionIncident
)
from app.utils.security import csrf_protect

missions_bp = Blueprint('missions', __name__)

# 8-stage primary operational lifecycle
MISSION_STAGES = [
    ('draft', 'Brouillon', 'Créée, non soumise'),
    ('pending_approval', 'En validation', 'Attente approbation'),
    ('confirmed', 'Confirmée', 'Mission approuvée'),
    ('assigned', 'Affectée', 'Véhicule & chauffeur'),
    ('ready_for_departure', 'Prête départ', 'Check-list validée'),
    ('in_progress', 'En cours', 'Mission démarrée'),
    ('completed', 'Terminée', 'Retour & dépose'),
    ('closed', 'Clôturée', 'Bilan & facturation'),
]

TERMINAL_STATES = [
    ('cancelled', 'Annulée'),
    ('rejected', 'Rejetée'),
    ('interrupted', 'Interrompue'),
    ('no_show', 'Client Absent (No-show)'),
]

MISSION_CATEGORIES = [
    ('airport_transfer', 'Transfert Aéroport'),
    ('intercity', 'Transport Interurbain'),
    ('city_transport', 'Transport Urbain'),
    ('chauffeur_disposal', 'Chauffeur à Disposition'),
    ('vip_delegation', 'Délégation VIP'),
    ('corporate', 'Transport Corporate'),
    ('event', 'Événementiel'),
    ('long_distance', 'Longue Distance'),
    ('multi_day', 'Mission Multi-Jours'),
    ('custom', 'Mission Sur-Mesure'),
]

MISSION_DOC_TYPES = [
    ('order', 'Ordre de Mission', 'Instructions internes & dispatch', 'fa-file-signature'),
    ('quotation', 'Devis Client VIP', 'Proposition tarifaire détaillée', 'fa-file-invoice'),
    ('confirmation', 'Confirmation Réservation', 'Confirmation officielle client', 'fa-check-double'),
    ('contract', 'Contrat de Service', 'Conditions & obligations 3M', 'fa-handshake'),
    ('invoice', 'Facture Officielle', 'Demande de règlement TTC', 'fa-file-invoice-dollar'),
    ('receipt', 'Reçu de Paiement', 'Justificatif des encaissements', 'fa-receipt'),
    ('driver_sheet', 'Fiche Chauffeur', 'Consignes & feuille de route', 'fa-id-badge'),
    ('inspection', 'Rapport Inspection Véhicule', 'État départ / retour & km', 'fa-clipboard-check'),
    ('completion', 'Rapport de Clôture', 'Synthèse opérationnelle finale', 'fa-flag-checkered'),
    ('incident', 'Rapport d\'Incident', 'Déclaration & suivi incident', 'fa-exclamation-triangle'),
]

PRE_DEPARTURE_ITEMS = [
    ('vehicle_inspected', 'Inspection carrosserie & intérieur validée'),
    ('fuel_checked', 'Niveau carburant vérifié & noté'),
    ('mileage_logged', 'Kilométrage départ relevé'),
    ('photos_taken', 'Photos avant départ archivées'),
    ('driver_confirmed', 'Chauffeur confirmé & briefé'),
    ('passenger_confirmed', 'Client / passagers confirmés'),
    ('documents_ready', 'Documents véhicule & ordre de mission prêts'),
    ('departure_authorized', 'Autorisation de départ Direction 3M'),
]

EXPENSE_CATEGORIES = {
    'fuel': 'Carburant',
    'toll': 'Péages & Routes',
    'parking': 'Parking / Gardiennage',
    'driver_allowance': 'Per diem / Indemnité Chauffeur',
    'accommodation': 'Hébergement Mission',
    'maintenance': 'Entretien / Dépannage',
    'other': 'Autre frais approuvé',
}

INCIDENT_CATEGORIES = {
    'breakdown': 'Panne véhicule',
    'accident': 'Accident',
    'complaint': 'Réclamation client',
    'driver_absence': 'Absence chauffeur',
    'delay': 'Retard départ / trajet',
    'damage': 'Dommage véhicule',
    'lost_property': 'Objet oublié / perdu',
    'other': 'Autre incident',
}

TRIP_EXTRA_COLUMNS = [
    ("mission_ref", "VARCHAR(40)"),
    ("mission_title", "VARCHAR(160)"),
    ("mission_type", "VARCHAR(30) DEFAULT 'vip_rental'"),
    ("mission_category", "VARCHAR(50) DEFAULT 'custom'"),
    ("service_category", "VARCHAR(30) DEFAULT 'VIP'"),
    ("source_booking_id", "INTEGER"),
    ("pickup_location", "VARCHAR(200)"),
    ("destination_location", "VARCHAR(200)"),
    ("intermediate_stops", "TEXT"),
    ("route_instructions", "TEXT"),
    ("passenger_count", "INTEGER DEFAULT 1"),
    ("luggage_info", "VARCHAR(160)"),
    ("special_instructions", "TEXT"),
    ("internal_notes", "TEXT"),
    ("vip_protocol", "VARCHAR(200)"),
    ("contact_person", "VARCHAR(160)"),
    ("extra_vehicle_ids_json", "TEXT"),
    ("secondary_driver_id", "INTEGER"),
    ("extra_driver_ids_json", "TEXT"),
    ("driver_assignment_status", "VARCHAR(30) DEFAULT 'assigned'"),
    ("driver_instructions", "TEXT"),
    ("driver_allowance", "FLOAT DEFAULT 0.0"),
    ("driver_feedback", "TEXT"),
    ("package_id", "INTEGER"),
    ("base_price", "FLOAT DEFAULT 0.0"),
    ("distance_charge", "FLOAT DEFAULT 0.0"),
    ("duration_charge", "FLOAT DEFAULT 0.0"),
    ("waiting_charge", "FLOAT DEFAULT 0.0"),
    ("fuel_surcharge", "FLOAT DEFAULT 0.0"),
    ("toll_parking_charge", "FLOAT DEFAULT 0.0"),
    ("stops_charge", "FLOAT DEFAULT 0.0"),
    ("extras_price", "FLOAT DEFAULT 0.0"),
    ("additional_charges", "FLOAT DEFAULT 0.0"),
    ("discount_amount", "FLOAT DEFAULT 0.0"),
    ("tax_amount", "FLOAT DEFAULT 0.0"),
    ("customer_deposit", "FLOAT DEFAULT 0.0"),
    ("price_snapshot_json", "TEXT"),
    ("pre_departure_checklist_json", "TEXT"),
    ("handover_photos_json", "TEXT"),
    ("mileage_start", "INTEGER"),
    ("mileage_end", "INTEGER"),
    ("fuel_start", "VARCHAR(30)"),
    ("fuel_end", "VARCHAR(30)"),
    ("vehicle_condition", "TEXT"),
    ("actual_departure", "DATETIME"),
    ("actual_arrival", "DATETIME"),
    ("delay_reason", "VARCHAR(255)"),
    ("cancellation_reason", "VARCHAR(255)"),
    ("completion_notes", "TEXT"),
]

PACKAGE_EXTRA_COLUMNS = [
    ("package_ref", "VARCHAR(40)"),
    ("included_hours", "INTEGER DEFAULT 8"),
    ("extra_hour_price", "FLOAT DEFAULT 15000.0"),
    ("waiting_allowance_minutes", "INTEGER DEFAULT 30"),
    ("applicable_routes", "VARCHAR(200)"),
    ("terms_conditions", "TEXT"),
]

ROUTE_EXTRA_COLUMNS = [
    ("route_instructions", "TEXT"),
]


def _migrate_table_columns(table_name, extra_columns):
    existing = {
        row[1] for row in db.session.execute(db.text(f"PRAGMA table_info({table_name})")).fetchall()
    }
    changed = False
    for col_name, col_ddl in extra_columns:
        if col_name not in existing:
            db.session.execute(db.text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_ddl}"))
            changed = True
    if changed:
        db.session.commit()


def ensure_mission_schema():
    """Safely create mission tables, add missing columns to trip/mission_package/route, and seed default Forfaits VIP."""
    try:
        db.create_all()
        _migrate_table_columns("trip", TRIP_EXTRA_COLUMNS)
        _migrate_table_columns("mission_package", PACKAGE_EXTRA_COLUMNS)
        _migrate_table_columns("route", ROUTE_EXTRA_COLUMNS)

        # Seed default Forfaits VIP if empty
        if MissionPackage.query.count() == 0:
            default_agency = Agency.query.filter_by(is_deleted=False).first()
            aid = default_agency.id if default_agency else None
            seed_packages = [
                MissionPackage(
                    package_ref="PKG-AERO-VIP",
                    name="Transfert Aéroport Nsimalen VIP",
                    description="Aller simple • Yaoundé centre vers Aéroport International de Nsimalen. Inclut 1 véhicule VIP, 1 chauffeur professionnel et accueil protocole.",
                    service_category="VIP",
                    pricing_mode="fixed",
                    base_price=75000.0,
                    included_km=50,
                    included_hours=3,
                    extra_km_price=500.0,
                    extra_hour_price=15000.0,
                    waiting_allowance_minutes=45,
                    waiting_hour_price=10000.0,
                    overtime_price=15000.0,
                    fuel_toll_policy="Carburant inclus • Accueil pancarte VIP",
                    applicable_routes="Yaoundé ↔ Aéroport Nsimalen",
                    terms_conditions="Annulation gratuite jusqu'à 12h avant départ. Temps d'attente au-delà de 45 min facturé.",
                    passenger_limit=4,
                    luggage_limit="4 valises grand format",
                    vehicle_categories="SUV 4x4 VIP, Berline Prestige",
                    corporate_price=65000.0,
                    status="active",
                    agency_id=aid,
                ),
                MissionPackage(
                    package_ref="PKG-DAY-VIP",
                    name="Mise à Disposition Chauffeur VIP (Journée)",
                    description="Jusqu'à 8 heures • Déplacements urbains Yaoundé avec chauffeur d'élite dédié, climatisation bi-zone et Wi-Fi à bord.",
                    service_category="VIP",
                    pricing_mode="daily",
                    base_price=150000.0,
                    included_km=120,
                    included_hours=8,
                    extra_km_price=600.0,
                    extra_hour_price=20000.0,
                    waiting_allowance_minutes=60,
                    waiting_hour_price=12000.0,
                    overtime_price=20000.0,
                    fuel_toll_policy="Carburant urbain inclus • Hors-ville en supplément",
                    applicable_routes="Yaoundé & Périphérie",
                    terms_conditions="Heures supplémentaires après 20h00 majorées de 20 000 FCFA/h.",
                    passenger_limit=7,
                    luggage_limit="5 valises",
                    vehicle_categories="Toyota Land Cruiser V8, Prado TXL, Berline VIP",
                    promo_code="VIP3M15",
                    discount_percent=10.0,
                    corporate_price=135000.0,
                    status="active",
                    agency_id=aid,
                ),
                MissionPackage(
                    package_ref="PKG-INTER-VIP",
                    name="Mission Interurbaine VIP (Yaoundé – Douala)",
                    description="Aller simple ou délégation officielle Yaoundé – Douala avec SUV 4x4 prestige et chauffeur longue distance certifié.",
                    service_category="Delegation",
                    pricing_mode="distance",
                    base_price=250000.0,
                    included_km=280,
                    included_hours=10,
                    extra_km_price=750.0,
                    extra_hour_price=25000.0,
                    waiting_allowance_minutes=30,
                    waiting_hour_price=15000.0,
                    overtime_price=25000.0,
                    fuel_toll_policy="Péages inclus • Carburant selon contrat",
                    applicable_routes="Yaoundé – Douala, Yaoundé – Kribi, Yaoundé – Bafoussam",
                    terms_conditions="Per diem chauffeur inclus pour journée simple; hébergement chauffeur à prévoir pour multi-jours.",
                    passenger_limit=7,
                    luggage_limit="6 valises + matériel délégation",
                    vehicle_categories="Land Cruiser V8 LC300, Prado TXL, Hilux 4x4, Minibus VIP",
                    corporate_price=225000.0,
                    status="active",
                    agency_id=aid,
                ),
            ]
            for pkg in seed_packages:
                db.session.add(pkg)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        try:
            current_app.logger.warning(f"[ensure_mission_schema] {e}")
        except Exception:
            pass


def _admin_only():
    return current_user.is_authenticated and current_user.is_staff


def _all_mission_driver_ids(trip):
    ids = set()
    if trip.driver_id:
        ids.add(int(trip.driver_id))
    if trip.secondary_driver_id:
        ids.add(int(trip.secondary_driver_id))
    for did in trip.extra_driver_ids:
        ids.add(int(did))
    return ids


def _all_mission_vehicle_ids(trip):
    ids = set()
    if trip.bus_id:
        ids.add(int(trip.bus_id))
    for vid in trip.extra_vehicle_ids:
        ids.add(int(vid))
    return ids


def check_vehicle_availability(bus_id, start_dt, end_dt, exclude_trip_id=None):
    """Enforce fleet availability rules: maintenance, inactive status, and overlapping missions."""
    bus = Bus.query.filter_by(id=int(bus_id), is_deleted=False).first()
    if not bus:
        return False, "Véhicule introuvable dans la flotte."
    if bus.status == 'maintenance':
        return False, f"Véhicule {bus.bus_number} ({bus.brand} {bus.model}) actuellement en maintenance."
    if bus.status != 'active':
        return False, f"Véhicule {bus.bus_number} inactif ou indisponible ({bus.status})."

    closed_statuses = ['cancelled', 'rejected', 'interrupted', 'no_show', 'completed', 'closed', 'returned', 'archived']
    active_trips = Trip.query.filter(
        Trip.is_deleted == False,
        Trip.status.notin_(closed_statuses),
        Trip.departure_time < end_dt,
        Trip.arrival_time > start_dt,
    ).all()

    for t in active_trips:
        if exclude_trip_id and t.id == int(exclude_trip_id):
            continue
        if bus.id in _all_mission_vehicle_ids(t):
            ref = t.mission_ref or f"#{t.id}"
            return False, (
                f"Conflit véhicule : {bus.bus_number} déjà engagé sur la mission {ref} "
                f"({t.departure_time.strftime('%d/%m %H:%M')} → {t.arrival_time.strftime('%d/%m %H:%M')})."
            )
    return True, None


def check_driver_availability(driver_id, start_dt, end_dt, exclude_trip_id=None):
    """Independent driver availability check: off-duty status, license expiry, overlapping assignments."""
    if not driver_id:
        return True, None, None
    drv = Driver.query.filter_by(id=int(driver_id), is_deleted=False).first()
    if not drv:
        return False, "Chauffeur VIP introuvable.", None
    if (drv.status or '').lower() == 'off_duty':
        return False, f"Chauffeur {drv.name} actuellement en repos (off_duty).", None

    warning = None
    if drv.license_expiration and drv.license_expiration < end_dt.date():
        warning = f"Attention : le permis de {drv.name} ({drv.license_number}) expire le {drv.license_expiration.strftime('%d/%m/%Y')}."

    closed_statuses = ['cancelled', 'rejected', 'interrupted', 'no_show', 'completed', 'closed', 'returned', 'archived']
    active_trips = Trip.query.filter(
        Trip.is_deleted == False,
        Trip.status.notin_(closed_statuses),
        Trip.departure_time < end_dt,
        Trip.arrival_time > start_dt,
    ).all()

    for t in active_trips:
        if exclude_trip_id and t.id == int(exclude_trip_id):
            continue
        if drv.id in _all_mission_driver_ids(t):
            ref = t.mission_ref or f"#{t.id}"
            return False, (
                f"Conflit chauffeur : {drv.name} déjà assigné sur la mission {ref} "
                f"({t.departure_time.strftime('%d/%m %H:%M')} → {t.arrival_time.strftime('%d/%m %H:%M')})."
            ), warning
    return True, None, warning


def _trip_linked_booking(trip):
    """Return the primary booking linked to a mission (either direct child or source_booking_id)."""
    b = trip.bookings.filter_by(is_deleted=False).first()
    if b:
        return b
    if trip.source_booking_id:
        return Booking.query.filter_by(id=trip.source_booking_id, is_deleted=False).first()
    return None


def build_mission_hub_context(filter_val='all'):
    """Aggregate all 10 sections of the 3M Services Fleet Mission Management System."""
    from app.routes.admin import check_due_vehicle_restitutions
    check_due_vehicle_restitutions()

    now_dt = datetime.now()
    today = date.today()

    from app.services.dashboard_kpis import real
    if current_user.role == 'super_admin':
        trips_all = Trip.query.filter_by(is_deleted=False).filter(real(Trip)).order_by(Trip.departure_time.desc()).all()
        buses_all = Bus.query.filter_by(is_deleted=False).order_by(Bus.bus_number).all()
        drivers_all = Driver.query.filter_by(is_deleted=False).order_by(Driver.name).all()
        routes_all = Route.query.filter_by(is_deleted=False).order_by(Route.origin).all()
        agencies_all = Agency.query.filter_by(is_deleted=False).order_by(Agency.name).all()
        b_query = Booking.query.filter_by(is_deleted=False).filter(real(Booking))
    else:
        trips_all = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False, real(Trip)).order_by(Trip.departure_time.desc()).all()
        buses_all = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Bus.bus_number).all()
        drivers_all = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Driver.name).all()
        routes_all = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Route.origin).all()
        agencies_all = Agency.query.filter_by(id=current_user.agency_id, is_deleted=False).all()
        trip_ids_q = db.session.query(Trip.id).join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        b_query = Booking.query.filter(Booking.trip_id.in_(trip_ids_q), Booking.is_deleted == False, real(Booking))

    all_recent_bookings = b_query.order_by(Booking.booking_date.desc().nulls_last()).limit(60).all()

    if filter_val in ['day', 'week', 'month']:
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
        else:
            start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
        end_dt = datetime.combine(today, datetime.max.time())
        b_query = b_query.filter(Booking.booking_date.between(start_dt, end_dt))

    bookings = b_query.order_by(Booking.booking_date.desc().nulls_last()).all()
    clients = User.query.filter_by(is_deleted=False).order_by(User.real_name, User.username).all()
    packages = MissionPackage.query.order_by(MissionPackage.status.asc(), MissionPackage.base_price.asc()).all()
    active_buses = [b for b in buses_all if b.status == 'active']

    # ── Status sets ──
    terminal_set = {'cancelled', 'rejected', 'interrupted', 'no_show'}
    completed_states = {'completed', 'closed', 'returned'}
    in_progress_states = {'departed', 'in_progress', 'boarding', 'arrived'}
    planning_states = {'draft', 'pending_approval', 'scheduled', 'confirmed', 'assigned', 'ready_for_departure'}
    active_states = planning_states | in_progress_states

    total_missions = len(trips_all)
    non_cancelled = [t for t in trips_all if t.status not in terminal_set]

    missions_today = sum(
        1 for t in non_cancelled
        if t.departure_time and t.arrival_time and (t.departure_time.date() <= today <= t.arrival_time.date())
    )
    missions_in_progress = sum(
        1 for t in trips_all
        if t.status in in_progress_states or (
            t.status in planning_states and t.departure_time and t.arrival_time
            and t.departure_time <= now_dt <= t.arrival_time
        )
    )
    missions_upcoming = sum(
        1 for t in trips_all
        if t.status in planning_states and t.departure_time and t.departure_time > now_dt
    )
    missions_completed = sum(1 for t in trips_all if t.status in completed_states)
    missions_cancelled = sum(1 for t in trips_all if t.status in terminal_set)
    missions_awaiting_assignment = sum(
        1 for t in trips_all
        if t.status in planning_states and (not t.bus_id or not t.driver_id)
    )

    engaged_vehicle_ids = set()
    engaged_driver_ids = set()
    for t in trips_all:
        if t.status in active_states and (t.status in in_progress_states or (t.departure_time and t.arrival_time and t.departure_time <= now_dt <= t.arrival_time)):
            engaged_vehicle_ids |= _all_mission_vehicle_ids(t)
            engaged_driver_ids |= _all_mission_driver_ids(t)

    vehicles_on_mission = len(engaged_vehicle_ids)
    drivers_assigned = len(engaged_driver_ids)

    missions_revenue = sum(float(t.price or 0.0) for t in non_cancelled)
    total_mission_expenses = sum(float(t.total_expenses_amount or 0.0) for t in non_cancelled)
    net_mission_margin = missions_revenue - total_mission_expenses
    avg_mission_value = (missions_revenue / len(non_cancelled)) if non_cancelled else 0.0

    # Utilization & Performance Rates
    active_fleet_count = len(active_buses)
    vehicle_utilization_pct = round((vehicles_on_mission / active_fleet_count) * 100, 1) if active_fleet_count else 0.0
    available_drivers_count = sum(1 for d in drivers_all if (d.status or 'available').lower() != 'off_duty')
    driver_utilization_pct = round((drivers_assigned / available_drivers_count) * 100, 1) if available_drivers_count else 0.0
    cancellation_rate_pct = round((missions_cancelled / total_missions) * 100, 1) if total_missions else 0.0

    departed_with_actual = [t for t in trips_all if t.actual_departure and t.departure_time]
    if departed_with_actual:
        on_time = sum(1 for t in departed_with_actual if t.actual_departure <= t.departure_time + timedelta(minutes=15))
        on_time_rate_pct = round((on_time / len(departed_with_actual)) * 100, 1)
    else:
        on_time_rate_pct = 100.0 if total_missions else 0.0

    # Outstanding mission payments
    outstanding_payments = 0.0
    for t in non_cancelled:
        bk = _trip_linked_booking(t)
        if bk:
            paid = sum(float(p.amount or 0.0) for p in Payment.query.filter_by(booking_id=bk.id, status='completed').all())
            if paid == 0 and bk.payment_status == 'paid':
                paid = float(bk.price_paid or t.price or 0.0)
            outstanding_payments += max(0.0, float(t.price or 0.0) - paid)
        else:
            outstanding_payments += float(t.price or 0.0)

    kpis = {
        'total_missions': total_missions,
        'missions_today': missions_today,
        'missions_in_progress': missions_in_progress,
        'missions_upcoming': missions_upcoming,
        'missions_completed': missions_completed,
        'missions_cancelled': missions_cancelled,
        'missions_awaiting_assignment': missions_awaiting_assignment,
        'vehicles_on_mission': vehicles_on_mission,
        'drivers_assigned': drivers_assigned,
        'missions_revenue': missions_revenue,
        'total_mission_expenses': total_mission_expenses,
        'net_mission_margin': net_mission_margin,
        'avg_mission_value': avg_mission_value,
        'vehicle_utilization_pct': vehicle_utilization_pct,
        'driver_utilization_pct': driver_utilization_pct,
        'cancellation_rate_pct': cancellation_rate_pct,
        'on_time_rate_pct': on_time_rate_pct,
        'outstanding_payments': outstanding_payments,
    }

    # ── 7 Operational Alerts ──
    alerts = []
    no_vehicle = [t for t in trips_all if t.status in active_states and not t.bus_id]
    no_driver = [t for t in trips_all if t.status in active_states and not t.driver_id]
    delayed_departures = [
        t for t in trips_all
        if t.status in planning_states and t.departure_time and t.departure_time < now_dt and not t.actual_departure
    ]
    overdue_returns = [
        t for t in trips_all
        if t.status in active_states and t.arrival_time and t.arrival_time < now_dt
    ]
    unconfirmed = [t for t in trips_all if t.status in {'draft', 'pending_approval', 'scheduled'}]

    active_list = [t for t in trips_all if t.status in active_states]
    veh_overlaps = 0
    drv_overlaps = 0
    for i in range(len(active_list)):
        for j in range(i + 1, len(active_list)):
            a, b_t = active_list[i], active_list[j]
            if a.departure_time < b_t.arrival_time and a.arrival_time > b_t.departure_time:
                if _all_mission_vehicle_ids(a) & _all_mission_vehicle_ids(b_t):
                    veh_overlaps += 1
                if _all_mission_driver_ids(a) & _all_mission_driver_ids(b_t):
                    drv_overlaps += 1

    if no_vehicle:
        alerts.append({'severity': 'danger', 'icon': 'bi-car-front', 'title': 'Missions sans véhicule assigné', 'count': len(no_vehicle), 'detail': f"{len(no_vehicle)} mission(s) active(s) attendent un véhicule."})
    if no_driver:
        alerts.append({'severity': 'warning', 'icon': 'bi-person-badge', 'title': 'Missions sans chauffeur VIP', 'count': len(no_driver), 'detail': f"{len(no_driver)} mission(s) sans chauffeur assigné."})
    if veh_overlaps:
        alerts.append({'severity': 'danger', 'icon': 'bi-exclamation-octagon', 'title': 'Chevauchement de véhicules', 'count': veh_overlaps, 'detail': f"{veh_overlaps} conflit(s) horaire(s) sur la flotte."})
    if drv_overlaps:
        alerts.append({'severity': 'danger', 'icon': 'bi-people-fill', 'title': 'Chevauchement de chauffeurs', 'count': drv_overlaps, 'detail': f"{drv_overlaps} conflit(s) d'affectation chauffeur."})
    if overdue_returns:
        alerts.append({'severity': 'danger', 'icon': 'bi-bell-fill', 'title': 'Restitutions en retard', 'count': len(overdue_returns), 'detail': f"{len(overdue_returns)} véhicule(s) dépassent leur heure de retour."})
    if delayed_departures:
        alerts.append({'severity': 'warning', 'icon': 'bi-clock-history', 'title': 'Départs non démarrés / retardés', 'count': len(delayed_departures), 'detail': f"{len(delayed_departures)} mission(s) dépassent l'heure de départ."})
    if unconfirmed:
        alerts.append({'severity': 'info', 'icon': 'bi-hourglass-split', 'title': 'Missions à valider / confirmer', 'count': len(unconfirmed), 'detail': f"{len(unconfirmed)} mission(s) en attente de validation."})

    # ── Fleet & Drivers Assignment Matrices ──
    vehicle_status_rows = []
    for bus in buses_all:
        current_trip = next((t for t in active_list if bus.id in _all_mission_vehicle_ids(t)), None)
        trip_count = sum(1 for t in non_cancelled if bus.id in _all_mission_vehicle_ids(t))
        rev = sum(float(t.price or 0.0) for t in non_cancelled if t.bus_id == bus.id)
        last_mileage = next((t.mileage_end or t.mileage_start for t in trips_all if t.bus_id == bus.id and (t.mileage_end or t.mileage_start)), None)
        vehicle_status_rows.append({
            'bus': bus,
            'current_trip': current_trip,
            'trip_count': trip_count,
            'revenue': rev,
            'last_mileage': last_mileage,
            'available': (bus.status == 'active' and bus.id not in engaged_vehicle_ids),
        })

    driver_status_rows = []
    for drv in drivers_all:
        current_trip = next((t for t in active_list if drv.id in _all_mission_driver_ids(t)), None)
        drv_trips = [t for t in non_cancelled if drv.id in _all_mission_driver_ids(t)]
        total_hours = sum(
            max(0.0, (t.arrival_time - t.departure_time).total_seconds() / 3600.0)
            for t in drv_trips if t.departure_time and t.arrival_time
        )
        total_allowances = sum(float(t.driver_allowance or 0.0) for t in drv_trips if t.driver_id == drv.id)
        license_expired = bool(drv.license_expiration and drv.license_expiration < today)
        driver_status_rows.append({
            'driver': drv,
            'current_trip': current_trip,
            'trip_count': len(drv_trips),
            'total_hours': round(total_hours, 1),
            'total_allowances': total_allowances,
            'license_expired': license_expired,
            'available': ((drv.status or 'available').lower() != 'off_duty' and drv.id not in engaged_driver_ids),
        })

    # ── Analytics: Routes, Packages, Categories & History ──
    route_perf = []
    for r in routes_all:
        r_trips = [t for t in non_cancelled if t.route_id == r.id]
        route_perf.append({
            'route': r,
            'count': len(r_trips),
            'revenue': sum(float(t.price or 0.0) for t in r_trips),
        })
    route_perf.sort(key=lambda x: x['count'], reverse=True)

    package_perf = []
    for p in packages:
        p_trips = [t for t in non_cancelled if t.package_id == p.id]
        package_perf.append({
            'package': p,
            'count': len(p_trips),
            'revenue': sum(float(t.price or 0.0) for t in p_trips),
        })

    cat_map = dict(MISSION_CATEGORIES)
    category_breakdown = []
    for c_key, c_lbl in MISSION_CATEGORIES:
        cnt = sum(1 for t in non_cancelled if (t.mission_category or 'custom') == c_key)
        if cnt > 0:
            category_breakdown.append({'key': c_key, 'label': c_lbl, 'count': cnt})
    category_breakdown.sort(key=lambda x: x['count'], reverse=True)

    tracking_trips = [t for t in trips_all if t.status in active_states]
    tracking_items = []
    op_counts = {'all': 0, 'departures': 0, 'in_progress': 0, 'returns': 0}
    for t in tracking_trips:
        bk = _trip_linked_booking(t)
        client_name = (
            (bk.passenger_name if bk and bk.passenger_name else None)
            or ((bk.user.real_name or bk.user.username) if bk and bk.user else None)
            or 'Client VIP 3M'
        )
        ref = t.mission_ref or (bk.booking_code if bk and bk.booking_code else None) or f"#{t.id}"
        origin = t.pickup_location or (t.route.origin if t.route else 'Yaoundé')
        dest = t.destination_location or (t.route.destination if t.route else 'À définir')
        route_label = f"{origin} → {dest}" if dest and dest != origin else origin
        is_overdue = bool(t.status in in_progress_states and t.arrival_time and t.arrival_time < now_dt)

        if t.status in planning_states:
            op_bucket = 'departures'
            op_action = 'departure'
            op_action_label = 'Préparer le départ'
            op_status_label = 'Prêt au départ' if t.status == 'ready_for_departure' else 'À préparer'
            op_status_tone = 'info' if t.status == 'ready_for_departure' else 'warn'
        elif t.arrival_time and t.arrival_time <= now_dt + timedelta(hours=24):
            op_bucket = 'returns'
            op_action = 'return'
            op_action_label = 'Enregistrer le retour'
            op_status_label = 'Retour en retard' if is_overdue else 'Retour attendu'
            op_status_tone = 'danger' if is_overdue else 'warn'
        else:
            op_bucket = 'in_progress'
            op_action = 'track'
            op_action_label = 'Suivre la location'
            op_status_label = 'En cours'
            op_status_tone = 'ok'

        op_counts['all'] += 1
        op_counts[op_bucket] += 1
        tracking_items.append({
            'trip': t,
            'ref': ref,
            'booking_code': bk.booking_code if bk else None,
            'client_name': client_name,
            'vehicle_name': f"{t.bus.brand or ''} {t.bus.model}".strip() if t.bus else 'Véhicule à assigner',
            'vehicle_plate': t.bus.bus_number if t.bus else '',
            'driver_name': t.driver.name if t.driver else None,
            'route_label': route_label,
            'op_bucket': op_bucket,
            'op_action': op_action,
            'op_action_label': op_action_label,
            'op_status_label': op_status_label,
            'op_status_tone': op_status_tone,
            'is_overdue': is_overdue,
        })

    op_filter = request.args.get('op_filter', 'all')
    if op_filter not in ('all', 'departures', 'in_progress', 'returns'):
        op_filter = 'all'

    history_trips = [t for t in trips_all if t.status in (completed_states | terminal_set)]
    open_incidents_count = MissionIncident.query.filter(MissionIncident.status != 'resolved').count()

    return {
        'bookings': bookings,
        'convertible_bookings': all_recent_bookings,
        'trips_all': trips_all,
        'tracking_trips': tracking_trips,
        'tracking_items': tracking_items,
        'op_counts': op_counts,
        'op_filter': op_filter,
        'history_trips': history_trips,
        'current_filter': filter_val,
        'routes': routes_all,
        'agencies': agencies_all,
        'buses': active_buses,
        'all_buses': buses_all,
        'drivers': drivers_all,
        'clients': clients,
        'packages': packages,
        'kpis': kpis,
        'alerts': alerts,
        'vehicle_status_rows': vehicle_status_rows,
        'driver_status_rows': driver_status_rows,
        'route_perf': route_perf,
        'package_perf': package_perf,
        'category_breakdown': category_breakdown,
        'open_incidents_count': open_incidents_count,
        'mission_stages': MISSION_STAGES,
        'terminal_states': TERMINAL_STATES,
        'mission_categories': MISSION_CATEGORIES,
        'mission_category_map': cat_map,
        'mission_doc_types': MISSION_DOC_TYPES,
        'pre_departure_items': PRE_DEPARTURE_ITEMS,
        'now': now_dt,
    }


@missions_bp.route('/admin/missions')
@login_required
def missions_hub():
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))
    filter_val = request.args.get('filter', 'all')
    active_tab = request.args.get('tab', 'overview')
    ctx = build_mission_hub_context(filter_val=filter_val)
    ctx['active_tab'] = active_tab
    return render_template('admin/bookings.html', **ctx)


# ── PLANNING CALENDAR EVENTS & DRAG-DROP RESCHEDULE API ──
@missions_bp.route('/admin/missions/api/events')
@login_required
def missions_calendar_events():
    if not _admin_only():
        return jsonify([]), 403

    bus_id = request.args.get('bus_id', type=int)
    driver_id = request.args.get('driver_id', type=int)
    agency_id = request.args.get('agency_id', type=int)
    status_filter = (request.args.get('status') or '').strip()

    q = Trip.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin':
        q = q.join(Route).filter(Route.agency_id == current_user.agency_id)
    elif agency_id:
        q = q.join(Route).filter(Route.agency_id == agency_id)

    trips = q.all()
    color_map = {
        'draft': '#64748b',
        'pending_approval': '#f59e0b',
        'scheduled': '#2563eb',
        'confirmed': '#10b981',
        'assigned': '#0ea5e9',
        'ready_for_departure': '#0891b2',
        'departed': '#D62828',
        'in_progress': '#D62828',
        'arrived': '#7c3aed',
        'returned': '#15803d',
        'completed': '#1e293b',
        'closed': '#0f172a',
        'cancelled': '#9ca3af',
        'rejected': '#ef4444',
        'interrupted': '#ea580c',
        'no_show': '#6b7280',
    }

    events = []
    for t in trips:
        if bus_id and bus_id not in _all_mission_vehicle_ids(t):
            continue
        if driver_id and driver_id not in _all_mission_driver_ids(t):
            continue
        if status_filter and t.status != status_filter:
            continue
        if not t.departure_time or not t.arrival_time:
            continue

        car_lbl = f"{t.bus.brand} {t.bus.model} ({t.bus.bus_number})" if t.bus else "Sans véhicule"
        drv_lbl = t.driver.name if t.driver else "Sans chauffeur"
        title = f"{t.mission_ref or '#' + str(t.id)} · {car_lbl} · {drv_lbl}"
        events.append({
            'id': t.id,
            'title': title,
            'start': t.departure_time.isoformat(),
            'end': t.arrival_time.isoformat(),
            'backgroundColor': color_map.get(t.status, '#D62828'),
            'borderColor': color_map.get(t.status, '#D62828'),
            'url': url_for('missions.mission_detail', id=t.id),
            'extendedProps': {
                'mission_ref': t.mission_ref or f"#{t.id}",
                'mission_title': t.mission_title or '',
                'status': t.status,
                'vehicle': car_lbl,
                'driver': drv_lbl,
                'price': float(t.price or 0.0),
            }
        })
    return jsonify(events)


@missions_bp.route('/admin/missions/api/reschedule', methods=['POST'])
@login_required
def missions_calendar_reschedule():
    if not _admin_only():
        return jsonify({'ok': False, 'error': 'Accès non autorisé.'}), 403

    from app.routes.admin import log_audit
    data = request.get_json(silent=True) or {}
    trip_id = data.get('id')
    start_str = (data.get('start') or '').replace('Z', '')[:19]
    end_str = (data.get('end') or '').replace('Z', '')[:19]

    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first()
    if not trip:
        return jsonify({'ok': False, 'error': 'Mission introuvable.'}), 404

    try:
        new_start = datetime.fromisoformat(start_str)
        new_end = datetime.fromisoformat(end_str) if end_str else (new_start + (trip.arrival_time - trip.departure_time))
    except Exception:
        return jsonify({'ok': False, 'error': 'Dates de replanification invalides.'}), 400

    if new_end <= new_start:
        return jsonify({'ok': False, 'error': 'La restitution doit être après le départ.'}), 400

    for vid in _all_mission_vehicle_ids(trip):
        ok, err = check_vehicle_availability(vid, new_start, new_end, exclude_trip_id=trip.id)
        if not ok:
            return jsonify({'ok': False, 'error': err}), 409

    for did in _all_mission_driver_ids(trip):
        ok, err, _ = check_driver_availability(did, new_start, new_end, exclude_trip_id=trip.id)
        if not ok:
            return jsonify({'ok': False, 'error': err}), 409

    trip.departure_time = new_start
    trip.arrival_time = new_end
    db.session.commit()
    log_audit("MISSION_RESCHEDULED", "Trip", trip.id, f"Replanifiée par glisser-déposer : {new_start.strftime('%d/%m %H:%M')} → {new_end.strftime('%d/%m %H:%M')}")
    return jsonify({'ok': True, 'message': 'Mission replanifiée sans conflit.'})


@missions_bp.route('/admin/missions/create', methods=['POST'])
@login_required
def create_mission():
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import _upsert_visitor_user, log_audit, trigger_notification, check_due_vehicle_restitutions

    route_id = request.form.get('route_id', type=int)
    bus_id = request.form.get('bus_id', type=int)
    extra_bus_ids = [int(x) for x in request.form.getlist('extra_vehicle_ids') if str(x).isdigit() and int(x) != bus_id]
    driver_id = request.form.get('driver_id', type=int)
    secondary_driver_id = request.form.get('secondary_driver_id', type=int)
    extra_driver_ids = [
        int(x) for x in request.form.getlist('extra_driver_ids')
        if str(x).isdigit() and int(x) not in (driver_id, secondary_driver_id)
    ]
    package_id = request.form.get('package_id', type=int)
    source_booking_id = request.form.get('source_booking_id', type=int)

    dep_str = (request.form.get('departure_time') or '').strip()
    arr_str = (request.form.get('arrival_time') or '').strip()

    if not all([route_id, bus_id, dep_str, arr_str]):
        flash("Veuillez sélectionner la mission/trajet, le véhicule VIP et les dates de sortie/restitution.", "danger")
        return redirect(url_for('admin.bookings', tab='missions'))

    try:
        dep_dt = datetime.strptime(dep_str[:16], '%Y-%m-%dT%H:%M')
        arr_dt = datetime.strptime(arr_str[:16], '%Y-%m-%dT%H:%M')
    except ValueError:
        flash("Format de date invalide.", "danger")
        return redirect(url_for('admin.bookings', tab='missions'))

    if arr_dt <= dep_dt:
        flash("La date de restitution doit être postérieure à la date de départ.", "danger")
        return redirect(url_for('admin.bookings', tab='missions'))

    # Business Rule: Check primary & convoy vehicle availability
    for vid in [bus_id] + extra_bus_ids:
        ok, err = check_vehicle_availability(vid, dep_dt, arr_dt)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab='missions'))

    # Business Rule: Check primary, secondary & convoy driver availability independently
    all_drvs = [d for d in [driver_id, secondary_driver_id] + extra_driver_ids if d]
    for did in all_drvs:
        ok, err, warn = check_driver_availability(did, dep_dt, arr_dt)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab='missions'))
        if warn:
            flash(warn, "warning")

    # Full Pricing Engine (separate customer quotation from internal costs)
    pkg = MissionPackage.query.get(package_id) if package_id else None
    base_price = request.form.get('base_price', type=float)
    if base_price is None:
        base_price = request.form.get('price', type=float) or (pkg.base_price if pkg else 100000.0)
    distance_charge = request.form.get('distance_charge', 0.0, type=float) or 0.0
    duration_charge = request.form.get('duration_charge', 0.0, type=float) or 0.0
    waiting_charge = request.form.get('waiting_charge', 0.0, type=float) or 0.0
    fuel_surcharge = request.form.get('fuel_surcharge', 0.0, type=float) or 0.0
    toll_parking_charge = request.form.get('toll_parking_charge', 0.0, type=float) or 0.0
    stops_charge = request.form.get('stops_charge', 0.0, type=float) or 0.0
    extras_price = request.form.get('extras_price', 0.0, type=float) or 0.0
    additional_charges = request.form.get('additional_charges', 0.0, type=float) or 0.0
    discount_amount = request.form.get('discount_amount', 0.0, type=float) or 0.0
    tax_amount = request.form.get('tax_amount', 0.0, type=float) or 0.0
    customer_deposit = request.form.get('customer_deposit', 0.0, type=float) or 0.0

    total_price = max(
        0.0,
        float(base_price) + float(distance_charge) + float(duration_charge) + float(waiting_charge)
        + float(fuel_surcharge) + float(toll_parking_charge) + float(stops_charge)
        + float(extras_price) + float(additional_charges) + float(tax_amount) - float(discount_amount)
    )

    snapshot = {
        'package_id': pkg.id if pkg else None,
        'package_ref': pkg.package_ref if pkg else None,
        'package_name': pkg.name if pkg else None,
        'base_price': base_price,
        'distance_charge': distance_charge,
        'duration_charge': duration_charge,
        'waiting_charge': waiting_charge,
        'fuel_surcharge': fuel_surcharge,
        'toll_parking_charge': toll_parking_charge,
        'stops_charge': stops_charge,
        'extras_price': extras_price,
        'additional_charges': additional_charges,
        'discount_amount': discount_amount,
        'tax_amount': tax_amount,
        'total_price': total_price,
        'frozen_at': datetime.utcnow().isoformat() + 'Z',
    }

    mission_ref = f"3M-MIS-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"
    route = Route.query.get(route_id)
    mission_title = (request.form.get('mission_title') or '').strip() or (
        pkg.name if pkg else (f"{route.origin} → {route.destination}" if route else "Mission VIP 3M")
    )
    pickup_loc = (request.form.get('pickup_location') or '').strip() or (route.origin if route else "Yaoundé")
    dest_loc = (request.form.get('destination_location') or '').strip() or (route.destination if route else "Destination VIP")
    initial_status = (request.form.get('status') or ('assigned' if driver_id else 'confirmed')).strip()

    trip = Trip(
        route_id=route_id,
        bus_id=bus_id,
        driver_id=driver_id or None,
        secondary_driver_id=secondary_driver_id if (secondary_driver_id and secondary_driver_id != driver_id) else None,
        departure_time=dep_dt,
        arrival_time=arr_dt,
        price=total_price,
        capacity=request.form.get('capacity', 0, type=int) or 0,
        booking_cutoff_minutes=request.form.get('booking_cutoff_minutes', 30, type=int) or 30,
        status=initial_status,
        mission_ref=mission_ref,
        mission_title=mission_title,
        mission_type=(request.form.get('mission_type') or 'vip_rental').strip(),
        mission_category=(request.form.get('mission_category') or 'custom').strip(),
        service_category=(request.form.get('service_category') or (pkg.service_category if pkg else 'VIP')).strip(),
        source_booking_id=source_booking_id or None,
        pickup_location=pickup_loc,
        destination_location=dest_loc,
        intermediate_stops=(request.form.get('intermediate_stops') or (route.stops if route else '') or '').strip(),
        route_instructions=(request.form.get('route_instructions') or (route.route_instructions if route else '') or '').strip(),
        passenger_count=request.form.get('passenger_count', 1, type=int) or 1,
        luggage_info=(request.form.get('luggage_info') or '').strip(),
        special_instructions=(request.form.get('special_instructions') or '').strip(),
        internal_notes=(request.form.get('internal_notes') or '').strip(),
        vip_protocol=(request.form.get('vip_protocol') or '').strip(),
        contact_person=(request.form.get('contact_person') or '').strip(),
        package_id=pkg.id if pkg else None,
        base_price=base_price,
        distance_charge=distance_charge,
        duration_charge=duration_charge,
        waiting_charge=waiting_charge,
        fuel_surcharge=fuel_surcharge,
        toll_parking_charge=toll_parking_charge,
        stops_charge=stops_charge,
        extras_price=extras_price,
        additional_charges=additional_charges,
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        customer_deposit=customer_deposit,
        price_snapshot_json=json.dumps(snapshot, ensure_ascii=False),
        driver_assignment_status='assigned' if driver_id else 'pending',
        driver_instructions=(request.form.get('driver_instructions') or '').strip(),
        driver_allowance=request.form.get('driver_allowance', 0.0, type=float) or 0.0,
    )
    if extra_bus_ids:
        trip.extra_vehicle_ids = extra_bus_ids
    if extra_driver_ids:
        trip.extra_driver_ids = extra_driver_ids

    db.session.add(trip)
    db.session.flush()

    # If converted from an existing reservation without duplicating booking/invoice, link directly
    linked_source = Booking.query.get(source_booking_id) if source_booking_id else None
    if linked_source:
        final_client = linked_source.passenger_name or "Client VIP 3M"
    else:
        client_user_id = request.form.get('client_user_id', type=int)
        client_name = (request.form.get('client_name') or '').strip()
        client_phone = (request.form.get('client_phone') or '').strip()
        client_email = (request.form.get('client_email') or '').strip()
        formula = (request.form.get('formula') or (pkg.name if pkg else 'Chauffeur VIP Inclus')).strip()
        payment_method = (request.form.get('payment_method') or 'momo').strip()
        payment_status = (request.form.get('payment_status') or ('pending' if payment_method == 'pending' else 'paid')).strip()

        client_user = User.query.get(client_user_id) if client_user_id else None
        if not client_user and (client_name or client_phone or client_email):
            client_user = _upsert_visitor_user(client_name, client_phone, pickup_loc, 'Yaoundé', client_email)

        if client_user and not client_name:
            client_name = client_user.real_name or client_user.username
        if client_user and not client_phone and client_user.phone:
            client_phone = client_user.phone

        target_user = client_user or User.query.filter_by(role='client', is_deleted=False).first() or current_user
        final_client = client_name or (target_user.real_name or target_user.username if target_user else "Client VIP 3M")

        booking = Booking(
            user_id=target_user.id,
            trip_id=trip.id,
            seat_number="VIP-CAR",
            passenger_category=formula[:50],
            passenger_name=final_client,
            booking_code=mission_ref,
            price_paid=total_price,
            status="confirmed" if initial_status != 'cancelled' else 'cancelled',
            payment_status=payment_status,
            payment_method=payment_method,
            booking_date=datetime.utcnow(),
            return_date=arr_dt,
            num_persons=trip.passenger_count or 1,
            special_instructions=client_phone or "",
        )
        db.session.add(booking)
        db.session.flush()

        # Record full payment or deposit into central Payment ledger
        initial_pay_amount = total_price if payment_status == 'paid' else (customer_deposit if customer_deposit > 0 else 0.0)
        if initial_pay_amount > 0:
            pay = Payment(
                booking_id=booking.id,
                amount=initial_pay_amount,
                status='completed',
                payment_method=payment_method,
                transaction_id=f"PAY-{mission_ref}",
            )
            db.session.add(pay)

    trip.occupied_seats = 1
    db.session.commit()

    log_audit("MISSION_CREATED", "Trip", trip.id, f"Mission VIP {mission_ref} ({mission_title}) créée pour {final_client} — {total_price:.0f} FCFA")

    if request.form.get('notify_restitution', 'on') == 'on':
        bus_obj = Bus.query.get(bus_id)
        car_label = f"{bus_obj.brand} {bus_obj.model} ({bus_obj.bus_number})" if bus_obj else "Véhicule VIP"
        trigger_notification(
            title=f"🚗 Mission VIP {mission_ref} : {car_label}",
            message=f"Client : {final_client}\nMission : {mission_title}\nSortie : {dep_dt.strftime('%d/%m/%Y %H:%M')}\nRestitution : {arr_dt.strftime('%d/%m/%Y %H:%M')}\nTarif : {total_price:,.0f} FCFA",
            type="info", category="operations", role_target="super_admin"
        )
        check_due_vehicle_restitutions()

    flash(f"Mission VIP {mission_ref} créée avec succès ({total_price:,.0f} FCFA) !", "success")
    return redirect(url_for('missions.mission_detail', id=trip.id))


# ── RESERVATION-TO-MISSION CONVERSION (1 Reservation -> 1 or Multiple Missions, no duplicate invoice) ──
@missions_bp.route('/admin/missions/convert-booking', methods=['POST'])
@login_required
def convert_booking_to_mission():
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit, trigger_notification

    booking_id = request.form.get('booking_id', type=int)
    bus_id = request.form.get('bus_id', type=int)
    extra_bus_ids = [int(x) for x in request.form.getlist('extra_vehicle_ids') if str(x).isdigit() and int(x) != bus_id]
    driver_id = request.form.get('driver_id', type=int)
    mission_category = (request.form.get('mission_category') or 'vip_delegation').strip()
    dep_str = (request.form.get('departure_time') or '').strip()
    arr_str = (request.form.get('arrival_time') or '').strip()

    booking = Booking.query.filter_by(id=booking_id, is_deleted=False).first()
    if not booking or not bus_id:
        flash("Veuillez sélectionner une réservation client existante et un véhicule VIP disponible.", "danger")
        return redirect(url_for('admin.bookings', tab='missions'))

    orig_trip = booking.trip
    route_id = request.form.get('route_id', type=int) or (orig_trip.route_id if orig_trip else None)
    if not route_id:
        r_first = Route.query.filter_by(is_deleted=False).first()
        route_id = r_first.id if r_first else None

    try:
        dep_dt = datetime.strptime(dep_str[:16], '%Y-%m-%dT%H:%M') if dep_str else (orig_trip.departure_time if orig_trip else datetime.now() + timedelta(hours=2))
        arr_dt = datetime.strptime(arr_str[:16], '%Y-%m-%dT%H:%M') if arr_str else (booking.return_date or (orig_trip.arrival_time if orig_trip else dep_dt + timedelta(hours=8)))
    except ValueError:
        flash("Format de date invalide.", "danger")
        return redirect(url_for('admin.bookings', tab='missions'))

    if arr_dt <= dep_dt:
        arr_dt = dep_dt + timedelta(hours=6)

    for vid in [bus_id] + extra_bus_ids:
        ok, err = check_vehicle_availability(vid, dep_dt, arr_dt)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab='missions'))

    if driver_id:
        ok, err, warn = check_driver_availability(driver_id, dep_dt, arr_dt)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab='missions'))
        if warn:
            flash(warn, "warning")

    mission_ref = f"3M-CONV-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"
    route = Route.query.get(route_id)
    title = (request.form.get('mission_title') or '').strip() or f"Mission {booking.booking_code} — {booking.passenger_name}"

    trip = Trip(
        route_id=route_id,
        bus_id=bus_id,
        driver_id=driver_id or None,
        departure_time=dep_dt,
        arrival_time=arr_dt,
        price=float(booking.price_paid or (orig_trip.price if orig_trip else 0.0)),
        base_price=float(booking.price_paid or (orig_trip.price if orig_trip else 0.0)),
        capacity=1,
        occupied_seats=1,
        status='assigned' if driver_id else 'confirmed',
        mission_ref=mission_ref,
        mission_title=title,
        mission_type='vip_rental',
        mission_category=mission_category,
        service_category='VIP',
        source_booking_id=booking.id,
        pickup_location=route.origin if route else 'Yaoundé',
        destination_location=route.destination if route else 'Destination VIP',
        passenger_count=booking.num_persons or 1,
        special_instructions=booking.special_instructions or '',
        driver_assignment_status='assigned' if driver_id else 'pending',
        price_snapshot_json=json.dumps({
            'source_booking_code': booking.booking_code,
            'base_price': float(booking.price_paid or 0.0),
            'total_price': float(booking.price_paid or 0.0),
            'frozen_at': datetime.utcnow().isoformat() + 'Z',
        }),
    )
    if extra_bus_ids:
        trip.extra_vehicle_ids = extra_bus_ids

    db.session.add(trip)
    db.session.commit()

    log_audit("BOOKING_CONVERTED_TO_MISSION", "Trip", trip.id, f"Réservation {booking.booking_code} ({booking.passenger_name}) convertie en mission {mission_ref} sans dupliquer la facture")
    trigger_notification(
        title=f"🔄 Réservation {booking.booking_code} → Mission {mission_ref}",
        message=f"Client : {booking.passenger_name}\nDépart : {dep_dt.strftime('%d/%m/%Y %H:%M')}\nVéhicule & équipage liés au contrat existant.",
        type="success", category="operations", role_target="super_admin"
    )
    flash(f"Réservation {booking.booking_code} convertie en Mission VIP {mission_ref} (sans duplication de facture) !", "success")
    return redirect(url_for('missions.mission_detail', id=trip.id))


# ── SAVED ROUTES CRUD (Tab: Routes & Destinations) ──
@missions_bp.route('/admin/missions/routes/save', methods=['POST'])
@login_required
def save_mission_route():
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit

    route_id = request.form.get('route_id', type=int)
    origin = (request.form.get('origin') or '').strip()
    destination = (request.form.get('destination') or '').strip()
    if not origin or not destination:
        flash("Origine et destination sont obligatoires.", "danger")
        return redirect(url_for('admin.bookings', tab='routes'))

    default_agency = Agency.query.filter_by(is_deleted=False).first()
    agency_id = request.form.get('agency_id', type=int) or current_user.agency_id or (default_agency.id if default_agency else 1)

    r = Route.query.get(route_id) if route_id else Route(agency_id=agency_id)
    r.origin = origin
    r.destination = destination
    r.distance = request.form.get('distance', type=float)
    r.duration = (request.form.get('duration') or '').strip()
    r.base_price = request.form.get('base_price', type=float)
    r.stops = (request.form.get('stops') or '').strip()
    r.route_instructions = (request.form.get('route_instructions') or '').strip()
    if current_user.role == 'super_admin' and request.form.get('agency_id', type=int):
        r.agency_id = request.form.get('agency_id', type=int)

    if not route_id:
        db.session.add(r)
    db.session.commit()
    log_audit("ROUTE_SAVED", "Route", r.id, f"Itinéraire VIP enregistré : {r.origin} → {r.destination} ({r.distance or 0} km)")
    flash(f"Itinéraire « {r.origin} → {r.destination} » enregistré !", "success")
    return redirect(url_for('admin.bookings', tab='routes'))


@missions_bp.route('/admin/missions/routes/<int:route_id>/delete', methods=['POST'])
@login_required
def delete_mission_route(route_id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    r = Route.query.filter_by(id=route_id, is_deleted=False).first_or_404()
    r.is_deleted = True
    r.deleted_at = datetime.utcnow()
    db.session.commit()
    flash(f"Itinéraire « {r.origin} → {r.destination} » archivé.", "info")
    return redirect(url_for('admin.bookings', tab='routes'))


# ── QUICK RESOURCE ASSIGN FROM FLOTTE / CHAUFFEURS TABS ──
@missions_bp.route('/admin/mission/<int:id>/quick-assign', methods=['POST'])
@login_required
def quick_assign_resource(id):
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    back_tab = request.form.get('back_tab') or 'fleet'
    bus_id = request.form.get('bus_id', type=int)
    driver_id = request.form.get('driver_id', type=int)

    if bus_id:
        ok, err = check_vehicle_availability(bus_id, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab=back_tab))
        trip.bus_id = bus_id

    if driver_id:
        ok, err, warn = check_driver_availability(driver_id, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('admin.bookings', tab=back_tab))
        if warn:
            flash(warn, "warning")
        trip.driver_id = driver_id
        trip.driver_assignment_status = 'assigned'

    if trip.bus_id and trip.driver_id and trip.status in ('draft', 'pending_approval', 'scheduled', 'confirmed'):
        trip.status = 'assigned'

    db.session.commit()
    log_audit("MISSION_QUICK_ASSIGNED", "Trip", trip.id, f"Affectation rapide: Véhicule #{trip.bus_id}, Chauffeur #{trip.driver_id}")
    flash(f"Affectation mise à jour sur la mission {trip.mission_ref or '#' + str(trip.id)} !", "success")
    return redirect(url_for('admin.bookings', tab=back_tab))


# ── PRE-DEPARTURE CHECKLIST UPDATE ──
@missions_bp.route('/admin/mission/<int:id>/checklist', methods=['POST'])
@login_required
def update_pre_departure_checklist(id):
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    checklist = {}
    for key, _ in PRE_DEPARTURE_ITEMS:
        checklist[key] = request.form.get(key) == 'on'
    trip.pre_departure_checklist = checklist

    # Auto-advance to ready_for_departure if all critical checks & departure authorization are ticked
    if checklist.get('departure_authorized') and trip.status in ('draft', 'pending_approval', 'scheduled', 'confirmed', 'assigned'):
        trip.status = 'ready_for_departure'

    db.session.commit()
    log_audit("MISSION_CHECKLIST_UPDATED", "Trip", trip.id, f"Check-list pré-départ mise à jour ({sum(1 for v in checklist.values() if v)}/{len(checklist)} validés)")
    flash("Check-list pré-départ enregistrée !", "success")
    next_url = request.form.get('next_url')
    if next_url:
        return redirect(next_url)
    return redirect(url_for('missions.mission_detail', id=trip.id))


@missions_bp.route('/admin/mission/<int:id>')
@login_required
def mission_detail(id):
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('admin.bookings'))

    booking = _trip_linked_booking(trip)
    payments = Payment.query.filter_by(booking_id=booking.id).order_by(Payment.created_at.desc()).all() if booking else []
    paid_total = sum(float(p.amount or 0.0) for p in payments if p.status == 'completed')
    if paid_total == 0 and booking and booking.payment_status == 'paid':
        paid_total = float(booking.price_paid or trip.price or 0.0)
    balance_due = max(0.0, float(trip.price or 0.0) - paid_total)

    extra_vehicles = Bus.query.filter(Bus.id.in_(trip.extra_vehicle_ids)).all() if trip.extra_vehicle_ids else []
    extra_drivers = Driver.query.filter(Driver.id.in_(trip.extra_driver_ids)).all() if trip.extra_driver_ids else []
    expenses = trip.expenses.order_by(MissionExpense.created_at.desc()).all()
    incidents = trip.mission_incidents.order_by(MissionIncident.created_at.desc()).all()
    audit_logs = AuditLog.query.filter_by(target_type='Trip', target_id=trip.id).order_by(AuditLog.id.desc()).limit(20).all()

    if current_user.role == 'super_admin':
        buses = Bus.query.filter_by(is_deleted=False).order_by(Bus.bus_number).all()
        drivers = Driver.query.filter_by(is_deleted=False).order_by(Driver.name).all()
    else:
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Bus.bus_number).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Driver.name).all()

    price_snapshot = None
    if trip.price_snapshot_json:
        try:
            price_snapshot = json.loads(trip.price_snapshot_json)
        except Exception:
            price_snapshot = None

    stage_keys = [s[0] for s in MISSION_STAGES]
    legacy_map = {'scheduled': 'confirmed', 'departed': 'in_progress', 'arrived': 'in_progress', 'returned': 'completed'}
    normalized_status = legacy_map.get(trip.status, trip.status)
    current_stage_idx = stage_keys.index(normalized_status) if normalized_status in stage_keys else 2

    req_action = (request.args.get('action') or '').strip()
    if req_action not in ('departure', 'track', 'return'):
        if trip.status in ('draft', 'pending_approval', 'scheduled', 'confirmed', 'assigned', 'ready_for_departure'):
            req_action = 'departure'
        elif trip.status in ('departed', 'in_progress', 'arrived') and trip.arrival_time and trip.arrival_time <= datetime.now() + timedelta(hours=24):
            req_action = 'return'
        elif trip.status in ('completed', 'closed', 'returned'):
            req_action = 'return'
        else:
            req_action = 'track'

    # Check if an in-app chat exists for this client
    chat_url = None
    if booking:
        db_path = current_app.config['EXPRESS_DB_JSON']
        if os.path.exists(db_path):
            try:
                with open(db_path, 'r', encoding='utf-8') as f:
                    chats = json.load(f).get('chats', [])
                c_phone = "".join(c for c in ((booking.user.phone if booking.user else '') or booking.special_instructions or '') if c.isdigit())
                c_name = (booking.passenger_name or '').strip().lower()
                for th in chats:
                    th_id = str(th.get('id') or th.get('clientId') or '')
                    th_p = "".join(c for c in str(th.get('clientPhone') or '') if c.isdigit())
                    th_n = str(th.get('clientName') or '').strip().lower()
                    if (len(c_phone) >= 8 and th_p.endswith(c_phone[-8:])) or (c_name and c_name in th_n):
                        chat_url = url_for('admin.chats', client_id=th_id)
                        break
            except Exception:
                pass

    return render_template(
        'admin/mission_detail.html',
        trip=trip,
        booking=booking,
        payments=payments,
        paid_total=paid_total,
        balance_due=balance_due,
        extra_vehicles=extra_vehicles,
        extra_drivers=extra_drivers,
        expenses=expenses,
        incidents=incidents,
        audit_logs=audit_logs,
        buses=buses,
        drivers=drivers,
        price_snapshot=price_snapshot,
        mission_stages=MISSION_STAGES,
        terminal_states=TERMINAL_STATES,
        mission_category_map=dict(MISSION_CATEGORIES),
        mission_doc_types=MISSION_DOC_TYPES,
        pre_departure_items=PRE_DEPARTURE_ITEMS,
        current_stage_idx=current_stage_idx,
        expense_categories=EXPENSE_CATEGORIES,
        incident_categories=INCIDENT_CATEGORIES,
        chat_url=chat_url,
        active_action=req_action,
    )


def _save_mission_photos(files, phase):
    """Enregistre les photos d'état des lieux (JPG/PNG/WEBP <= 8 Mo) et renvoie les métadonnées."""
    saved = []
    if not files:
        return saved
    folder = os.path.join(current_app.static_folder, 'uploads', 'missions')
    os.makedirs(folder, exist_ok=True)
    for f in files:
        if not f or not f.filename:
            continue
        ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
        if ext not in ('jpg', 'jpeg', 'png', 'webp'):
            continue
        data = f.read(8 * 1024 * 1024 + 1)
        if not data or len(data) > 8 * 1024 * 1024:
            continue
        head = data[:16]
        sig_ok = (
            (ext in ('jpg', 'jpeg') and head.startswith(b'\xff\xd8\xff'))
            or (ext == 'png' and head.startswith(b'\x89PNG\r\n\x1a\n'))
            or (ext == 'webp' and len(head) >= 12 and head[:4] == b'RIFF' and head[8:12] == b'WEBP')
        )
        if not sig_ok:
            continue
        fname = f"{phase}_{uuid.uuid4().hex[:16]}.{'jpg' if ext == 'jpeg' else ext}"
        with open(os.path.join(folder, fname), 'wb') as out:
            out.write(data)
        saved.append({
            'url': f'/static/uploads/missions/{fname}',
            'phase': phase,
            'uploaded_at': datetime.utcnow().isoformat() + 'Z',
        })
    return saved


@missions_bp.route('/admin/mission/<int:id>/handover', methods=['POST'])
@login_required
@csrf_protect
def confirm_handover(id):
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('admin.bookings', tab='tracking'))

    if not trip.bus_id:
        flash("Aucun véhicule assigné à cette mission. Assignez d'abord un véhicule.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id, action='departure'))

    ok_bus, err_bus = check_vehicle_availability(trip.bus_id, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
    if not ok_bus:
        flash(err_bus, "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id, action='departure'))

    mileage_start = request.form.get('mileage_start', type=int)
    if mileage_start is None or mileage_start < 0:
        flash("Veuillez saisir un kilométrage de départ valide.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id, action='departure'))

    checklist = {}
    for key, _ in PRE_DEPARTURE_ITEMS:
        checklist[key] = request.form.get(key) == 'on'
    checklist['mileage_logged'] = True
    checklist['departure_authorized'] = True
    fuel_start = (request.form.get('fuel_start') or '').strip()
    if fuel_start:
        checklist['fuel_checked'] = True

    new_photos = _save_mission_photos(request.files.getlist('handover_photos'), 'departure')
    if new_photos:
        checklist['photos_taken'] = True
        trip.handover_photos = list(trip.handover_photos) + new_photos

    trip.pre_departure_checklist = checklist
    trip.mileage_start = mileage_start
    if fuel_start:
        trip.fuel_start = fuel_start
    cond = (request.form.get('vehicle_condition') or '').strip()
    if cond:
        trip.vehicle_condition = cond

    trip.actual_departure = trip.actual_departure or datetime.now()
    trip.status = 'in_progress'
    db.session.commit()

    log_audit(
        "MISSION_HANDOVER_CONFIRMED",
        "Trip",
        trip.id,
        f"Départ confirmé par {current_user.username} (Km départ: {mileage_start}, Carburant: {fuel_start or 'N/D'})",
    )
    flash(f"Départ confirmé pour {trip.mission_ref or '#' + str(trip.id)} — location en cours.", "success")
    return redirect(request.form.get('next_url') or url_for('admin.bookings', tab='tracking'))


@missions_bp.route('/admin/mission/<int:id>/return', methods=['POST'])
@login_required
@csrf_protect
def confirm_return(id):
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit, trigger_notification
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('admin.bookings', tab='tracking'))

    mileage_end = request.form.get('mileage_end', type=int)
    if mileage_end is None or mileage_end < 0:
        flash("Veuillez saisir un kilométrage de retour valide.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id, action='return'))

    if trip.mileage_start is not None and mileage_end < trip.mileage_start:
        flash(f"Le kilométrage retour ({mileage_end} km) ne peut pas être inférieur au départ ({trip.mileage_start} km).", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id, action='return'))

    fuel_end = (request.form.get('fuel_end') or '').strip()
    cond_state = (request.form.get('condition_state') or '').strip()
    cond_notes = (request.form.get('vehicle_condition') or '').strip()
    combined_cond = " — ".join(p for p in [cond_state, cond_notes] if p)

    new_photos = _save_mission_photos(request.files.getlist('return_photos'), 'return')
    if new_photos:
        trip.handover_photos = list(trip.handover_photos) + new_photos

    trip.mileage_end = mileage_end
    if fuel_end:
        trip.fuel_end = fuel_end
    if combined_cond:
        trip.vehicle_condition = combined_cond
    comp_notes = (request.form.get('completion_notes') or '').strip()
    if comp_notes:
        trip.completion_notes = comp_notes

    trip.actual_arrival = datetime.now()
    trip.status = 'completed'

    availability = (request.form.get('vehicle_availability') or 'active').strip()
    if trip.bus:
        trip.bus.status = 'maintenance' if availability == 'maintenance' else 'active'

    db.session.commit()

    dist_km = trip.mileage_distance
    dist_txt = f" ({dist_km} km parcourus)" if dist_km is not None else ""
    bus_state_lbl = "En maintenance" if (trip.bus and trip.bus.status == 'maintenance') else "Disponible"
    log_audit(
        "MISSION_RETURN_CONFIRMED",
        "Trip",
        trip.id,
        f"Retour confirmé par {current_user.username}: Km retour {mileage_end}{dist_txt}, Véhicule → {bus_state_lbl}",
    )
    booking = _trip_linked_booking(trip)
    car_label = f"{trip.bus.brand or ''} {trip.bus.model} ({trip.bus.bus_number})".strip() if trip.bus else "Véhicule VIP"
    c_label = booking.passenger_name if booking else "Client VIP 3M"
    trigger_notification(
        title=f"✅ Retour enregistré : {car_label}",
        message=f"Mission {trip.mission_ref or '#' + str(trip.id)} ({c_label}) clôturée.\nKm retour : {mileage_end}{dist_txt} | Statut flotte : {bus_state_lbl}",
        type="success",
        category="operations",
        role_target="super_admin",
    )
    flash(f"Retour enregistré{dist_txt}. Véhicule marqué « {bus_state_lbl} ».", "success")
    return redirect(request.form.get('next_url') or url_for('admin.bookings', tab='tracking'))


@missions_bp.route('/admin/mission/<int:id>/lifecycle', methods=['POST'])
@login_required
def update_mission_lifecycle(id):
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit, trigger_notification

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    new_status = (request.form.get('status') or trip.status).strip()
    cancellation_reason = (request.form.get('cancellation_reason') or '').strip()

    # Business Rule: Terminal states require a reason
    if new_status in ('cancelled', 'rejected', 'interrupted', 'no_show') and not cancellation_reason:
        flash("Un motif explicite est obligatoire pour annuler, rejeter ou interrompre une mission.", "danger")
        return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id))

    # Business Rule: Confirmation or departure requires assigned & non-overlapping vehicle
    booking = _trip_linked_booking(trip)
    if new_status == 'confirmed' and (not trip.bus_id or not booking):
        flash("Impossible de confirmer : un véhicule VIP et un client doivent être associés.", "danger")
        return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id))

    if new_status in ('ready_for_departure', 'departed', 'in_progress') and trip.bus_id:
        ok_bus, err_bus = check_vehicle_availability(trip.bus_id, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
        if not ok_bus:
            flash(err_bus, "danger")
            return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id))

    ms_in = request.form.get('mileage_start', type=int)
    me_in = request.form.get('mileage_end', type=int)
    eff_start = ms_in if ms_in is not None else trip.mileage_start
    if me_in is not None and eff_start is not None and me_in < eff_start:
        flash(f"Le kilométrage retour ({me_in} km) ne peut pas être inférieur au départ ({eff_start} km).", "danger")
        return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id))

    prev_status = trip.status
    trip.status = new_status

    if request.form.get('mileage_start'):
        trip.mileage_start = request.form.get('mileage_start', type=int)
    if request.form.get('mileage_end'):
        trip.mileage_end = request.form.get('mileage_end', type=int)
    if request.form.get('fuel_start') is not None and request.form.get('fuel_start') != '':
        trip.fuel_start = request.form.get('fuel_start').strip()
    if request.form.get('fuel_end') is not None and request.form.get('fuel_end') != '':
        trip.fuel_end = request.form.get('fuel_end').strip()
    if request.form.get('vehicle_condition') is not None:
        trip.vehicle_condition = request.form.get('vehicle_condition').strip()
    if request.form.get('delay_reason') is not None:
        trip.delay_reason = request.form.get('delay_reason').strip()
    if request.form.get('completion_notes') is not None:
        trip.completion_notes = request.form.get('completion_notes').strip()

    if new_status in ['departed', 'in_progress'] and not trip.actual_departure:
        trip.actual_departure = datetime.now()
    if new_status in ['arrived', 'returned', 'completed', 'closed'] and not trip.actual_arrival:
        trip.actual_arrival = datetime.now()

    if new_status in ('cancelled', 'rejected', 'interrupted', 'no_show'):
        trip.cancellation_reason = cancellation_reason
        if booking and not trip.source_booking_id:
            booking.status = 'cancelled'
            if booking.payment_status == 'paid' and new_status == 'cancelled':
                booking.payment_status = 'refunded'
                booking.refund_amount = booking.price_paid
    elif new_status in ['returned', 'completed', 'closed'] and prev_status not in ['returned', 'completed', 'closed']:
        car_label = f"{trip.bus.brand} {trip.bus.model} ({trip.bus.bus_number})" if trip.bus else "Véhicule VIP"
        c_label = booking.passenger_name if booking else "Client VIP 3M"
        trigger_notification(
            title=f"✅ Mission Clôturée / Véhicule Restitué : {car_label}",
            message=f"Mission {trip.mission_ref or '#' + str(trip.id)} ({c_label}) passée à « {new_status} ».\nKm retour : {trip.mileage_end or 'N/D'} | Carburant : {trip.fuel_end or 'N/D'}",
            type="success", category="operations", role_target="super_admin"
        )

    db.session.commit()
    log_audit("MISSION_LIFECYCLE_UPDATED", "Trip", trip.id, f"Statut changé par {current_user.username}: {prev_status} → {new_status}" + (f" ({cancellation_reason})" if cancellation_reason else ""))
    flash(f"Cycle opérationnel mis à jour : {new_status.upper()}", "success")
    return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id))


@missions_bp.route('/admin/mission/<int:id>/assign', methods=['POST'])
@login_required
def assign_mission_resources(id):
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    new_bus_id = request.form.get('bus_id', type=int) or trip.bus_id
    extra_bus_ids = [int(x) for x in request.form.getlist('extra_vehicle_ids') if str(x).isdigit() and int(x) != new_bus_id]
    new_driver_id = request.form.get('driver_id', type=int)
    new_sec_driver_id = request.form.get('secondary_driver_id', type=int)
    extra_driver_ids = [
        int(x) for x in request.form.getlist('extra_driver_ids')
        if str(x).isdigit() and int(x) not in (new_driver_id, new_sec_driver_id)
    ]

    for vid in [new_bus_id] + extra_bus_ids:
        ok, err = check_vehicle_availability(vid, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('missions.mission_detail', id=trip.id))

    for did in [d for d in [new_driver_id, new_sec_driver_id] + extra_driver_ids if d]:
        ok, err, warn = check_driver_availability(did, trip.departure_time, trip.arrival_time, exclude_trip_id=trip.id)
        if not ok:
            flash(err, "danger")
            return redirect(url_for('missions.mission_detail', id=trip.id))
        if warn:
            flash(warn, "warning")

    trip.bus_id = new_bus_id
    trip.extra_vehicle_ids = extra_bus_ids
    trip.driver_id = new_driver_id or None
    trip.secondary_driver_id = new_sec_driver_id if (new_sec_driver_id and new_sec_driver_id != new_driver_id) else None
    trip.extra_driver_ids = extra_driver_ids
    trip.driver_assignment_status = (request.form.get('driver_assignment_status') or ('assigned' if new_driver_id else 'pending')).strip()
    trip.driver_instructions = (request.form.get('driver_instructions') or '').strip()
    trip.driver_allowance = request.form.get('driver_allowance', 0.0, type=float) or 0.0
    trip.driver_feedback = (request.form.get('driver_feedback') or '').strip()

    if trip.status in ['draft', 'pending_approval', 'scheduled', 'confirmed'] and trip.bus_id and trip.driver_id:
        trip.status = 'assigned'

    db.session.commit()
    log_audit("MISSION_ASSIGNED", "Trip", trip.id, f"Convoi mis à jour: Véhicule #{new_bus_id} (+{extra_bus_ids}), Chauffeur #{new_driver_id} (+{extra_driver_ids}), Statut={trip.driver_assignment_status}")
    flash("Affectation convoi (véhicules & chauffeurs) enregistrée sans conflit !", "success")
    return redirect(url_for('missions.mission_detail', id=trip.id))


@missions_bp.route('/admin/mission/<int:id>/expense', methods=['POST'])
@login_required
def add_mission_expense(id):
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    amount = request.form.get('amount', type=float) or 0.0
    category = (request.form.get('category') or 'fuel').strip()
    description = (request.form.get('description') or '').strip()

    if amount <= 0:
        flash("Le montant de la dépense doit être supérieur à 0.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id))

    exp = MissionExpense(
        trip_id=trip.id,
        category=category,
        description=description or EXPENSE_CATEGORIES.get(category, category),
        amount=amount,
        recorded_by_id=current_user.id,
    )
    db.session.add(exp)
    db.session.commit()
    log_audit("MISSION_EXPENSE_ADDED", "Trip", trip.id, f"Dépense {category}: {amount:.0f} FCFA ({description})")
    flash(f"Dépense mission enregistrée ({amount:,.0f} FCFA).", "success")
    return redirect(url_for('missions.mission_detail', id=trip.id))


@missions_bp.route('/admin/mission/<int:id>/expense/<int:exp_id>/delete', methods=['POST'])
@login_required
def delete_mission_expense(id, exp_id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    exp = MissionExpense.query.filter_by(id=exp_id, trip_id=id).first_or_404()
    db.session.delete(exp)
    db.session.commit()
    flash("Dépense supprimée.", "info")
    return redirect(url_for('missions.mission_detail', id=id))


@missions_bp.route('/admin/mission/<int:id>/incident', methods=['POST'])
@login_required
def add_mission_incident(id):
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit, trigger_notification

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    description = (request.form.get('description') or '').strip()
    if not description:
        flash("Veuillez décrire l'incident.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id))

    inc_category = (request.form.get('category') or 'delay').strip()
    inc_ref = f"INC-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"
    inc = MissionIncident(
        incident_ref=inc_ref,
        trip_id=trip.id,
        category=inc_category,
        severity=(request.form.get('severity') or 'medium').strip(),
        description=description,
        responsible_person=(request.form.get('responsible_person') or current_user.username).strip(),
        resolution=(request.form.get('resolution') or '').strip(),
        status='open',
    )
    if inc_category == 'delay' or request.form.get('delay_reason'):
        trip.delay_reason = (request.form.get('delay_reason') or description)[:255]
    db.session.add(inc)
    db.session.commit()

    log_audit("MISSION_INCIDENT_LOGGED", "Trip", trip.id, f"Incident {inc_ref} [{inc.severity}]: {description}")
    trigger_notification(
        title=f"⚠️ Incident Mission {trip.mission_ref or '#' + str(trip.id)} ({inc.severity.upper()})",
        message=f"Réf : {inc_ref}\nType : {INCIDENT_CATEGORIES.get(inc.category, inc.category)}\nDétail : {description}",
        type="warning", category="operations", role_target="super_admin"
    )
    flash(f"Incident {inc_ref} enregistré.", "warning")
    return redirect(request.form.get('next_url') or url_for('missions.mission_detail', id=trip.id, action='track'))


@missions_bp.route('/admin/mission/<int:id>/incident/<int:inc_id>/resolve', methods=['POST'])
@login_required
def resolve_mission_incident(id, inc_id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    inc = MissionIncident.query.filter_by(id=inc_id, trip_id=id).first_or_404()
    inc.status = 'resolved'
    res_note = (request.form.get('resolution') or '').strip()
    if res_note:
        inc.resolution = res_note
    db.session.commit()
    flash(f"Incident {inc.incident_ref} marqué comme résolu.", "success")
    return redirect(url_for('missions.mission_detail', id=id))


@missions_bp.route('/admin/mission/<int:id>/payment', methods=['POST'])
@login_required
def record_mission_payment(id):
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit

    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    booking = _trip_linked_booking(trip)
    if not booking:
        flash("Aucun contrat client associé pour encaisser un paiement.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id))

    amount = request.form.get('amount', type=float) or 0.0
    method = (request.form.get('payment_method') or 'momo').strip()
    tx_ref = (request.form.get('transaction_id') or f"TX-{datetime.now().strftime('%y%m%d%H%M')}-{random.randint(10,99)}").strip()

    if amount <= 0:
        flash("Montant de paiement invalide.", "danger")
        return redirect(url_for('missions.mission_detail', id=trip.id))

    pay = Payment(
        booking_id=booking.id,
        amount=amount,
        status='completed',
        payment_method=method,
        transaction_id=tx_ref,
    )
    db.session.add(pay)
    db.session.flush()

    total_paid = sum(float(p.amount or 0.0) for p in Payment.query.filter_by(booking_id=booking.id, status='completed').all())
    booking.payment_method = method
    booking.upi_reference = tx_ref
    if total_paid >= float(trip.price or 0.0):
        booking.payment_status = 'paid'
        booking.price_paid = max(float(trip.price or 0.0), total_paid)
    else:
        booking.payment_status = 'pending'

    db.session.commit()
    log_audit("MISSION_PAYMENT_RECORDED", "Trip", trip.id, f"Paiement {amount:.0f} FCFA via {method} (Réf: {tx_ref})")
    flash(f"Paiement de {amount:,.0f} FCFA enregistré dans le grand livre central.", "success")
    return redirect(url_for('missions.mission_detail', id=trip.id))


# ── 10 BRANDED PRINTABLE DOCUMENTS REPOSITORY ──
def _render_mission_doc(id, doc_type):
    valid_types = {d[0] for d in MISSION_DOC_TYPES}
    if doc_type not in valid_types:
        doc_type = 'order'
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    booking = _trip_linked_booking(trip)
    extra_vehicles = Bus.query.filter(Bus.id.in_(trip.extra_vehicle_ids)).all() if trip.extra_vehicle_ids else []
    extra_drivers = Driver.query.filter(Driver.id.in_(trip.extra_driver_ids)).all() if trip.extra_driver_ids else []
    payments = Payment.query.filter_by(booking_id=booking.id).order_by(Payment.created_at.desc()).all() if booking else []
    paid_total = sum(float(p.amount or 0.0) for p in payments if p.status == 'completed')
    if paid_total == 0 and booking and booking.payment_status == 'paid':
        paid_total = float(booking.price_paid or trip.price or 0.0)
    expenses = trip.expenses.order_by(MissionExpense.created_at.desc()).all()
    incidents = trip.mission_incidents.order_by(MissionIncident.created_at.desc()).all()
    return render_template(
        'admin/mission_document.html',
        doc_type=doc_type,
        doc_types=MISSION_DOC_TYPES,
        trip=trip,
        booking=booking,
        extra_vehicles=extra_vehicles,
        extra_drivers=extra_drivers,
        payments=payments,
        paid_total=paid_total,
        expenses=expenses,
        incidents=incidents,
        pre_departure_items=PRE_DEPARTURE_ITEMS,
        expense_categories=EXPENSE_CATEGORIES,
        incident_categories=INCIDENT_CATEGORIES,
        now=datetime.now(),
    )


@missions_bp.route('/admin/mission/<int:id>/doc/<doc_type>')
@login_required
def mission_document(id, doc_type):
    if not _admin_only():
        return redirect(url_for('main.index'))
    return _render_mission_doc(id, doc_type)


@missions_bp.route('/admin/mission/<int:id>/order')
@login_required
def mission_order_doc(id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    return _render_mission_doc(id, 'order')


@missions_bp.route('/admin/mission/<int:id>/invoice')
@login_required
def mission_invoice_doc(id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    return _render_mission_doc(id, 'invoice')


@missions_bp.route('/admin/missions/packages/save', methods=['POST'])
@login_required
def save_package():
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import log_audit

    pkg_id = request.form.get('package_id', type=int)
    name = (request.form.get('name') or '').strip()
    if not name:
        flash("Le nom du forfait VIP est obligatoire.", "danger")
        return redirect(url_for('admin.bookings', tab='packages'))

    pkg = MissionPackage.query.get(pkg_id) if pkg_id else MissionPackage()
    pkg.package_ref = (request.form.get('package_ref') or pkg.package_ref or f"PKG-{random.randint(1000,9999)}").strip()
    pkg.name = name
    pkg.description = (request.form.get('description') or '').strip()
    pkg.service_category = (request.form.get('service_category') or 'VIP').strip()
    pkg.pricing_mode = (request.form.get('pricing_mode') or 'fixed').strip()
    pkg.base_price = request.form.get('base_price', 75000.0, type=float) or 0.0
    pkg.included_km = request.form.get('included_km', 100, type=int) or 0
    pkg.included_hours = request.form.get('included_hours', 8, type=int) or 0
    pkg.extra_km_price = request.form.get('extra_km_price', 500.0, type=float) or 0.0
    pkg.extra_hour_price = request.form.get('extra_hour_price', 15000.0, type=float) or 0.0
    pkg.waiting_allowance_minutes = request.form.get('waiting_allowance_minutes', 30, type=int) or 0
    pkg.waiting_hour_price = request.form.get('waiting_hour_price', 10000.0, type=float) or 0.0
    pkg.overtime_price = request.form.get('overtime_price', 15000.0, type=float) or 0.0
    pkg.fuel_toll_policy = (request.form.get('fuel_toll_policy') or '').strip()
    pkg.applicable_routes = (request.form.get('applicable_routes') or 'Toutes destinations').strip()
    pkg.terms_conditions = (request.form.get('terms_conditions') or '').strip()
    pkg.passenger_limit = request.form.get('passenger_limit', 4, type=int) or 4
    pkg.luggage_limit = (request.form.get('luggage_limit') or '4 valises').strip()
    pkg.vehicle_categories = (request.form.get('vehicle_categories') or 'Tous véhicules VIP').strip()
    pkg.promo_code = (request.form.get('promo_code') or '').strip() or None
    pkg.discount_percent = request.form.get('discount_percent', 0.0, type=float) or 0.0
    pkg.corporate_price = request.form.get('corporate_price', type=float)
    pkg.status = (request.form.get('status') or 'active').strip()
    pkg.agency_id = current_user.agency_id

    if not pkg_id:
        db.session.add(pkg)
    db.session.commit()

    log_audit("PACKAGE_SAVED", "MissionPackage", pkg.id, f"Forfait VIP enregistré : {pkg.name} ({pkg.base_price:.0f} FCFA)")
    flash(f"Forfait VIP « {pkg.name} » enregistré avec succès !", "success")
    return redirect(url_for('admin.bookings', tab='packages'))


@missions_bp.route('/admin/missions/packages/<int:pkg_id>/toggle', methods=['POST'])
@login_required
def toggle_package(pkg_id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    pkg = MissionPackage.query.get_or_404(pkg_id)
    new_st = (request.form.get('status') or '').strip()
    if new_st in ['active', 'inactive', 'archived']:
        pkg.status = new_st
    else:
        pkg.status = 'inactive' if pkg.status == 'active' else 'active'
    db.session.commit()
    flash(f"Forfait « {pkg.name} » passé à : {pkg.status}", "success")
    return redirect(url_for('admin.bookings', tab='packages'))


# ==============================================================================
# DASHBOARD QUICK ACTIONS (NO DUPLICATES, PERMISSION-GATED, DIRECT FEEDBACK)
# ==============================================================================
def build_quick_actions_context():
    """Provide scoped live datasets for Dashboard Quick Action modals."""
    from app.models import Apartment
    if current_user.role == 'super_admin':
        qa_buses = Bus.query.filter_by(status='active', is_deleted=False).order_by(Bus.brand, Bus.model).all()
        qa_drivers = Driver.query.filter_by(is_deleted=False).order_by(Driver.name).all()
        qa_routes = Route.query.filter_by(is_deleted=False).order_by(Route.origin).all()
        from app.services.dashboard_kpis import real
        qa_bookings = Booking.query.filter(Booking.is_deleted == False, Booking.status != 'cancelled', real(Booking)).order_by(Booking.booking_date.desc().nulls_last()).limit(40).all()
    else:
        qa_buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).order_by(Bus.brand, Bus.model).all()
        qa_drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Driver.name).all()
        qa_routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Route.origin).all()
        t_ids = db.session.query(Trip.id).join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        from app.services.dashboard_kpis import real
        qa_bookings = Booking.query.filter(Booking.trip_id.in_(t_ids), Booking.is_deleted == False, Booking.status != 'cancelled', real(Booking)).order_by(Booking.booking_date.desc().nulls_last()).limit(40).all()

    from app.services.dashboard_kpis import real as _real
    qa_clients = User.query.filter_by(role='client', is_deleted=False).filter(_real(User)).order_by(User.real_name, User.username).limit(80).all()
    qa_packages = MissionPackage.query.filter_by(status='active').order_by(MissionPackage.base_price.asc()).all()
    qa_apartments = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.title).all()

    return {
        'qa_buses': qa_buses,
        'qa_drivers': qa_drivers,
        'qa_routes': qa_routes,
        'qa_clients': qa_clients,
        'qa_packages': qa_packages,
        'qa_bookings': qa_bookings,
        'qa_apartments': qa_apartments,
        'qa_can_record_payment': current_user.is_staff,
    }


@missions_bp.route('/admin/quick-action/client', methods=['POST'])
@login_required
def qa_create_client():
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from markupsafe import Markup, escape
    from app.routes.admin import _upsert_visitor_user, log_audit

    name = (request.form.get('real_name') or '').strip()
    phone = (request.form.get('phone') or '').strip()
    email = (request.form.get('email') or '').strip()
    city = (request.form.get('city') or 'Yaoundé').strip()
    address = (request.form.get('address') or '').strip()
    client_type = (request.form.get('client_type') or 'Particulier VIP').strip()
    company_name = (request.form.get('company_name') or '').strip()

    if not name or not phone:
        flash("Le nom et le téléphone du client VIP sont obligatoires.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Duplicate check by phone or email
    digits = "".join(c for c in phone if c.isdigit())
    existing = None
    if email:
        existing = User.query.filter(User.email.ilike(email), User.is_deleted == False).first()
    if not existing and len(digits) >= 8:
        for cand in User.query.filter_by(role='client', is_deleted=False).all():
            c_dig = "".join(c for c in (cand.phone or '') if c.isdigit())
            if len(c_dig) >= 8 and c_dig[-8:] == digits[-8:]:
                existing = cand
                break

    full_display = f"{name} ({company_name})" if company_name else name
    full_addr = f"{address} · {client_type}".strip(' ·') if address else client_type

    if existing:
        existing.real_name = full_display
        existing.phone = phone
        if city:
            existing.city = city
        if full_addr:
            existing.address = full_addr
        db.session.commit()
        log_audit("QUICK_ACTION_CLIENT_UPDATED", "User", existing.id, f"Profil client existant mis à jour sans doublon : {full_display} ({phone})")
        edit_href = url_for('admin.edit_user', id=existing.id)
        flash(Markup(f"Client existant mis à jour sans doublon : <strong>{escape(full_display)}</strong> — <a href='{edit_href}' class='alert-link fw-bold'>Ouvrir la fiche client →</a>"), "info")
        return redirect(url_for('admin.dashboard'))

    u = _upsert_visitor_user(full_display, phone, full_addr, city, email)
    db.session.commit()
    log_audit("QUICK_ACTION_CLIENT_CREATED", "User", u.id, f"Nouveau client VIP créé via Action Rapide : {full_display} ({phone})")
    edit_href = url_for('admin.edit_user', id=u.id)
    flash(Markup(f"Nouveau client VIP enregistré : <strong>{escape(full_display)}</strong> — <a href='{edit_href}' class='alert-link fw-bold'>Ouvrir la fiche client →</a>"), "success")
    return redirect(url_for('admin.dashboard'))


@missions_bp.route('/admin/quick-action/payment', methods=['POST'])
@login_required
def qa_record_payment():
    if not current_user.is_staff:
        flash("Permission refusée : vous n'êtes pas autorisé à enregistrer des paiements.", "danger")
        return redirect(url_for('admin.dashboard'))

    from markupsafe import Markup, escape
    from app.routes.admin import log_audit

    booking_id = request.form.get('booking_id', type=int)
    amount = request.form.get('amount', type=float) or 0.0
    method = (request.form.get('payment_method') or 'momo').strip()
    tx_ref = (request.form.get('transaction_id') or f"PAY-QA-{datetime.now().strftime('%y%m%d%H%M')}-{random.randint(10,99)}").strip()

    booking = Booking.query.filter_by(id=booking_id, is_deleted=False).first()
    if not booking or amount <= 0:
        flash("Sélectionnez une réservation valide et un montant supérieur à 0 FCFA.", "danger")
        return redirect(url_for('admin.dashboard'))

    if current_user.role != 'super_admin' and booking.trip and booking.trip.route and booking.trip.route.agency_id != current_user.agency_id:
        flash("Accès refusé : cette réservation appartient à une autre agence.", "danger")
        return redirect(url_for('admin.dashboard'))

    pay = Payment(
        booking_id=booking.id,
        amount=amount,
        status='completed',
        payment_method=method,
        transaction_id=tx_ref,
    )
    db.session.add(pay)
    db.session.flush()

    total_paid = sum(float(p.amount or 0.0) for p in Payment.query.filter_by(booking_id=booking.id, status='completed').all())
    target_total = float(booking.trip.price if booking.trip and booking.trip.price else (booking.price_paid or amount))
    booking.payment_method = method
    booking.upi_reference = tx_ref
    if total_paid >= target_total:
        booking.payment_status = 'paid'
        booking.price_paid = max(target_total, total_paid)
    else:
        booking.payment_status = 'pending'
    db.session.commit()

    log_audit("QUICK_ACTION_PAYMENT", "Payment", pay.id, f"Paiement {amount:.0f} FCFA ({method}) enregistré sur {booking.booking_code} (Réf: {tx_ref})")
    receipt_href = url_for('missions.mission_document', id=booking.trip_id, doc_type='receipt') if booking.trip_id else url_for('admin.finance')
    flash(Markup(f"Paiement de <strong>{amount:,.0f} FCFA</strong> enregistré pour <strong>{escape(booking.booking_code)}</strong> — <a href='{receipt_href}' target='_blank' class='alert-link fw-bold'>Imprimer le reçu officiel →</a>"), "success")
    return redirect(url_for('admin.dashboard'))


@missions_bp.route('/admin/quick-action/apartment', methods=['POST'])
@login_required
def qa_create_apartment():
    if not _admin_only():
        flash("Accès non autorisé.", "danger")
        return redirect(url_for('main.index'))

    from markupsafe import Markup, escape
    from app.models import Apartment
    from app.routes.admin import log_audit

    title = (request.form.get('title') or '').strip()
    apt_type = (request.form.get('type') or 'Appartement VIP').strip()
    location = (request.form.get('location') or 'Yaoundé — Tsinga (Face FECAFOOT)').strip()
    rooms = (request.form.get('rooms') or '2 Chambres + Salon').strip()
    price = request.form.get('price', type=float) or 50000.0
    status = (request.form.get('status') or 'Disponible').strip()
    description = (request.form.get('description') or '').strip()
    equipments_raw = (request.form.get('equipments') or 'Wi-Fi Fibre, Climatisation, Cuisine équipée, Parking sécurisé').strip()

    if not title:
        flash("Le nom de l'appartement VIP est obligatoire.", "danger")
        return redirect(url_for('admin.dashboard'))

    apt_id = f"apt-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"
    price_str = f"{int(price):,} FCFA / nuitée".replace(',', ' ')
    image_url = (request.form.get('image') or '').strip() or None
    apt = Apartment(
        id=apt_id,
        title=title,
        type=apt_type,
        location=location,
        rooms=rooms,
        price=price_str,
        image=image_url,
        status=status,
        description=description or f"{apt_type} haut standing à {location}.",
        agency_id=current_user.agency_id,
    )
    apt.equipments = [e.strip() for e in equipments_raw.split(',') if e.strip()]
    db.session.add(apt)
    db.session.commit()

    log_audit("QUICK_ACTION_APARTMENT_CREATED", "Apartment", None, f"Appartement VIP créé via Action Rapide : {title} ({price_str})")
    apt_href = url_for('admin.apartments')
    flash(Markup(f"Appartement VIP <strong>{escape(title)}</strong> ajouté ({escape(price_str)}) — <a href='{apt_href}' class='alert-link fw-bold'>Voir les Appartements VIP →</a>"), "success")
    return redirect(url_for('admin.dashboard'))
