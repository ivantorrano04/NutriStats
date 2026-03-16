
/**
 * @fileOverview Un módulo de sustitución (shim) universal para Node.js.
 * Diseñado para actuar como objeto, función y constructor simultáneamente.
 */

// Un emisor de eventos que puede ser instanciado
function NoopEmitter() {}
NoopEmitter.prototype.on = function() { return this; };
NoopEmitter.prototype.off = function() { return this; };
NoopEmitter.prototype.once = function() { return this; };
NoopEmitter.prototype.emit = function() { return false; };
NoopEmitter.prototype.removeAllListeners = function() { return this; };
NoopEmitter.prototype.setMaxListeners = function() { return this; };
NoopEmitter.prototype.listeners = function() { return []; };

// Clases base para streams
function NoopStream() { NoopEmitter.call(this); }
NoopStream.prototype = Object.create(NoopEmitter.prototype);

function Readable() { NoopStream.call(this); }
Readable.prototype = Object.create(NoopStream.prototype);
Readable.prototype.pipe = function(dest: any) { return dest; };
Readable.prototype.read = function() { return null; };
Readable.from = function() { return new Readable(); };

function Writable() { NoopStream.call(this); }
Writable.prototype = Object.create(NoopStream.prototype);
Writable.prototype.write = function() { return true; };
Writable.prototype.end = function() {};

// Exportaciones de Util
export const inspect = (obj: any) => (typeof obj === 'string' ? obj : JSON.stringify(obj));
export const inherits = (ctor: any, superCtor: any) => {
  if (superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  }
};
export const promisify = (fn: any) => {
  const p: any = (...args: any[]) => fn(...args);
  p.custom = Symbol('util.promisify.custom');
  return p;
};

// Exportaciones de Path
export const join = (...args: any[]) => args.filter(Boolean).join('/');
export const resolve = (...args: any[]) => args.filter(Boolean).join('/');
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/') || '.';
export const basename = (p: string) => p.split('/').pop() || '';
export const extname = (p: string) => {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i <= 0 ? '' : b.substring(i);
};
export const sep = '/';

// Clases de Codificación (Soporte estático para Turbopack)
export class TextEncoder {
  encode() { return new Uint8Array(); }
}
export class TextDecoder {
  decode() { return ''; }
}

// File System Promises
export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  access: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({ isDirectory: () => false, size: 0 }),
  unlink: async () => {},
};

// Exportación por defecto
const noopProxy = new Proxy(() => {}, {
  get: (target, prop) => {
    if (prop === 'EventEmitter') return NoopEmitter;
    if (prop === 'Stream') return NoopStream;
    if (prop === 'Readable') return Readable;
    if (prop === 'Writable') return Writable;
    if (prop === 'promises') return promises;
    if (prop === 'TextEncoder') return TextEncoder;
    if (prop === 'TextDecoder') return TextDecoder;
    if (prop === 'join') return join;
    if (prop === 'resolve') return resolve;
    // Retornar la función noop para cualquier otro método
    return target;
  },
  apply: (target) => target,
  construct: () => ({})
});

export default noopProxy;

// Exportaciones nombradas adicionales para compatibilidad con CommonJS
export { NoopEmitter as EventEmitter, NoopStream as Stream, Readable, Writable };
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const existsSync = () => false;
export const createSocket = () => ({ on: () => {}, send: () => {}, close: () => {}, bind: () => {} });
