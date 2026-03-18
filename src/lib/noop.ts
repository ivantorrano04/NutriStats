/**
 * @fileOverview Universal Proxy Shim Maestro v2.
 * Proporciona compatibilidad absoluta para dependencias de servidor en entornos estáticos.
 * Soporta herencia de clases y utilidades de rutas avanzadas para Turbopack.
 */

// Clases base reales para permitir 'extends'
class NoopEventEmitter {
  on() { return this; }
  once() { return this; }
  off() { return this; }
  emit() { return true; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
  setMaxListeners() { return this; }
}

class NoopStream extends NoopEventEmitter {}

const noop = () => {};
const asyncNoop = async () => {};

// Objeto base para el shim
const baseShim: any = {
  env: { NODE_ENV: 'production' },
  argv: [],
  version: 'v18.0.0',
  nextTick: (fn: Function) => setTimeout(fn, 0),
  stdout: { isTTY: false, write: noop, on: noop, fd: 1, _isStdio: true },
  stderr: { isTTY: false, write: noop, on: noop, fd: 2, _isStdio: true },
  stdin: { isTTY: false, read: noop, on: noop, fd: 0, _isStdio: true },
  pid: 1,
  cwd: () => '/',
  platform: 'browser',
  browser: true,
  exit: noop,
  on: noop,
  emit: noop,
  once: noop,
  removeListener: noop,
};

const handler: ProxyHandler<any> = {
  get: (target, prop) => {
    if (prop === 'default') return proxy;
    if (prop === '__esModule') return true;
    if (prop in target) return target[prop];
    return proxy;
  },
  apply: () => proxy,
  construct: () => proxy,
};

const proxy: any = new Proxy(baseShim, handler);

// Inyectar process global para librerías que lo requieran
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (!g.process) g.process = proxy;
}

// --- EXPORTACIONES NOMBRADAS REQUERIDAS POR TURBOPACK ---

// HTTP / NET / TLS
export const Agent = proxy;
export const get = proxy;
export const request = proxy;
export const createServer = proxy;
export const connect = proxy;
export const createConnection = proxy;
export const isIP = () => false;
export const isIPv4 = () => false;
export const isIPv6 = () => false;
export const lookup = noop;
export const TLSSocket = proxy;

// URL
export const URL = typeof window !== 'undefined' ? window.URL : proxy;
export const URLSearchParams = typeof window !== 'undefined' ? window.URLSearchParams : proxy;
export const format = (urlObj: any) => String(urlObj);

// CRYPTO
export const randomBytes = (size: number) => new Uint8Array(size);
export const randomUUID = () => '00000000-0000-0000-0000-000000000000';
export const createHash = proxy;
export const createHmac = proxy;

// FS / PATH
export const promises = proxy;
export const constants = proxy;
export const readFile = asyncNoop;
export const writeFile = asyncNoop;
export const readFileSync = () => '';
export const existsSync = () => false;
export const join = (...args: string[]) => args.join('/');
export const resolve = (...args: string[]) => args.join('/');
export const dirname = (p: string) => p;
export const basename = (p: string) => p;
export const extname = () => '';
export const isAbsolute = () => true;
export const sep = '/';
export const parse = (p: string) => ({
  root: '/',
  dir: p.split('/').slice(0, -1).join('/') || '.',
  base: p.split('/').pop() || '',
  ext: p.includes('.') ? '.' + p.split('.').pop() : '',
  name: p.split('/').pop()?.split('.').shift() || ''
});

// UTIL
export const inspect = (obj: any) => JSON.stringify(obj);
export const promisify = (fn: any) => fn;
export const deprecate = (fn: any) => fn;
export const types = proxy;
export const TextEncoder = typeof window !== 'undefined' ? window.TextEncoder : proxy;
export const TextDecoder = typeof window !== 'undefined' ? window.TextDecoder : proxy;

// OS
export const hostname = () => 'localhost';
export const arch = () => 'arm64';
export const platform = () => 'darwin';
export const userInfo = () => ({ username: 'user' });
export const cpus = () => [];
export const networkInterfaces = () => ({});

// STREAM / EVENTS
export const EventEmitter = NoopEventEmitter;
export const Readable = NoopStream;
export const Writable = NoopStream;
export const Transform = NoopStream;
export const PassThrough = NoopStream;
export const Stream = NoopStream;

// PERF / ASYNC
export const performance = typeof window !== 'undefined' ? window.performance : proxy;
export const AsyncLocalStorage = proxy;
export const AsyncResource = proxy;

// GLOBALES
export const Buffer = proxy;

export default proxy;
