import api from "./api";

// In-memory cache for fast instant lookups during navigation
const cache = new Map();

const getCacheKey = (text, target, source) => `${source || "auto"}:${target}:${text.trim()}`;

/**
 * Direct client-side fallback if backend API is ever unreachable
 */
async function fallbackTranslateClient(text, targetLang, sourceLang = "auto") {
  try {
    const sl = sourceLang === "auto" ? "en" : sourceLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${sl}|${targetLang}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && !translated.startsWith("MYMEMORY WARNING")) {
        return translated;
      }
    }
  } catch (e) {
    console.warn("Client-side fallback translation failed:", e);
  }
  return text;
}

/**
 * Translate plain text using backend instant translator or client fallback
 */
export async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text || !text.trim()) return text;
  const target = (targetLang || "fr").toLowerCase();
  const source = (sourceLang || "auto").toLowerCase();

  if (target === source && source !== "auto") return text;

  const key = getCacheKey(text, target, source);
  if (cache.has(key)) {
    return cache.get(key);
  }

  // Check sessionStorage
  try {
    const sessionVal = sessionStorage.getItem(`trans_${key}`);
    if (sessionVal) {
      cache.set(key, sessionVal);
      return sessionVal;
    }
  } catch (_) {}

  try {
    const res = await api.post("/translate", {
      text,
      target_lang: target,
      source_lang: source,
    });
    const result = res.data?.translated_text || text;
    cache.set(key, result);
    try {
      sessionStorage.setItem(`trans_${key}`, result);
    } catch (_) {}
    return result;
  } catch (err) {
    console.warn("Backend translation API failed, trying client fallback:", err);
    const fallbackResult = await fallbackTranslateClient(text, target, source);
    cache.set(key, fallbackResult);
    return fallbackResult;
  }
}

/**
 * Translates a complete blog post (title, excerpt, and HTML content)
 */
export async function translateBlogPost(post, targetLang, sourceLang = "auto") {
  if (!post) return null;
  const target = (targetLang || "fr").toLowerCase();

  // Find best available source content
  let sourceTitle = "";
  let sourceExcerpt = "";
  let sourceContent = "";
  let detectedSourceLang = sourceLang;

  if (post.translations && post.translations.length > 0) {
    const existing = post.translations.find((t) => t.language === target && (t.title || t.content));
    if (existing) {
      return {
        ...existing,
        isAutoTranslated: false,
      };
    }
    // Pick base source translation
    const base =
      post.translations.find((t) => t.language === "fr" && (t.title || t.content)) ||
      post.translations.find((t) => t.language === "en" && (t.title || t.content)) ||
      post.translations[0];

    sourceTitle = base?.title || post.slug || "";
    sourceExcerpt = base?.excerpt || "";
    sourceContent = base?.content || "";
    if (detectedSourceLang === "auto" && base?.language) {
      detectedSourceLang = base.language;
    }
  } else {
    sourceTitle = post.title || post.slug || "";
    sourceExcerpt = post.excerpt || "";
    sourceContent = post.content || "";
  }

  const postKey = `post_${post.id || post.slug}_${target}`;
  if (cache.has(postKey)) {
    return cache.get(postKey);
  }

  try {
    const res = await api.post("/translate/post", {
      title: sourceTitle,
      excerpt: sourceExcerpt,
      content: sourceContent,
      target_lang: target,
      source_lang: detectedSourceLang || "auto",
    });

    const translatedPost = {
      title: res.data?.title || sourceTitle,
      excerpt: res.data?.excerpt || sourceExcerpt,
      content: res.data?.content || sourceContent,
      language: target,
      isAutoTranslated: true,
      originalLanguage: detectedSourceLang !== "auto" ? detectedSourceLang : "fr",
    };

    cache.set(postKey, translatedPost);
    return translatedPost;
  } catch (err) {
    console.warn("translateBlogPost API error, falling back to manual translation:", err);
    const [tTitle, tExcerpt] = await Promise.all([
      translateText(sourceTitle, target, detectedSourceLang),
      translateText(sourceExcerpt, target, detectedSourceLang),
    ]);

    const fallbackPost = {
      title: tTitle,
      excerpt: tExcerpt,
      content: sourceContent,
      language: target,
      isAutoTranslated: true,
      originalLanguage: detectedSourceLang !== "auto" ? detectedSourceLang : "fr",
    };
    cache.set(postKey, fallbackPost);
    return fallbackPost;
  }
}

export default {
  translateText,
  translateBlogPost,
};
