"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, User, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm pointer-events-none">
      <nav className="glass rounded-[3rem] flex justify-around items-center h-20 px-4 border-white/20 pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ios-btn group",
                isActive ? "text-primary" : "text-muted-foreground opacity-50"
              )}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110 stroke-[2.5px]")} />
                <span className={cn(
                  "text-[8px] font-bold mt-1.5 uppercase tracking-[0.2em] transition-all duration-300", 
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -inset-6 bg-primary/15 rounded-full blur-2xl animate-pulse -z-10" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}