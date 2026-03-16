/**
 * @fileOverview Universal Proxy Shim.
 * Este archivo actúa como un sustituto universal para módulos de Node.js en el cliente.
 * Proporciona un objeto Proxy que puede actuar como función, constructor u objeto,
 * e incluye exportaciones nombradas para satisfacer desestructuraciones (como http2.constants).
 */

const noop = function() {};

// Handler del Proxy para interceptar cualquier acceso y retornar el mismo proxy
const handler: ProxyHandler<any> = {
  get: (target, prop) => {
    if (prop === 'default') return proxy;
    if (prop === '__esModule') return true;
    
    // Soporte para http2.constants y otros objetos anidados
    if (prop === 'constants') return proxy;
    if (prop === 'promises') return proxy;

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

// --- Exportaciones Nombradas para desestructuraciones comunes ---

// crypto
export const randomBytes = proxy;

// http2 constants
export const constants = proxy;
export const HTTP2_HEADER_AUTHORITY = ':authority';
export const HTTP2_HEADER_METHOD = ':method';
export const HTTP2_HEADER_PATH = ':path';
export const HTTP2_HEADER_SCHEME = ':scheme';
export const HTTP2_HEADER_STATUS = ':status';

// events & stream
export const EventEmitter = proxy;
export const Readable = proxy;
export const Writable = proxy;
export const Transform = proxy;
export const Duplex = proxy;
export const Stream = proxy;

// path
export const join = proxy;
export const resolve = proxy;
export const dirname = proxy;
export const basename = proxy;
export const extname = proxy;
export const sep = '/';
export const delimiter = ':';

// util
export const inspect = proxy;
export const inherits = proxy;
export const promisify = (fn: any) => fn || proxy;
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
export const existsSync = () => false;

// dgram / net / tls
export const createSocket = proxy;
export const createServer = proxy;
export const connect = proxy;

export default proxy;
