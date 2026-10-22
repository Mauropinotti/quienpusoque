/**
 * Acceso defensivo a localStorage compartido por todos los módulos de storage.
 *
 * Antes cada lectura/escritura probaba el storage escribiendo y borrando una
 * clave de prueba (2 operaciones extra por llamada). Ahora el sondeo se hace
 * una sola vez por instancia de Storage y el resultado queda cacheado.
 */

const PROBE_KEY = "quien-puso-que:probe";

let probedStorage: Storage | null = null;
let probedResult = false;

export function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  let storage: Storage;
  try {
    // Leer window.localStorage puede tirar SecurityError (cookies bloqueadas,
    // iframes sandbox, modo privado estricto).
    storage = window.localStorage;
  } catch {
    return null;
  }
  if (!storage) return null;

  if (storage !== probedStorage) {
    probedStorage = storage;
    try {
      storage.setItem(PROBE_KEY, "1");
      storage.removeItem(PROBE_KEY);
      probedResult = true;
    } catch {
      probedResult = false;
    }
  }

  return probedResult ? storage : null;
}

export function readStorageJson(key: string): unknown {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeStorageString(key: string, value: string): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageKey(key: string): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
