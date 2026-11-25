"""Compteurs réels de la coque admin (menu latéral, cloche, état de la flotte)."""
from datetime import datetime

from flask import g
from flask_login import current_user

from app import db
from app.models import Bus, Trip

# Statuts de mission où le véhicule est sur la route
ON_ROAD_STATUSES = ('boarding', 'departed', 'delayed')
CLOSED_STATUSES = ('cancelled', 'completed', 'arrived', 'archived')


def _scope_agency(query, model):
    if current_user.role != 'super_admin' and getattr(current_user, 'agency_id', None):
        return query.filter(model.agency_id == current_user.agency_id)
    return query


def _unread_notifications():
    """Même définition que la page Notifications (lectures individuelles incluses)."""
    from app.routes.admin import scoped_notifications_query, _read_ids_for, _is_unread
    read_ids = _read_ids_for(current_user)
    q = scoped_notifications_query(current_user).filter_by(is_archived=False)
    return sum(1 for n in q.all() if _is_unread(n, read_ids))


def get_shell_stats():
    """Calculé une fois par requête ; renvoie des zéros si la base est vide ou indisponible."""
    if 'admin_shell_stats' in g:
        return g.admin_shell_stats
    stats = {'vehicles': 0, 'on_road': 0, 'available': 0, 'maintenance': 0,
             'missions_open': 0, 'notifications': 0}
    try:
        if current_user.is_authenticated:
            buses = _scope_agency(Bus.query.filter_by(is_deleted=False), Bus)
            now = datetime.utcnow()
            on_road_ids = {
                bid for (bid,) in db.session.query(Trip.bus_id).filter(
                    Trip.is_deleted == False,  # noqa: E712
                    Trip.bus_id.in_(buses.with_entities(Bus.id)),
                    db.or_(
                        Trip.status.in_(ON_ROAD_STATUSES),
                        db.and_(Trip.departure_time <= now, Trip.arrival_time >= now,
                                ~Trip.status.in_(CLOSED_STATUSES)),
                    ),
                ).distinct()
            }
            maintenance = buses.filter(Bus.status == 'maintenance').count()
            total = buses.count()
            on_road = len(on_road_ids)
            stats.update(
                vehicles=total,
                maintenance=maintenance,
                on_road=on_road,
                available=max(total - maintenance - on_road, 0),
                missions_open=Trip.query.filter(
                    Trip.is_deleted == False,  # noqa: E712
                    Trip.bus_id.in_(buses.with_entities(Bus.id)),
                    Trip.arrival_time >= now,
                    ~Trip.status.in_(CLOSED_STATUSES),
                ).count(),
                notifications=_unread_notifications(),
            )
    except Exception:
        db.session.rollback()
    g.admin_shell_stats = stats
    return stats
