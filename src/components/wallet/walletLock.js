// Wallet lock utilities: PIN hashing + WebAuthn platform biometrics (Face ID / Android biometrics)
const PIN_KEY = 'ttt_wallet_pin_hash';
const BIO_KEY = 'ttt_wallet_bio_cred';
const UNLOCK_KEY = 'ttt_wallet_unlocked';

export async function hashPin(pin) {
  const data = new TextEncoder().encode('ttt-wallet::' + pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredPinHash() {
  try { return localStorage.getItem(PIN_KEY); } catch { return null; }
}

export function storePinHash(hash) {
  try { localStorage.setItem(PIN_KEY, hash); } catch {}
}

export function getBioCredId() {
  try { return localStorage.getItem(BIO_KEY); } catch { return null; }
}

export function isUnlocked() {
  try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
}

export function markUnlocked() {
  try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch {}
}

function toB64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromB64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function biometricAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'TTT Wallet', id: window.location.hostname },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'ttt-wallet-user',
        displayName: 'TTT Wallet',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });
  try { localStorage.setItem(BIO_KEY, toB64(cred.rawId)); } catch {}
}

export async function verifyBiometric() {
  const stored = getBioCredId();
  if (!stored) throw new Error('No biometric credential');
  await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [
        { type: 'public-key', id: fromB64(stored), transports: ['internal'] },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  return true;
}