import type { AiProviderId } from "@/modules/summaries/types/summary.types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const storagePrefix = "classvault.ai-key";

async function getKeyMaterial() {
  return crypto.subtle.importKey("raw", encoder.encode(navigator.userAgent), "PBKDF2", false, ["deriveKey"]);
}

async function getCryptoKey(salt: Uint8Array) {
  const material = await getKeyMaterial();
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuffer, iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export async function saveLocalApiKey(provider: AiProviderId, apiKey: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getCryptoKey(salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, encoder.encode(apiKey));
  localStorage.setItem(
    `${storagePrefix}.${provider}`,
    JSON.stringify({ salt: toBase64(salt), iv: toBase64(iv), encrypted: toBase64(new Uint8Array(encrypted)) })
  );
}

export async function readLocalApiKey(provider: AiProviderId) {
  const raw = localStorage.getItem(`${storagePrefix}.${provider}`);
  if (!raw) return null;
  const payload = JSON.parse(raw) as { salt: string; iv: string; encrypted: string };
  const key = await getCryptoKey(fromBase64(payload.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv).buffer as ArrayBuffer },
    key,
    fromBase64(payload.encrypted)
  );
  return decoder.decode(decrypted);
}

export function removeLocalApiKey(provider: AiProviderId) {
  localStorage.removeItem(`${storagePrefix}.${provider}`);
}
