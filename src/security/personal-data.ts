import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function readKey(
  name: 'PII_ENCRYPTION_KEY' | 'PII_LOOKUP_KEY' | 'AUDIT_IP_KEY'
): Buffer {
  const encoded = process.env[name];
  if (!encoded) throw new Error(`Falta la variable de entorno ${name}.`);

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error(`${name} debe contener exactamente 32 bytes en Base64.`);
  }
  return key;
}

export function normalizarDni(dni: string): string {
  return dni.replace(/\D/g, '');
}

export function cifrarDatoPersonal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, readKey('PII_ENCRYPTION_KEY'), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function descifrarDatoPersonal(payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Formato de dato cifrado inválido.');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    readKey('PII_ENCRYPTION_KEY'),
    Buffer.from(ivValue, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function crearHuellaDni(dni: string): string {
  return createHmac('sha256', readKey('PII_LOOKUP_KEY'))
    .update(normalizarDni(dni))
    .digest('base64url');
}

export function crearHuellaIp(ip: string): string {
  return createHmac('sha256', readKey('AUDIT_IP_KEY'))
    .update(ip)
    .digest('base64url');
}
