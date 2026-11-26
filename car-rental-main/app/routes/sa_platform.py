"""Super Admin — rapports & analyses, finances, annonces, santé de la plateforme, audit & améliorations."""
import csv
import io
import os
import shutil
import time
from datetime import datetime, timedelta

from flask import Response, abort, current_app, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func, or_, text

from app import db
from app.models import (Announcement, AuditLog, Contract, ContractPayment, Conversation, ImprovementTask, Payment,
                        SystemNotification, User)
from app.routes.superadmin import _check_csrf, _paginate, superadmin_bp
from app.services import platform_analytics as pa
from app.services.activity import notify_super_admin, record
from app.services.dashboard_kpis import PERIODS
from app.services.permissions import role_labels, staff_roles, super_admin_only
from app.utils.security import csrf_protect

PERIOD_CHOICES = [('today', "Aujourd'hui"), ('7d', '7 jours'), ('30d', '30 jours'), ('90d', '90 jours'),
                  ('year', 'Cette année'), ('custom', 'Personnalisée')]


def _csv(filename, header, rows):
    out = io.StringIO()
    w = csv.writer(out, delimiter=';')
    w.writerow(header)
    w.writerows(rows)
    record('REPORT_EXPORTED', 'security', meta={'fichier': filename, 'filtres': dict(request.args)})
    return Response('﻿' + out.getvalue(), mimetype='text/csv; charset=utf-8',
                    headers={'Content-Disposition': f'attachment; filename={filename}'})


# ── Rapports & analyses ──────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/analytics')
@login_required
@super_admin_only
def analytics():
    if request.args.get('export') == 'csv':
        period, rows = pa.export_rows(request.args)
        return _csv(f'rapport-3m-{datetime.now():%Y%m%d}.csv', ['Indicateur', 'Valeur'], rows)
    period, kpis, charts = pa.build(request.args)
    return render_template('superadmin/analytics.html', period=period, kpis=kpis, charts=charts,
                           periods=PERIOD_CHOICES, services=pa.SERVICES, booking_status=pa.BOOKING_STATUS,
                           payment_status=pa.PAYMENT_STATUS)


# ── Paiements & finances ─────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/finance')
@login_required
@super_admin_only
def finance():
    from app.services.dashboard_kpis import resolve_period
    period = resolve_period(request.args)
    tx = pa.transactions(period['start'], period['end'])
    status, kind, method = request.args.get('status', ''), request.args.get('kind', ''), request.args.get('method', '')
    rows = [t for t in tx if (not status or t['status'] == status) and (not kind or t['kind'] == kind)
            and (not method or t['method'] == method)]
    if request.args.get('export') == 'csv':
        return _csv(f'transactions-{datetime.now():%Y%m%d}.csv',
                    ['Date (UTC)', 'Type', 'Libellé', 'Montant (FCFA)', 'Statut', 'Moyen', 'Référence'],
                    [(t['date'].strftime('%d/%m/%Y %H:%M'), 'Réservation' if t['kind'] == 'payment' else 'Contrat',
                      t['label'], round(t['amount']), pa.PAYMENT_STATUS.get(t['status'], t['status']), t['method'],
                      t['reference'] or '') for t in rows])
    ok = [t for t in tx if t['status'] == 'completed']
    summary = {
        'count': len(tx), 'completed': len(ok), 'failed': sum(1 for t in tx if t['status'] == 'failed'),
        'pending': sum(1 for t in tx if t['status'] == 'pending'),
        'refunded': sum(1 for t in tx if t['status'] == 'refunded'),
        'refunded_amount': sum(t['amount'] for t in tx if t['status'] == 'refunded'),
        'gross': sum(t['amount'] for t in ok if not t.get('deposit')),
        'deposits': sum(t['amount'] for t in ok if t.get('deposit')),
    }
    rev = pa.revenue_between(None, period['start'], period['end'])
    methods = {}
    for t in ok:
        methods[t['method']] = methods.get(t['method'], 0) + t['amount']
    page = max(1, request.args.get('page', 1, type=int))
    per = 30
    pg = {'page': page, 'pages': max(1, -(-len(rows) // per)), 'total': len(rows)}
    return render_template('superadmin/finance.html', period=period, periods=PERIOD_CHOICES, summary=summary,
                           rev=rev, methods=sorted(methods.items(), key=lambda x: -x[1]), outstanding=pa.outstanding(),
                           rows=rows[(page - 1) * per: page * per], pg=pg, statuses=pa.PAYMENT_STATUS,
                           all_methods=sorted({t['method'] for t in tx}))


@superadmin_bp.route('/superadmin/finance/<kind>/<int:tid>')
@login_required
@super_admin_only
def transaction_detail(kind, tid):
    if kind == 'payment':
        p = db.get_or_404(Payment, tid)
        booking = None
        try:
            from app.models import Booking
            booking = db.session.get(Booking, p.booking_id) if p.booking_id else None
        except Exception:
            pass
        tx = {'kind': kind, 'id': p.id, 'date': p.created_at, 'amount': p.amount, 'status': p.status,
              'method': p.payment_method, 'reference': p.transaction_id,
              'label': f'Réservation #{p.booking_id}' if p.booking_id else 'Paiement', 'booking': booking}
    elif kind == 'contract':
        p = db.get_or_404(ContractPayment, tid)
        tx = {'kind': kind, 'id': p.id, 'date': p.paid_at, 'amount': p.amount,
              'status': 'refunded' if p.is_void else 'completed', 'method': p.method, 'reference': p.reference,
              'label': p.contract.reference if p.contract else 'Contrat', 'contract': p.contract, 'note': p.note,
              'deposit': p.is_deposit, 'void_reason': p.void_reason, 'voided_at': p.voided_at}
    else:
        abort(404)
    history = AuditLog.query.filter(AuditLog.target_type == ('Payment' if kind == 'payment' else 'ContractPayment'),
                                    AuditLog.target_id == tid).order_by(AuditLog.created_at.desc()).all()
    return render_template('superadmin/transaction_detail.html', tx=tx, history=history, statuses=pa.PAYMENT_STATUS)


# ── Annonces ─────────────────────────────────────────────────────────────────
def _recipients(audience):
    q = User.query.filter(User.is_deleted == False)  # noqa: E712
    if audience == 'staff':
        q = q.filter(User.role.in_(['super_admin'] + list(staff_roles())))
    elif audience == 'clients':
        q = q.filter(User.role == 'client')
    elif audience.startswith('role:'):
        q = q.filter(User.role == audience[5:])
    elif audience != 'all':
        return []
    return [u for u in q.all() if u.is_active]


@superadmin_bp.route('/superadmin/announcements', methods=['GET', 'POST'])
@login_required
@super_admin_only
def announcements():
    if request.method == 'POST':
        _check_csrf()
        title = (request.form.get('title') or '').strip()[:150]
        body = (request.form.get('body') or '').strip()[:4000]
        audience = request.form.get('audience', '')
        channels = [c for c in request.form.getlist('channels') if c in ('in_app', 'email')] or ['in_app']
        if len(title) < 3 or len(body) < 3:
            flash('Titre et message obligatoires.', 'danger')
            return redirect(url_for('superadmin.announcements'))
        users = _recipients(audience)
        if not users:
            flash('Aucun destinataire pour ce public.', 'warning')
            return redirect(url_for('superadmin.announcements'))
        ann = Announcement(title=title, body=body, audience=audience, channels=','.join(channels),
                           module=(request.form.get('module') or None), recipients=len(users),
                           created_by_id=current_user.id)
        db.session.add(ann)
        db.session.flush()
        if 'in_app' in channels:
            for u in users:
                db.session.add(SystemNotification(user_id=u.id, title=f'📢 {title}', message=body, type='info',
                                                  category='announcement',
                                                  role_target='client' if u.role == 'client' else None))
        sent = failed = 0
        if 'email' in channels:
            from html import escape
            from app.services.email_service import send_email
            for u in users:
                email = (u.email or '').strip()
                if not email or email.endswith('.invalid') or email.endswith('visiteur.3mservices.cm'):
                    continue
                try:
                    if send_email(email, title, f'<p>{escape(body).replace(chr(10), "<br>")}</p>', body, user_id=u.id):
                        sent += 1
                    else:
                        failed += 1
                except Exception:
                    failed += 1
        ann.emails_sent, ann.emails_failed = sent, failed
        record('ANNOUNCEMENT_SENT', 'settings', 'Announcement', ann.id, title,
               meta={'public': audience, 'canaux': channels, 'destinataires': len(users), 'emails_envoyes': sent,
                     'emails_echoues': failed}, commit=False)
        db.session.commit()
        msg = f'Annonce publiée pour {len(users)} destinataire(s).'
        if 'email' in channels:
            msg += f' E-mails : {sent} envoyé(s), {failed} échec(s).'
        flash(msg, 'success' if not failed else 'warning')
        return redirect(url_for('superadmin.announcements'))
    items, pg = _paginate(Announcement.query.order_by(Announcement.created_at.desc()), 20)
    audiences = [('all', 'Tout le monde'), ('staff', 'Toute l’équipe'), ('clients', 'Tous les clients')] + \
                [(f'role:{k}', f'Rôle : {v}') for k, v in staff_roles().items()]
    counts = {a: len(_recipients(a)) for a, _ in audiences}
    mail_ready = bool(current_app.config.get('MAIL_PASSWORD'))
    return render_template('superadmin/announcements.html', items=items, pg=pg, audiences=audiences, counts=counts,
                           mail_ready=mail_ready, audience_labels=dict(audiences))


# ── Santé de la plateforme ───────────────────────────────────────────────────
def _check(name, fn):
    t0 = time.perf_counter()
    try:
        state, detail = fn()
    except Exception as e:  # noqa: BLE001
        current_app.logger.warning(f'[health] {name}: {e}')
        state, detail = 'down', 'Indisponible'
    return {'name': name, 'state': state, 'detail': detail, 'ms': round((time.perf_counter() - t0) * 1000)}


def health_checks():
    checks = []

    def database():
        db.session.execute(text('SELECT 1'))
        t0 = time.perf_counter()
        n = User.query.count()
        ms = (time.perf_counter() - t0) * 1000
        return ('ok' if ms < 200 else 'warn'), f'{n} comptes · requête test {ms:.0f} ms'
    checks.append(_check('Base de données', database))

    def node_api():
        import requests
        url = (current_app.config.get('NODE_API_URL') or '').rstrip('/') + '/health'
        r = requests.get(url, timeout=3)
        return ('ok' if r.ok else 'warn'), f'API du site (Node) : HTTP {r.status_code}'
    checks.append(_check('API du site (chat, réservations)', node_api))

    def chat_file():
        path = current_app.config['EXPRESS_DB_JSON']
        import json
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        age = (time.time() - os.path.getmtime(path)) / 60
        return 'ok', f"Fichier partagé lisible · {len(data.get('chats', []))} fil(s) · modifié il y a {age:.0f} min"
    checks.append(_check('Données partagées du site', chat_file))

    def disk():
        usage = shutil.disk_usage(current_app.instance_path)
        free = usage.free / usage.total * 100
        db_path = db.engine.url.database or ''
        size = os.path.getsize(db_path) / 1e6 if db_path and os.path.exists(db_path) else 0
        return ('ok' if free > 15 else 'warn' if free > 5 else 'down'), f'{free:.0f} % libre · base {size:.1f} Mo'
    checks.append(_check('Stockage', disk))

    def mail():
        cfg = current_app.config
        if not cfg.get('MAIL_SERVER') or not cfg.get('MAIL_PASSWORD'):
            return 'warn', 'Messagerie non configurée (MAIL_PASSWORD vide) : les e-mails ne partent pas'
        from app.models import EmailLog
        last = EmailLog.query.order_by(EmailLog.id.desc()).first()
        return 'ok', f'Configurée · dernier envoi : {getattr(last, "status", "—") if last else "aucun"}'
    checks.append(_check('E-mails', mail))

    def payments():
        return 'na', 'Aucun prestataire de paiement en ligne intégré : paiements saisis manuellement'
    checks.append(_check('Paiement en ligne', payments))

    def errors():
        path = os.path.join(os.path.dirname(current_app.root_path), 'logs', 'error.log')
        if not os.path.exists(path):
            return 'ok', 'Aucune erreur serveur enregistrée'
        since = time.time() - 86400
        with open(path, encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()[-2000:]
        recent = [l for l in lines if l[:4].isdigit()]
        count = 0
        for l in recent:
            try:
                if datetime.strptime(l[:19], '%Y-%m-%d %H:%M:%S').timestamp() >= since:
                    count += 1
            except ValueError:
                pass
        return ('ok' if count == 0 else 'warn' if count < 20 else 'down'), f'{count} erreur(s) serveur sur 24 h'
    checks.append(_check('Erreurs applicatives', errors))

    def security():
        cfg = current_app.config
        issues = []
        if cfg.get('SECRET_KEY') == 'dev-only-insecure-key':
            issues.append('SECRET_KEY de développement')
        if cfg.get('APP_ENV') != 'production':
            issues.append('APP_ENV ≠ production')
        if not cfg.get('INTERNAL_API_TOKEN'):
            issues.append('INTERNAL_API_TOKEN vide')
        return ('ok' if not issues else 'warn'), ('Configuration sûre' if not issues else ' · '.join(issues))
    checks.append(_check('Configuration de sécurité', security))
    return checks


def data_audit():
    """Incohérences détectées dans les données (lecture seule)."""
    findings = []
    dup = db.session.query(User.phone_key, func.count()).filter(User.role == 'client', User.is_deleted == False,  # noqa: E712
                                                                User.phone_key != None).group_by(User.phone_key).having(func.count() > 1).count()  # noqa: E711
    if dup:
        findings.append(('high', 'Clients', f'{dup} numéro(s) de téléphone partagé(s) par plusieurs fiches client'))
    no_code = User.query.filter(User.role == 'client', User.client_code == None, User.is_deleted == False).count()  # noqa: E711,E712
    if no_code:
        findings.append(('medium', 'Clients', f'{no_code} client(s) sans identifiant permanent'))
    orphan = Conversation.query.filter(Conversation.client_id == None).count()  # noqa: E711
    if orphan:
        findings.append(('low', 'Conversations', f'{orphan} conversation(s) sans fiche client (coordonnées non fournies)'))
    late = Conversation.query.filter(Conversation.status.in_(('new', 'open')), Conversation.last_sender == 'client',
                                     Conversation.last_client_message_at < datetime.utcnow() - timedelta(hours=24)).count()
    if late:
        findings.append(('high', 'Conversations', f'{late} conversation(s) sans réponse depuis plus de 24 h'))
    unassigned = Conversation.query.filter(Conversation.status.in_(('new', 'open', 'pending')),
                                           Conversation.assigned_admin_id == None).count()  # noqa: E711
    if unassigned:
        findings.append(('medium', 'Conversations', f'{unassigned} conversation(s) active(s) non assignée(s)'))
    staff = User.query.filter(User.role.in_(list(staff_roles()))).count()
    if staff == 0:
        findings.append(('medium', 'Équipe', 'Aucun compte administrateur : seul le Super Admin traite les demandes'))
    supers = User.query.filter(User.role == 'super_admin', User.is_deleted == False).count()  # noqa: E712
    if supers < 2:
        findings.append(('medium', 'Sécurité', 'Un seul Super Admin : prévoir un second compte de secours'))
    overdue = 0
    try:
        from app.models import Invoice
        overdue = Invoice.query.filter(Invoice.status.notin_(('paid', 'cancelled', 'draft')),
                                       Invoice.due_date < datetime.utcnow().date()).count()
    except Exception:
        pass
    if overdue:
        findings.append(('high', 'Factures', f'{overdue} facture(s) échue(s) non réglée(s)'))
    return findings


@superadmin_bp.route('/superadmin/health')
@login_required
@super_admin_only
def health():
    checks = health_checks()
    findings = data_audit()
    failed_logins = AuditLog.query.filter(AuditLog.action == 'LOGIN_FAILED',
                                          AuditLog.created_at >= datetime.utcnow() - timedelta(hours=24)).count()
    info = {'version': current_app.config.get('APP_VERSION') or _git_version(), 'env': current_app.config.get('APP_ENV'),
            'python': os.sys.version.split()[0], 'failed_logins': failed_logins,
            'audit_rows': AuditLog.query.count()}
    return render_template('superadmin/health.html', checks=checks, findings=findings, info=info)


def _git_version():
    try:
        import subprocess
        out = subprocess.run(['git', 'log', '-1', '--format=%h · %cd', '--date=format:%d/%m/%Y'],
                             capture_output=True, text=True, timeout=2, cwd=current_app.root_path)
        return out.stdout.strip() or '—'
    except Exception:
        return '—'


# ── Audit & améliorations ────────────────────────────────────────────────────
SEVERITIES = {'critical': 'Critique', 'high': 'Élevée', 'medium': 'Moyenne', 'low': 'Faible'}
TASK_STATUSES = {'open': 'À traiter', 'in_progress': 'En cours', 'done': 'Corrigé', 'wont_fix': 'Non retenu'}
COMPLEXITY = {'small': 'Faible', 'medium': 'Moyenne', 'large': 'Élevée'}
TASK_MODULES = ['Sécurité', 'Clients', 'Conversations', 'Réservations', 'Flotte', 'Résidences', 'Contrats',
                'Factures', 'Paiements', 'Site web', 'Interface', 'Infrastructure', 'Autre']


@superadmin_bp.route('/superadmin/improvements', methods=['GET', 'POST'])
@login_required
@super_admin_only
def improvements():
    if request.method == 'POST':
        _check_csrf()
        title = (request.form.get('title') or '').strip()[:160]
        sev = request.form.get('severity')
        if len(title) < 4 or sev not in SEVERITIES:
            flash('Titre (4 caractères min.) et sévérité obligatoires.', 'danger')
            return redirect(url_for('superadmin.improvements'))
        assignee = request.form.get('assignee_id', type=int)
        t = ImprovementTask(title=title, severity=sev, module=request.form.get('module') or None,
                            business_impact=(request.form.get('business_impact') or '').strip()[:2000] or None,
                            technical_impact=(request.form.get('technical_impact') or '').strip()[:2000] or None,
                            recommendation=(request.form.get('recommendation') or '').strip()[:4000] or None,
                            complexity=request.form.get('complexity') if request.form.get('complexity') in COMPLEXITY else None,
                            priority=request.form.get('priority', type=int) or {'critical': 1, 'high': 2, 'medium': 3, 'low': 4}[sev],
                            status='open', source=request.form.get('source') or 'manual',
                            assignee_id=assignee if assignee and db.session.get(User, assignee) else None,
                            created_by_id=current_user.id)
        db.session.add(t)
        db.session.flush()
        record('IMPROVEMENT_CREATED', 'settings', 'ImprovementTask', t.id, title, meta={'severite': sev}, commit=False)
        db.session.commit()
        flash('Tâche d’amélioration créée.', 'success')
        return redirect(url_for('superadmin.improvements'))
    q = ImprovementTask.query
    st = request.args.get('status', 'active')
    if st == 'active':
        q = q.filter(ImprovementTask.status.in_(('open', 'in_progress')))
    elif st in TASK_STATUSES:
        q = q.filter(ImprovementTask.status == st)
    if request.args.get('severity') in SEVERITIES:
        q = q.filter(ImprovementTask.severity == request.args['severity'])
    if request.args.get('module'):
        q = q.filter(ImprovementTask.module == request.args['module'])
    order = db.case((ImprovementTask.severity == 'critical', 0), (ImprovementTask.severity == 'high', 1),
                    (ImprovementTask.severity == 'medium', 2), else_=3)
    items, pg = _paginate(q.order_by(order, ImprovementTask.priority, ImprovementTask.created_at.desc()), 25)
    counts = dict(db.session.query(ImprovementTask.severity, func.count()).filter(
        ImprovementTask.status.in_(('open', 'in_progress'))).group_by(ImprovementTask.severity).all())
    staff = User.query.filter(User.role.in_(['super_admin'] + list(staff_roles())), User.is_deleted == False).all()  # noqa: E712
    return render_template('superadmin/improvements.html', items=items, pg=pg, counts=counts, findings=data_audit(),
                           severities=SEVERITIES, statuses=TASK_STATUSES, complexity=COMPLEXITY, modules=TASK_MODULES,
                           staff=staff)


@superadmin_bp.route('/superadmin/improvements/<int:tid>', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def improvement_update(tid):
    t = db.get_or_404(ImprovementTask, tid)
    before = {'statut': t.status, 'responsable': t.assignee_id}
    status = request.form.get('status')
    if status in TASK_STATUSES:
        t.status = status
        t.resolved_at = datetime.utcnow() if status in ('done', 'wont_fix') else None
    if 'assignee_id' in request.form:
        a = request.form.get('assignee_id', type=int)
        t.assignee_id = a if a and db.session.get(User, a) else None
    t.updated_at = datetime.utcnow()
    record('IMPROVEMENT_UPDATED', 'settings', 'ImprovementTask', t.id, t.title,
           meta={'avant': before, 'apres': {'statut': t.status, 'responsable': t.assignee_id}}, commit=False)
    db.session.commit()
    flash('Tâche mise à jour.', 'success')
    return redirect(request.referrer or url_for('superadmin.improvements'))
