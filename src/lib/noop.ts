/**
 * @fileOverview Un módulo de sustitución (shim) exhaustivo y universal para Node.js.
 * Diseñado para satisfacer tanto requisitos basados en objetos (fs, path) como
 * basados en clases (events, stream), permitiendo la compilación de librerías de servidor
 * en entornos de navegador y exportaciones estáticas.
 */

// 1. Definición de clases base que las librerías suelen extender
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

// 2. Funciones de utilidad comunes (Path, Utils, Crypto)
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

// 3. El Shim Universal (Función + Objeto)
// Se usa una función nombrada para actuar como constructor (para 'events')
// y se le asignan propiedades para actuar como objeto (para 'fs' o 'path').
function UniversalNoopShim(this: any) {
  return this;
}

// Hacer que el shim herede de EventEmitter por defecto (común en módulos de Node)
inherits(UniversalNoopShim, EventEmitter);

// Asignar todas las exportaciones al objeto de la función
Object.assign(UniversalNoopShim, {
  // Clases
  EventEmitter, Stream, Readable, Writable, Duplex, Transform,
  // Path
  join, resolve, dirname, basename, extname, parse, sep,
  // Utils
  inherits, promisify, debuglog, inspect, format,
  // Crypto
  randomBytes, createHash, createHmac,
  // FS stubs
  readFileSync: () => '',
  writeFileSync: () => {},
  existsSync: () => false,
  lstatSync: () => ({ isDirectory: () => false }),
  promises: {
    readFile: async () => '',
    writeFile: async () => {},
  },
  // OS stubs
  platform: () => 'browser',
  arch: () => 'x64',
  release: () => '',
  type: () => '',
  // Performance
  performance: typeof window !== 'undefined' ? window.performance : { now: () => Date.now() },
  // AsyncLocalStorage
  AsyncLocalStorage: class {
    getStore() { return undefined; }
    run(store: any, callback: any) { return callback(); }
  },
  // Dgram stubs
  createSocket: () => ({
    on: () => {},
    send: () => {},
    close: () => {},
    bind: () => {},
  }),
});

export default UniversalNoopShim;
