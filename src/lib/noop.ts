/**
 * @fileOverview Universal Proxy Shim.
 * Este archivo actúa como un sustituto universal para módulos de Node.js en el cliente.
 * Proporciona un objeto Proxy que puede actuar como función, constructor u objeto,
 * e incluye exportaciones nombradas para satisfacer desestructuraciones estáticas en Turbopack.
 */

const noop = function() {};

// Handler del Proxy para interceptar cualquier acceso y retornar el mismo proxy
const handler: ProxyHandler<any> = {
  get: (target, prop) => {
    if (prop === 'default') return proxy;
    if (prop === '__esModule') return true;
    
    // Soporte para objetos anidados comunes
    if (prop === 'constants' || prop === 'promises' || prop === 'codes') return proxy;

    // Soporte para primitivos
    if (prop === Symbol.toPrimitive) {
      return (hint: string) => {
        if (hint === 'number') return 0;
        return 'noop';
      };
    }
    
    if (prop === 'toString' || prop === Symbol.toStringTag) return () => 'noop';
    
    // Retornar el mismo proxy para permitir encadenamiento infinito
    return proxy;
  },
  apply: () => proxy,
  construct: () => proxy,
};

const proxy: any = new Proxy(noop, handler);

// --- Exportaciones Nombradas para desestructuraciones estáticas (Turbopack/ESM) ---

// http / https / http2 / net / tls
export const Agent = proxy;
export const get = proxy;
export const request = proxy;
export const createServer = proxy;
export const connect = proxy;
export const constants = proxy;
export const codes = proxy;
export const createConnection = proxy;

// http2 specific constants
export const HTTP2_HEADER_AUTHORITY = ':authority';
export const HTTP2_HEADER_METHOD = ':method';
export const HTTP2_HEADER_PATH = ':path';
export const HTTP2_HEADER_SCHEME = ':scheme';
export const HTTP2_HEADER_STATUS = ':status';

// crypto
export const randomBytes = proxy;
export const randomUUID = proxy;
export const createHash = proxy;
export const createHmac = proxy;
export const pbkdf2 = proxy;
export const pbkdf2Sync = proxy;

// events & stream
export const EventEmitter = proxy;
export const Readable = proxy;
export const Writable = proxy;
export const Transform = proxy;
export const Duplex = proxy;
export const Stream = proxy;
export const PassThrough = proxy;
export const pipeline = proxy;

// path
export const join = proxy;
export const resolve = proxy;
export const dirname = proxy;
export const basename = proxy;
export const extname = proxy;
export const relative = proxy;
export const isAbsolute = proxy;
export const normalize = proxy;
export const parse = proxy;
export const format_path = proxy; // evitamos colisión con util.format
export const sep = '/';
export const delimiter = ':';

// util
export const inspect = proxy;
export const inherits = proxy;
export const promisify = (fn: any) => fn || proxy;
export const format = proxy;
export const debuglog = proxy;
export const types = proxy;

export class TextEncoder {
  encode() { return new Uint8Array(); }
}
export class TextDecoder {
  decode() { return ''; }
}

// fs
export const promises = proxy;
export const readFile = proxy;
export const writeFile = proxy;
export const readFileSync = () => '';
export const writeFileSync = proxy;
export const existsSync = () => false;
export const statSync = proxy;
export const lstatSync = proxy;
export const readdirSync = proxy;
export const createReadStream = proxy;
export const createWriteStream = proxy;

// os
export const homedir = () => '/';
export const arch = () => 'x64';
export const hostname = () => 'localhost';
export const platform = () => 'browser';
export const cpus = () => [];
export const totalmem = () => 0;
export const freemem = () => 0;
export const networkInterfaces = () => ({});
export const release = () => '';
export const type = () => 'browser';

// dgram
export const createSocket = proxy;

// zlib
export const createGzip = proxy;
export const createGunzip = proxy;
export const createDeflate = proxy;
export const createInflate = proxy;
export const inflateSync = proxy;
export const deflateSync = proxy;
export const gunzipSync = proxy;
export const gzipSync = proxy;

// child_process
export const exec = proxy;
export const spawn = proxy;
export const fork = proxy;

// buffer
export const Buffer = proxy;

// vm
export const runInContext = proxy;
export const createContext = proxy;

// perf_hooks
export const performance = proxy;

// async_hooks
export const AsyncLocalStorage = proxy;

// process (para desestructuraciones si se usa como alias)
export const nextTick = (fn: Function) => setTimeout(fn, 0);
export const env = {};
export const argv = [];
export const version = 'v18.0.0';

export default proxy;
