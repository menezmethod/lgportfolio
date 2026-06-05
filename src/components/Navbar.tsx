'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/writing', label: 'Writing' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/war-room', label: 'War Room' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all", scrolled ? "bg-background/80 backdrop-blur-xl border-b py-2" : "bg-transparent py-4")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><div className="flex items-center justify-center size-8 rounded-lg font-mono text-sm font-bold bg-primary/10 text-primary">LG</div></Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild className={cn("rounded-lg px-4 text-sm font-medium", pathname === link.href ? 'text-primary bg-primary/8' : 'text-muted-foreground')}>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <div className="mx-2 h-4 w-px bg-border/50" />
            <Button asChild className="gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"><Link href="/chat"><Terminal className="size-4" />AI Chat</Link></Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
        </div>
      </div>
    </nav>
  );
}
