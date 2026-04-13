const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
};

const fromBase64 = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
};

const wrapPem = (label, base64) => {
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
};

const unwrapPem = (pem) =>
  pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

export const getStoredE2eeKeys = (userId) => {
  if (!userId) {
    return { publicKeyPem: null, privateKeyPem: null };
  }

  return {
    publicKeyPem: localStorage.getItem(`e2ee_public_${userId}`),
    privateKeyPem: localStorage.getItem(`e2ee_private_${userId}`),
  };
};

export const generateAndStoreE2eeKeys = async (userId) => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const [publicKeyBuffer, privateKeyBuffer] = await Promise.all([
    window.crypto.subtle.exportKey("spki", keyPair.publicKey),
    window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  const publicKeyPem = wrapPem("PUBLIC KEY", toBase64(publicKeyBuffer));
  const privateKeyPem = wrapPem("PRIVATE KEY", toBase64(privateKeyBuffer));

  localStorage.setItem(`e2ee_public_${userId}`, publicKeyPem);
  localStorage.setItem(`e2ee_private_${userId}`, privateKeyPem);

  return { publicKeyPem, privateKeyPem };
};

export const importPublicKey = async (pem) =>
  window.crypto.subtle.importKey(
    "spki",
    fromBase64(unwrapPem(pem)),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

export const importPrivateKey = async (pem) =>
  window.crypto.subtle.importKey(
    "pkcs8",
    fromBase64(unwrapPem(pem)),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

export const encryptForRecipient = async (content, publicKeyPem) => {
  const publicKey = await importPublicKey(publicKeyPem);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoder.encode(content)
  );

  return toBase64(encrypted);
};

export const decryptCiphertext = async (ciphertext, privateKeyPem) => {
  const privateKey = await importPrivateKey(privateKeyPem);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    fromBase64(ciphertext)
  );

  return decoder.decode(decrypted);
};
