"""Schéma lieux + demandes de location (idempotent) et liste initiale des quartiers.

Les quartiers de Yaoundé et Douala proviennent du cahier des charges : ce sont des SUGGESTIONS de
départ, ni exhaustives ni validées officiellement. L'équipe peut les corriger et en ajouter.
La liste n'est insérée que si aucune ville n'existe encore.
"""
from sqlalchemy import inspect as sa_inspect, text

SEED = {
    'Yaoundé': [
        ('Yaoundé I', 'Bastos, Nlongkak, Elig-Essono, Elig-Edzoa, Etoudi, Emana, Olembe, Messassi, Manguier'),
        ('Yaoundé II', 'Mokolo, Tsinga, Madagascar, Cité Verte, Grand Messa, Nkom-Kana'),
        ('Yaoundé III', 'Obili, Ngoa-Ekelle, Efoulan, Nsam, Melen, Nsimeyong, Olezoa, Ahala'),
        ('Yaoundé IV', 'Mvan, Odza, Ekoumdoum, Awae, Nkomo, Ekounou, Biteng, Kondengui, Mimboman'),
        ('Yaoundé V', 'Essos, Mvog-Ada, Ngousso, Mfandena, Quartier Fouda, Nkolmesseng'),
        ('Yaoundé VI', 'Biyem-Assi, Mendong, Mvog-Betsi, Simbock, Etoug-Ebe, Melen 8'),
        ('Yaoundé VII', 'Nkolbisson, Oyom-Abang, Etetak, Minkoameyos'),
    ],
    'Douala': [
        ('Douala I', 'Akwa, Bonanjo, Bonapriso, Bali, Deido, Bonamoussadi'),
        ('Douala II', 'New Bell, New Bell Congo, Nkololoun, Youpwé, Kassalafam'),
        ('Douala III', 'Logbaba, Ndogbong, Ndokoti, Ndogpassi, Japoma, Yassa, Bassa'),
        ('Douala IV', 'Bonabéri, Bonassama, Mambanda, Ndobo, Sodiko, Bonendale'),
        ('Douala V', 'Makepe, Kotto, Logpom, Bépanda, Cité des Palmiers, Bonamoussadi'),
        ('Douala VI', 'Manoka'),
    ],
}


def _models():
    from app.models import (LocAlias, LocCity, LocDistrict, LocLandmark, LocNeighbourhood, RentalRequest,
                            TripPriceRule)
    return [LocCity, LocDistrict, LocNeighbourhood, LocAlias, LocLandmark, TripPriceRule, RentalRequest]


def ensure_rental_schema(bind):
    def run(conn):
        tables = set(sa_inspect(conn).get_table_names())
        for model in _models():
            if model.__tablename__ not in tables:
                model.__table__.create(conn)
        if 'rental_request' in tables:      # table créée avant l'ajout des informations de retour
            have = {c['name'] for c in sa_inspect(conn).get_columns('rental_request')}
            for name, ddl in (('return_address', 'VARCHAR(200)'), ('return_notes', 'VARCHAR(300)')):
                if name not in have:
                    conn.execute(text(f'ALTER TABLE rental_request ADD COLUMN {name} {ddl}'))
        if conn.execute(text('SELECT COUNT(*) FROM loc_city')).scalar():
            return
        for city, districts in SEED.items():
            conn.execute(text("INSERT INTO loc_city (country, name, is_active) VALUES ('Cameroun', :n, 1)"), {'n': city})
            cid = conn.execute(text('SELECT id FROM loc_city WHERE name = :n'), {'n': city}).scalar()
            for pos, (district, hoods) in enumerate(districts, 1):
                conn.execute(text('INSERT INTO loc_district (city_id, name, position, is_active) VALUES (:c, :n, :p, 1)'),
                             {'c': cid, 'n': district, 'p': pos})
                did = conn.execute(text('SELECT id FROM loc_district WHERE city_id = :c AND name = :n'),
                                   {'c': cid, 'n': district}).scalar()
                for hood in (h.strip() for h in hoods.split(',')):
                    conn.execute(text("INSERT INTO loc_neighbourhood (city_id, district_id, name, status, is_active, created_at) "
                                      "VALUES (:c, :d, :n, 'approved', 1, CURRENT_TIMESTAMP)"), {'c': cid, 'd': did, 'n': hood})

    if hasattr(bind, 'begin') and not hasattr(bind, 'in_transaction'):
        with bind.begin() as conn:
            run(conn)
    else:
        run(bind)
