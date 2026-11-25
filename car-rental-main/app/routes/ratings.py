"""Avis clients : note globale de l'expérience laissée depuis l'espace client du site.

- Le site (React) passe par l'API Node, qui appelle les points d'entrée internes ci-dessous.
- L'admin voit les avis (/admin/avis), répond au client, suit le traitement (Nouveau → En cours → Traité)
  et peut masquer un avis. La réponse s'affiche dans l'espace client.
"""
import re
from datetime import datetime, timedelta

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func, inspect as sa_inspect, or_

from app import db
from app.models import ExperienceRating, SystemNotification, User
from app.routes.admin import admin_required, log_audit
from app.routes.internal import _authorized
from app.utils.security import csrf_protect

ratings_bp = Blueprint('ratings', __name__)


@ratings_bp.app_template_filter('local_dt')
def local_dt(value, fmt='%d/%m/%Y %H:%M'):
    """Date UTC stockée -> heure de Yaoundé (Africa/Douala, UTC+1 toute l'année)."""
    if not value:
        return ''
    return (value + timedelta(hours=1)).strftime(fmt)

STATUSES = ('new', 'in_progress', 'resolved')
PER_PAGE = 30


def ensure_rating_schema():
    """Crée la table si la migration n'a pas encore été appliquée (sans toucher aux données)."""
    if 'experience_rating' not in sa_inspect(db.engine).get_table_names():
        ExperienceRating.__table__.create(db.engine)


def _digits(phone):
    return re.sub(r'\D', '', phone or '')[-9:]


def _real():
    return or_(ExperienceRating.is_test == False, ExperienceRating.is_test == None)  # noqa: E711,E712


def _owner_matches(r, phone, email):
    """Le compte (numéro client) + son téléphone ou e-mail : on ne lit pas l'avis d'un autre."""
    if r.client_phone and phone and _digits(r.client_phone) == _digits(phone):
        return True
    if r.client_email and email and r.client_email.lower() == email.lower():
        return True
    return not r.client_phone and not r.client_email


def _match_user(phone, email):
    q = User.query.filter(User.role == 'client', User.is_deleted == False)  # noqa: E712
    if email:
        u = q.filter(func.lower(User.email) == email.lower()).first()
        if u:
            return u
    d = _digits(phone)
    if len(d) == 9:
        for u in q.filter(User.phone.isnot(None)).all():
            if _digits(u.phone) == d:
                return u
    return None


def _notify(r, updated):
    stars = '★' * r.rating + '☆' * (5 - r.rating)
    title = f"⭐ {'Avis mis à jour' if updated else 'Nouvel avis'} : {r.rating}/5 — {r.client_name}"
    lines = [stars]
    if r.comment:
        lines.append(f'« {r.comment[:220]}{"…" if len(r.comment) > 220 else ""} »')
    if r.client_phone or r.client_email:
        lines.append(f'Contact : {r.client_phone or r.client_email}')
    db.session.add(SystemNotification(
        title=title[:150], message='\n'.join(lines),
        type='danger' if r.rating <= 2 else ('warning' if r.rating == 3 else 'success'),
        category='feedback', role_target=None))


# ── API interne (appelée par Node) ───────────────────────────────────────────
@ratings_bp.route('/api/internal/experience-rating', methods=['GET', 'POST'])
def internal_rating():
    if not _authorized():
        return jsonify({'error': 'Non autorisé'}), 403

    if request.method == 'GET':
        account = (request.args.get('account') or '').strip()[:60]
        r = ExperienceRating.query.filter_by(account_number=account).first() if account else None
        if not r or not _owner_matches(r, request.args.get('phone'), request.args.get('email')):
            return jsonify({'rating': None})
        return jsonify({'rating': r.to_public_dict()})

    data = request.get_json(silent=True) or {}
    account = str(data.get('accountNumber') or '').strip()[:60]
    name = str(data.get('name') or '').strip()[:120]
    phone = str(data.get('phone') or '').strip()[:40]
    email = str(data.get('email') or '').strip()[:120]
    comment = str(data.get('comment') or '').strip()[:1500]
    try:
        rating = int(data.get('rating'))
    except (TypeError, ValueError):
        rating = 0
    if not account or not name:
        return jsonify({'error': 'Connectez-vous à votre espace client pour noter votre expérience.'}), 400
    if not 1 <= rating <= 5:
        return jsonify({'error': 'Choisissez une note de 1 à 5 étoiles.'}), 400
    if rating <= 3 and len(comment) < 5:
        return jsonify({'error': 'Dites-nous en quelques mots ce qui n’a pas été à la hauteur, pour que nous puissions corriger.'}), 400

    r = ExperienceRating.query.filter_by(account_number=account).first()
    updated = r is not None
    if r and not _owner_matches(r, phone, email):
        return jsonify({'error': 'Ce compte ne correspond pas à vos coordonnées.'}), 403
    if r and r.rating == rating and (r.comment or '') == comment:
        return jsonify({'rating': r.to_public_dict(), 'unchanged': True})
    now = datetime.utcnow()
    user = _match_user(phone, email)          # avant tout ajout en session (pas d'autoflush incomplet)
    if not r:
        r = ExperienceRating(account_number=account, created_at=now)
        db.session.add(r)
    r.user_id = user.id if user else r.user_id
    r.is_test = bool(user and user.is_test)
    r.client_name, r.client_phone, r.client_email = name, phone or None, email or None
    r.rating, r.comment, r.updated_at = rating, comment or None, now
    r.status, r.resolved_at = 'new', None          # un avis modifié repasse à traiter
    _notify(r, updated)
    db.session.commit()
    return jsonify({'rating': r.to_public_dict()}), 200 if updated else 201


# ── Admin ────────────────────────────────────────────────────────────────────
@ratings_bp.route('/admin/avis')
@login_required
@admin_required
def index():
    status = request.args.get('status', '')
    stars = request.args.get('stars', type=int)
    q = (request.args.get('q') or '').strip()
    show_hidden = request.args.get('hidden') == '1'
    page = max(1, request.args.get('page', 1, type=int))

    base = ExperienceRating.query.filter(_real())
    visible = base.filter(or_(ExperienceRating.is_hidden == False, ExperienceRating.is_hidden == None))  # noqa: E711,E712

    total = visible.count()
    avg = visible.with_entities(func.avg(ExperienceRating.rating)).scalar()
    dist = dict(visible.with_entities(ExperienceRating.rating, func.count()).group_by(ExperienceRating.rating).all())
    counts = dict(base.with_entities(ExperienceRating.status, func.count()).group_by(ExperienceRating.status).all())
    happy = (dist.get(4, 0) + dist.get(5, 0))
    stats = {
        'total': total,
        'avg': round(avg, 1) if avg else None,
        'dist': [(n, dist.get(n, 0)) for n in range(5, 0, -1)],
        'satisfaction': round(100 * happy / total) if total else None,
        'to_handle': counts.get('new', 0) + counts.get('in_progress', 0),
        'counts': counts,
        'hidden': base.filter(ExperienceRating.is_hidden == True).count(),  # noqa: E712
    }

    rows = base if show_hidden else visible
    if status in STATUSES:
        rows = rows.filter(ExperienceRating.status == status)
    if stars and 1 <= stars <= 5:
        rows = rows.filter(ExperienceRating.rating == stars)
    if q:
        like = f'%{q}%'
        rows = rows.filter(or_(ExperienceRating.client_name.ilike(like), ExperienceRating.client_phone.ilike(like),
                               ExperienceRating.client_email.ilike(like), ExperienceRating.comment.ilike(like),
                               ExperienceRating.account_number.ilike(like)))
    # À traiter d'abord, puis les plus mauvaises notes, puis les plus récents
    order = db.case((ExperienceRating.status == 'new', 0), (ExperienceRating.status == 'in_progress', 1), else_=2)
    filtered = rows.count()
    items = (rows.order_by(order, ExperienceRating.rating.asc(), ExperienceRating.updated_at.desc())
             .offset((page - 1) * PER_PAGE).limit(PER_PAGE).all())
    return render_template('admin/ratings.html', items=items, stats=stats, status=status, stars=stars, q=q,
                           show_hidden=show_hidden, page=page, filtered=filtered,
                           total_pages=max(1, -(-filtered // PER_PAGE)))


def _back():
    return redirect(request.form.get('next') or url_for('ratings.index'))


@ratings_bp.route('/admin/avis/<int:rid>/reply', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def reply(rid):
    r = db.get_or_404(ExperienceRating, rid)
    text = (request.form.get('reply') or '').strip()[:1500]
    if not text:
        flash('La réponse est vide.', 'warning')
        return _back()
    new_status = request.form.get('status') or 'in_progress'
    r.admin_reply, r.replied_at, r.replied_by_id = text, datetime.utcnow(), current_user.id
    if new_status in STATUSES:
        r.status = new_status
        r.resolved_at = datetime.utcnow() if new_status == 'resolved' else None
    db.session.commit()
    log_audit('RATING_REPLIED', 'ExperienceRating', r.id, f'Réponse à l’avis {r.rating}/5 de {r.client_name}')
    flash(f'Réponse envoyée à {r.client_name} : elle s’affiche dans son espace client.', 'success')
    return _back()


@ratings_bp.route('/admin/avis/<int:rid>/status', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def set_status(rid):
    r = db.get_or_404(ExperienceRating, rid)
    new_status = request.form.get('status')
    if new_status in STATUSES:
        r.status = new_status
        r.resolved_at = datetime.utcnow() if new_status == 'resolved' else None
        db.session.commit()
        log_audit('RATING_STATUS', 'ExperienceRating', r.id, f'Avis de {r.client_name} : {r.status_label}')
        flash(f'Avis de {r.client_name} : {r.status_label}.', 'success')
    return _back()


@ratings_bp.route('/admin/avis/<int:rid>/visibility', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def toggle_hidden(rid):
    r = db.get_or_404(ExperienceRating, rid)
    r.is_hidden = not r.is_hidden
    db.session.commit()
    log_audit('RATING_HIDDEN' if r.is_hidden else 'RATING_SHOWN', 'ExperienceRating', r.id, r.client_name)
    flash('Avis masqué des statistiques.' if r.is_hidden else 'Avis de nouveau pris en compte.', 'success')
    return _back()
