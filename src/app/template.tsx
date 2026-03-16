
'use client';

import React from 'react';

/**
 * Template de Next.js que se encarga de las animaciones de transición entre páginas.
 * A diferencia del layout, el template se vuelve a montar en cada navegación,
 * disparando las animaciones de entrada.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-forwards">
      {children}
    </div>
  );
}
