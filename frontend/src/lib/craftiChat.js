const SESSION_STORAGE_KEY = "crafti_chat_session_id";
const DEFAULT_TIMEOUT_MS = 120000;

const backendUrl =
  process.env.REACT_APP_BACKEND_URL !== undefined
    ? process.env.REACT_APP_BACKEND_URL
    : "http://localhost:8000";

export const getChatApiBase = () => `${backendUrl}/api/v1`;

export function getChatSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return crypto.randomUUID();
  }
}

export function resetChatSessionId() {
  const sessionId = crypto.randomUUID();
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Private mode or blocked storage: keep the in-memory id for this turn.
  }
  return sessionId;
}

export function userMessageForStatus(status, messages = {}) {
  switch (status) {
    case 400:
      return messages[400] ?? "Votre question est invalide.";
    case 401:
    case 503:
      return messages[401] ?? "Le chatbot doit être reconfiguré.";
    case 403:
      return messages[403] ?? "Ce site n’est pas autorisé.";
    case 429:
      return messages[429] ?? "Trop de demandes. Réessayez dans un instant.";
    case 502:
      return messages[502] ?? "Le chatbot est temporairement indisponible.";
    default:
      return messages.default ?? "Une erreur inattendue est survenue.";
  }
}

class ChatRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ChatRequestError";
    this.status = status;
  }
}

async function readErrorPayload(response) {
  const payload = await response.json().catch(() => ({
    detail: "Réponse serveur illisible.",
  }));
  return payload.detail ?? `Erreur HTTP ${response.status}`;
}

export async function askCrafti(message, options = {}) {
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal ?? controller.signal;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => {
    if (controller) controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${getChatApiBase()}/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message,
        session_id: options.sessionId ?? getChatSessionId(),
        language: options.language ?? "fr",
        ...(options.category ? { category: options.category } : {}),
      }),
      signal,
    });
    const payload = await response.json().catch(() => ({
      detail: "Réponse serveur illisible.",
    }));
    if (!response.ok) {
      throw new ChatRequestError(
        payload.detail ?? `Erreur HTTP ${response.status}`,
        response.status
      );
    }
    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function streamCraftiAnswer(message, handlers = {}) {
  const sessionId = handlers.sessionId ?? getChatSessionId();
  const controller = handlers.controller ?? new AbortController();
  const timeoutMs = handlers.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getChatApiBase()}/chat/stream/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        language: handlers.language ?? "fr",
        ...(handlers.category ? { category: handlers.category } : {}),
      }),
      signal: handlers.signal ?? controller.signal,
    });

    if (!response.ok) {
      throw new ChatRequestError(await readErrorPayload(response), response.status);
    }
    if (!response.body) {
      throw new ChatRequestError("Streaming non supporté par ce navigateur.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let completeAnswer = "";
    handlers.onBegin?.({ sessionId, controller });

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === "item") {
          completeAnswer += event.content ?? "";
          handlers.onToken?.(event.content, completeAnswer);
        } else if (event.type === "error") {
          throw new ChatRequestError(event.message ?? "Erreur de génération.");
        } else if (event.type === "end") {
          handlers.onEnd?.(completeAnswer);
        }
      }

      if (done) break;
    }

    if (buffer.trim()) {
      const event = JSON.parse(buffer);
      if (event.type === "item") {
        completeAnswer += event.content ?? "";
        handlers.onToken?.(event.content, completeAnswer);
      } else if (event.type === "error") {
        throw new ChatRequestError(event.message ?? "Erreur de génération.");
      } else if (event.type === "end") {
        handlers.onEnd?.(completeAnswer);
      }
    }

    return { answer: completeAnswer, sessionId, controller };
  } finally {
    clearTimeout(timeoutId);
  }
}
