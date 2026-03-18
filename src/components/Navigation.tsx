
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, User, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const hideOnPaths = ['/login', '/register', '/onboarding', '/forgot-password', '/'];
  const shouldHide = hideOnPaths.includes(pathname) || !user;

  if (shouldHide) return null;

  const navItems = [
    { label: 'Hoy', href: '/dashboard', icon: Home },
    { label: 'Chef', href: '/favoritos', icon: Heart },
    { label: 'Social', href: '/amigos', icon: Users },
    { label: 'Bio', href: '/stats', icon: BarChart3 },
    { label: 'Perfil', href: '/perfil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-5 pb-[env(safe-area-inset-bottom,20px)] pointer-events-none mb-2">
      <nav className="max-w-sm mx-auto glass rounded-[2.2rem] flex justify-around items-center h-[68px] px-2 border-white/10 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ios-btn group",
                isActive ? "text-primary scale-110" : "text-muted-foreground opacity-50"
              )}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={cn("w-5 h-5 transition-all duration-300", isActive && "stroke-[2.5px] drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]")} />
                <span className={cn(
                  "text-[7px] font-bold mt-1 uppercase tracking-widest transition-all duration-300", 
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -inset-4 bg-primary/15 rounded-full blur-xl animate-pulse -z-10" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
