/* Comportement commun de tous les formulaires 3M SERVICES :
   messages d'erreur en français sous le champ, champs obligatoires signalés,
   affichage du mot de passe, protection contre le double envoi. */
(function () {
    'use strict';
    var TYPES = { email: 'adresse e-mail', url: 'adresse web', tel: 'numéro de téléphone', number: 'nombre', date: 'date' };

    function message(el) {
        var v = el.validity;
        if (v.valueMissing) {
            if (el.type === 'checkbox' || el.type === 'radio') return 'Veuillez cocher cette case.';
            if (el.tagName === 'SELECT') return 'Veuillez choisir une option.';
            if (el.type === 'file') return 'Veuillez choisir un fichier.';
            return 'Ce champ est obligatoire.';
        }
        if (v.typeMismatch || v.badInput) return 'Veuillez saisir une ' + (TYPES[el.type] || 'valeur') + ' valide.';
        if (v.tooShort) return 'Au moins ' + el.minLength + ' caractères sont nécessaires.';
        if (v.tooLong) return 'Maximum ' + el.maxLength + ' caractères.';
        if (v.rangeUnderflow) return el.type === 'date' ? 'La date doit être postérieure ou égale au ' + fr(el.min) + '.' : 'La valeur minimale est ' + el.min + '.';
        if (v.rangeOverflow) return el.type === 'date' ? 'La date doit être antérieure ou égale au ' + fr(el.max) + '.' : 'La valeur maximale est ' + el.max + '.';
        if (v.stepMismatch) return 'Valeur non autorisée.';
        if (v.patternMismatch) return el.title || 'Le format saisi n’est pas valide.';
        return el.validationMessage;
    }
    function fr(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }

    function holder(el) { return el.closest('.input-group') || el.closest('.form-check') || el; }

    function showError(el) {
        clearError(el);
        el.classList.add('fx-invalid');
        el.setAttribute('aria-invalid', 'true');
        var node = document.createElement('div');
        node.className = 'fx-error';
        node.id = 'fx-' + Math.random().toString(36).slice(2, 8);
        node.textContent = message(el);
        el.setAttribute('aria-describedby', node.id);
        holder(el).insertAdjacentElement('afterend', node);
        el._fxError = node;
    }
    function clearError(el) {
        el.classList.remove('fx-invalid');
        el.removeAttribute('aria-invalid');
        if (el._fxError) { el._fxError.remove(); el._fxError = null; el.removeAttribute('aria-describedby'); }
    }

    // Remplace la bulle du navigateur (langue du navigateur) par un message français sous le champ
    document.addEventListener('invalid', function (e) {
        var el = e.target;
        if (!el.form || el.form.hasAttribute('data-native-validation')) return;
        e.preventDefault();
        showError(el);
        if (!el.form._fxFocusing) {
            el.form._fxFocusing = true;
            // Onglet ou section masquée : l'ouvrir avant de donner le focus
            var pane = el.closest('.tab-pane, .collapse');
            if (pane && !pane.classList.contains('show') && window.bootstrap) {
                var trigger = document.querySelector('[data-bs-target="#' + pane.id + '"], [href="#' + pane.id + '"]');
                if (trigger) trigger.click();
            }
            setTimeout(function () {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                el.focus({ preventScroll: true });
                el.form._fxFocusing = false;
            }, 0);
        }
    }, true);
    ['input', 'change'].forEach(function (ev) {
        document.addEventListener(ev, function (e) {
            var el = e.target;
            if (el._fxError && el.checkValidity && el.validity.valid) clearError(el);
        }, true);
    });

    // Anti double envoi : bouton désactivé avec indicateur jusqu'au chargement de la page suivante
    function unlock(form) {
        form.dataset.fxBusy = '';
        form.querySelectorAll('[data-fx-locked]').forEach(function (b) {
            b.disabled = false; b.removeAttribute('data-fx-locked'); b.classList.remove('fx-loading');
        });
    }
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (form.dataset.fxBusy === '1') { e.preventDefault(); e.stopImmediatePropagation(); return; }
        var submitter = e.submitter;
        setTimeout(function () {
            if (e.defaultPrevented) return;                        // envoi géré par JavaScript
            var method = (form.getAttribute('method') || 'get').toLowerCase();
            if (method !== 'post' || form.target === '_blank' || form.hasAttribute('data-no-lock')) return;
            if (/export|download|pdf|csv/i.test(form.getAttribute('action') || '')) return;
            form.dataset.fxBusy = '1';
            var buttons = form.querySelectorAll('button[type=submit], button:not([type]), input[type=submit]');
            buttons.forEach(function (b) {
                if (b.disabled) return;
                b.disabled = true; b.setAttribute('data-fx-locked', '');
                if (b === submitter || buttons.length === 1) b.classList.add('fx-loading');
            });
            setTimeout(function () { unlock(form); }, 15000);        // sécurité si la page ne change pas
        }, 0);
    });
    window.addEventListener('pageshow', function () { document.querySelectorAll('form[data-fx-busy="1"]').forEach(unlock); });

    function enhance(root) {
        // Astérisque sur les libellés des champs obligatoires
        root.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (el) {
            if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden') return;
            var label = el.id ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]') : null;
            if (!label) {
                var box = el.closest('.mb-3, .col-md-6, .col-md-4, .col-12, .col-6, .ops-input-group, .form-group');
                label = box ? box.querySelector('label') : null;
            }
            if (label && !label.querySelector('.fx-req') && label.textContent.indexOf('*') === -1 && !label.contains(el)) {
                label.insertAdjacentHTML('beforeend', ' <span class="fx-req" aria-hidden="true">*</span>');
            }
        });
        // Bouton « afficher le mot de passe »
        root.querySelectorAll('input[type=password]').forEach(function (el) {
            if (el.dataset.fxEye || el.hasAttribute('data-no-eye') || el.offsetParent === null) return;
            if (el.parentElement.querySelector('button, .bi-eye, .bi-eye-slash')) return;   // déjà prévu par la page
            el.dataset.fxEye = '1';
            var wrap = document.createElement('div'); wrap.className = 'fx-password';
            el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
            var btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'fx-eye'; btn.setAttribute('aria-label', 'Afficher le mot de passe');
            btn.innerHTML = '<i class="bi bi-eye"></i>';
            btn.addEventListener('click', function () {
                var show = el.type === 'password';
                el.type = show ? 'text' : 'password';
                btn.innerHTML = '<i class="bi bi-eye' + (show ? '-slash' : '') + '"></i>';
                btn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
            });
            wrap.appendChild(btn);
        });
        // Clavier adapté sur mobile
        root.querySelectorAll('input[type=tel]:not([inputmode])').forEach(function (el) { el.setAttribute('inputmode', 'tel'); });
        root.querySelectorAll('input[type=number]:not([inputmode])').forEach(function (el) { el.setAttribute('inputmode', 'decimal'); });
    }

    document.addEventListener('DOMContentLoaded', function () { enhance(document); });
    document.addEventListener('shown.bs.modal', function (e) { enhance(e.target); });
    document.addEventListener('shown.bs.tab', function () { enhance(document); });
})();
