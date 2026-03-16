/**
 * @fileOverview Un módulo de sustitución (shim) exhaustivo y universal para Node.js.
 * Diseñado para satisfacer los requisitos de exportación estática de Next.js 15 + Turbopack.
 */

// 1. Clases base y mocks para codificación (requeridos por Firebase/util)
export class TextEncoder {
  encode() { return new Uint8Array(); }
}

export class TextDecoder {
  decode() { return ''; }
}

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

export class Transform extends Duplex {
  static Transform = Transform;
  _transform() {}
  _flush() {}
}

// 2. Exportaciones específicas para promesas (requeridas por Genkit)
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

// 3. Funciones de utilidad comunes (Path, Utils, Crypto)
export const join = (...args: string[]) => args.filter(Boolean).join('/');
export const resolve = (...args: string[]) => args.filter(Boolean).join('/');
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
export const format = (str: string, ...args: any[]) => str;

export const randomBytes = (size: number) => new Uint8Array(size);
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
export const createHmac = () => ({ update: () => ({ digest: () => '' }) });

// 4. Shim Universal (Función + Objeto)
function UniversalNoopShim(this: any) {
  return this;
}

inherits(UniversalNoopShim, EventEmitter);

Object.assign(UniversalNoopShim, {
  EventEmitter, Stream, Readable, Writable, Duplex, Transform,
  TextEncoder, TextDecoder,
  join, resolve, dirname, basename, extname, parse, sep,
  inherits, promisify, debuglog, inspect, format,
  randomBytes, createHash, createHmac,
  promises,
  readFileSync: () => '',
  writeFileSync: () => {},
  existsSync: () => false,
  lstatSync: () => ({ isDirectory: () => false }),
  platform: () => 'browser',
  arch: () => 'x64',
  release: () => '',
  type: () => '',
  performance: typeof window !== 'undefined' ? window.performance : { now: () => Date.now() },
  AsyncLocalStorage: class {
    getStore() { return undefined; }
    run(store: any, callback: any) { return callback(); }
  },
  createSocket: () => ({
    on: () => {},
    send: () => {},
    close: () => {},
    bind: () => {},
  }),
});

export default UniversalNoopShim;
