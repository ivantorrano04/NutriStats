
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, User, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  // No mostrar la barra en rutas de autenticación u onboarding
  const hideOnPaths = ['/login', '/register', '/onboarding', '/forgot-password'];
  const shouldHide = hideOnPaths.includes(pathname) || !user;

  if (shouldHide) return null;

  const navItems = [
    { label: 'Inicio', href: '/dashboard', icon: Home },
    { label: 'Favoritos', href: '/favoritos', icon: Heart },
    { label: 'Amigos', href: '/amigos', icon: Users },
    { label: 'Stats', href: '/stats', icon: BarChart3 },
    { label: 'Perfil', href: '/perfil', icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md pointer-events-none">
      <nav className="glass rounded-[2.5rem] flex justify-around items-center h-20 px-4 border-white/10 pointer-events-auto shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-500 relative ios-btn group",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground opacity-60"
              )}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={cn("w-6 h-6 transition-all duration-500", isActive && "stroke-[2.5px] drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]")} />
                <span className={cn(
                  "text-[8px] font-bold mt-1.5 uppercase tracking-[0.2em] transition-all duration-500", 
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse -z-10" />
                )}
              </div>
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full blur-[1px] animate-in fade-in zoom-in duration-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
