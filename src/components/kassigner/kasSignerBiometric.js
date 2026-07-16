// kasSignerBiometric.js
// WebAuthn-based biometric gate for KasSigner. The private key stays in
// localStorage. Before signing, the user must verify via FaceID/TouchID/PIN.
// Falls back gracefully if WebAuthn or a platform authenticator is unavailable.

const CRED_ID_KEY = "kassigner_biometric_cred_id";

export function isBiometricAvailable() {
  return typeof window !== "undefined" && "credentials" in navigator && window.PublicKeyCredential !== undefined;
}

export async function isBiometricCapable() {
  if (!isBiometricAvailable()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

export function hasBiometricCredential() {
  return !!localStorage.getItem(CRED_ID_KEY);
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Register a platform credential (FaceID/TouchID/PIN).
// Called when a key is saved. Silently skips if WebAuthn is not available
// or the user denies the biometric prompt.
export async function registerBiometric() {
  if (!isBiometricAvailable() || !(await isBiometricCapable())) return false;
  if (hasBiometricCredential()) return true;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "KasSigner" },
        user: { id: userId, name: "kassigner", displayName: "KasSigner Air-Gapped" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    });

    if (credential && credential.rawId) {
      localStorage.setItem(CRED_ID_KEY, bufToBase64(credential.rawId));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Trigger FaceID / TouchID / PIN verification.
// Returns true on success, throws an Error on cancellation or failure.
export async function verifyBiometric() {
  if (!isBiometricAvailable()) {
    throw new Error("Biometric authentication not available on this device.");
  }
  if (!hasBiometricCredential()) {
    throw new Error("No biometric credential registered. Generate or import a key first.");
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: [{
        type: "public-key",
        id: base64ToBuf(localStorage.getItem(CRED_ID_KEY)),
      }],
    },
  });

  if (!assertion) throw new Error("Biometric verification failed.");
  return true;
}

export function clearBiometric() {
  localStorage.removeItem(CRED_ID_KEY);
}