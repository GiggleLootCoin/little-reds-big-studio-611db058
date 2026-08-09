export type PasskeyCredential = {
  id: string;
  publicKey: string;
  createdAt: string;
};

const STORAGE_KEY = "little-reds-passkey-credentials";

function getCredentials(): PasskeyCredential[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as PasskeyCredential[];
  } catch {
    return [];
  }
}

function saveCredentials(credentials: PasskeyCredential[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomChallenge(size = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

export function supportsPasskeys(): boolean {
  return typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    typeof PublicKeyCredential !== "undefined";
}

export async function registerPasskey(userName: string): Promise<PasskeyCredential> {
  if (!supportsPasskeys()) throw new Error("Passkeys are not supported on this device or browser.");

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "Little Red's Big Studio" },
      user: {
        id: randomChallenge(16),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    },
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("The device did not return a valid passkey credential.");
  }

  const record: PasskeyCredential = {
    id: base64url(new Uint8Array(credential.rawId)),
    publicKey: "device-managed",
    createdAt: new Date().toISOString(),
  };

  saveCredentials([...getCredentials(), record]);
  return record;
}

export async function authenticateWithPasskey(): Promise<boolean> {
  if (!supportsPasskeys()) return false;

  const credentials = getCredentials();
  if (!credentials.length) return false;

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      userVerification: "required",
      timeout: 60000,
      allowCredentials: credentials.map((credential) => ({
        id: Uint8Array.from(atob(credential.id.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)),
        type: "public-key",
      })),
    },
  });

  return assertion instanceof PublicKeyCredential;
}
