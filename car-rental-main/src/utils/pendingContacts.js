// File d'attente des messages du formulaire de contact.
// Si la conciergerie est injoignable (réseau, serveur en redémarrage), le message est gardé
// sur l'appareil et renvoyé automatiquement : il n'est jamais perdu. Le serveur ignore les
// doublons grâce à requestId.
import { API_BASE } from "../config/api";

const KEY = "3m_pending_contacts";

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { return []; }
};
const save = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
};

export const pendingCount = () => load().length;

export function queueContact(payload) {
  const list = load().filter((p) => p.requestId !== payload.requestId);
  list.push({ ...payload, queuedAt: new Date().toISOString() });
  save(list);
}

// Envoie un message. Renvoie { ok, retry, error, data }.
export async function postContact(payload) {
  try {
    const resp = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) return { ok: true, data };
    // 4xx = message invalide (ne sert à rien de réessayer) ; 5xx = serveur indisponible
    return { ok: false, retry: resp.status >= 500, error: data.error };
  } catch (err) {
    return { ok: false, retry: true, error: err.message };
  }
}

let flushing = false;
export async function flushPendingContacts() {
  if (flushing) return 0;
  const list = load();
  if (!list.length) return 0;
  flushing = true;
  let sent = 0;
  try {
    const remaining = [];
    for (const p of list) {
      const { queuedAt, ...payload } = p;
      const r = await postContact(payload);
      if (r.ok) sent += 1;
      else if (r.retry) remaining.push(p);
    }
    save(remaining);
  } finally {
    flushing = false;
  }
  if (sent) window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { refresh: true } }));
  return sent;
}

// À appeler une fois au démarrage du site : renvoie dès que possible.
export function startPendingContactsSync() {
  flushPendingContacts();
  window.addEventListener("online", flushPendingContacts);
  const id = setInterval(() => { if (pendingCount()) flushPendingContacts(); }, 20000);
  return () => {
    window.removeEventListener("online", flushPendingContacts);
    clearInterval(id);
  };
}
