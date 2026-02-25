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
  { href: '/architecture', label: 'Architecture' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled ? "glass border-border/40 py-2" : "bg-transparent py-4"
      )}
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link href="/" aria-label="Luis Gimenez - Home" className="group flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary font-mono text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              LG
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(
                  "rounded-full px-4 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                  pathname === link.href ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                )}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <div className="mx-2 h-4 w-px bg-border/50" />
            <Button
              asChild
              className="gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-glow-primary transition-all duration-300"
            >
              <Link href="/chat">
                <Terminal className="size-4" />
                AI Chat
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 glass border-t border-border/40 p-4 flex flex-col gap-2 md:hidden animate-fadeIn shadow-2xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-border/50 my-1" />
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Terminal className="size-4" />
              AI Chat
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
