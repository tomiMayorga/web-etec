export function enlaceVerdeValido(valor: string): boolean {
  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(valor)) return true;
  if (/^\/(?!\/)[a-zA-Z0-9/_?=&.%#-]*$/.test(valor) && !valor.includes('..') && !/%(?:5c|0a|0d)/i.test(valor)) return true;
  try { const url = new URL(valor); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

