
/**
 * @fileOverview Un módulo de sustitución (shim) universal para Node.js.
 * Exporta implementaciones vacías o mínimas de módulos de servidor para el navegador.
 */

// Utilidades de codificación
export class TextEncoder {
  encode() { return new Uint8Array(); }
}

export class TextDecoder {
  decode() { return ''; }
}

// Emisor de eventos básico
export class EventEmitter {
  static EventEmitter = EventEmitter;
  on() { return this; }
  off() { return this; }
  once() { return this; }
  emit() { return false; }
  removeAllListeners() { return this; }
  addListener() { return this; }
  removeListener() { return this; }
  setMaxListeners() { return this; }
  getMaxListeners() { return 10; }
  listeners() { return []; }
  rawListeners() { return []; }
  listenerCount() { return 0; }
  prependListener() { return this; }
  prependOnceListener() { return this; }
  eventNames() { return []; }
}

// Mocks de Streams
export class Stream extends EventEmitter {
  static Stream = Stream;
}

export class Readable extends Stream {
  static Readable = Readable;
  _read() {}
  push() { return true; }
  pipe(dest: any) { return dest; }
  unpipe() { return this; }
  unshift() {}
  wrap() { return this; }
  setEncoding() { return this; }
  pause() { return this; }
  resume() { return this; }
  isPaused() { return false; }
}

export class Writable extends Stream {
  static Writable = Writable;
  _write() {}
  end() {}
  write() { return true; }
  setDefaultEncoding() { return this; }
  cork() {}
  uncork() {}
}

export class Duplex extends Readable {
  static Duplex = Duplex;
}

// Utilidades de Path (Navegador)
export const join = (...args: any[]) => args.filter(Boolean).join('/');
export const resolve = (...args: any[]) => args.filter(Boolean).join('/');
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/') || '.';
export const basename = (p: string) => p.split('/').pop() || '';
export const extname = (p: string) => {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i <= 0 ? '' : b.substring(i);
};
export const parse = (p: string) => ({ 
  root: '', 
  dir: dirname(p), 
  base: basename(p), 
  ext: extname(p), 
  name: basename(p).split('.')[0] 
});
export const sep = '/';

// Utilidades de Node.js (util)
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

export const debuglog = () => () => {};
export const inspect = (obj: any) => typeof obj === 'string' ? obj : JSON.stringify(obj);
export const format = (str: string, ..._args: any[]) => str;

// Crypto & File System
export const randomBytes = (size: number) => new Uint8Array(size);
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
export const createHmac = () => ({ update: () => ({ digest: () => '' }) });

export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  access: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({ isDirectory: () => false, size: 0 }),
  lstat: async () => ({ isDirectory: () => false, size: 0 }),
  unlink: async () => {},
};

export const readFileSync = () => '';
export const writeFileSync = () => {};
export const existsSync = () => false;

// Exportación por defecto para compatibilidad total
const noop = {
  join, resolve, dirname, basename, extname, parse, sep,
  inherits, promisify, debuglog, inspect, format,
  randomBytes, createHash, createHmac,
  promises, readFileSync, writeFileSync, existsSync,
  TextEncoder, TextDecoder, EventEmitter, Stream, Readable, Writable,
  createSocket: () => ({ on: () => {}, send: () => {}, close: () => {}, bind: () => {} }),
  AsyncLocalStorage: class { getStore() { return undefined; } run(_: any, callback: any) { return callback(); } },
  platform: () => 'browser',
  arch: () => 'x64',
  performance: typeof window !== 'undefined' ? window.performance : { now: () => Date.now() },
};

export default noop;
