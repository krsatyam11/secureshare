export const buf2hex = (buffer: Uint8Array) => Array.prototype.map.call(buffer, x => ('00' + x.toString(16)).slice(-2)).join('');
export const hex2buf = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

export async function encryptFile(file: File, expiryTime: number) {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const fileBuffer = await file.arrayBuffer();
  const encryptParams: AesGcmParams = { name: 'AES-GCM', iv: iv };
  if (expiryTime > 0) encryptParams.additionalData = new TextEncoder().encode(expiryTime.toString());
  const ciphertext = await crypto.subtle.encrypt(encryptParams, key, fileBuffer);
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(ciphertext), iv.length);
  return { encryptedBlob: new Blob([payload]), hexKey: buf2hex(rawKey) };
}

export async function decryptFile(encryptedData: ArrayBuffer, hexKey: string, expiryParam: string | null) {
  const data = new Uint8Array(encryptedData);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const rawKey = hex2buf(hexKey);
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  const decryptParams: AesGcmParams = { name: 'AES-GCM', iv: iv };
  if (expiryParam) decryptParams.additionalData = new TextEncoder().encode(expiryParam);
  return await crypto.subtle.decrypt(decryptParams, key, ciphertext);
}