'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Home, BookOpen, Trophy, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletButton } from '../ui/wallet-button';
import { XPBar } from '../ui/xp-bar';
import { LevelBadge } from '../ui/level-badge';
import { useXP } from '@/hooks/useXP';
import { useSolana } from '@/hooks/useSolana';
import { IntlLink, useIntlPathname, useIntlRouter } from '@/i18n/navigation';

const NAV_LINKS = [
  { href: '/', labelKey: 'home', icon: Home },
  { href: '/courses', labelKey: 'courses', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
] as const;

const LOCALE_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'PT-BR', flag: '🇧🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
] as const;

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = useIntlPathname();
  const intlRouter = useIntlRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { xp, level, levelProgress } = useXP();
  const { connected } = useSolana();
  const currentLocale =
    LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];

  const changeLocale = (nextLocale: 'en' | 'pt-BR' | 'es') => {
    if (nextLocale === locale) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('academy:locale', nextLocale);
    }
    intlRouter.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md',
          className,
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          {/* Logo */}
          <IntlLink href="/" className="flex items-center gap-2 shrink-0">
            <GraduationCap className="text-accent-cyan" size={22} />
            <span className="font-bold text-text-primary hidden sm:block text-sm">
              Superteam{' '}
              <span className="text-accent-cyan">Academy</span>
            </span>
          </IntlLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
              const active =
                href === '/'
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <IntlLink
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface',
                  )}
                >
                  <Icon size={15} />
                  {t(`nav.${labelKey}`)}
                </IntlLink>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:block">
              <label className="sr-only" htmlFor="locale-switcher">Language</label>
              <select
                id="locale-switcher"
                value={currentLocale.code}
                onChange={(event) => changeLocale(event.target.value as 'en' | 'pt-BR' | 'es')}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-secondary"
              >
                {LOCALE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.flag} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* XP summary — visible on large screens when wallet connected */}
            {connected && (
              <div className="hidden lg:flex items-center gap-3">
                <LevelBadge level={level} size="sm" />
                <div className="w-28">
                  <XPBar
                    xp={xp}
                    level={level}
                    levelProgress={levelProgress}
                    showLabel={false}
                    size="sm"
                  />
                </div>
              </div>
            )}

            <WalletButton />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-30 bg-background/96 backdrop-blur-sm pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
                const active =
                  href === '/'
                    ? pathname === href
                    : pathname.startsWith(href);
                return (
                  <IntlLink
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      active
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface',
                    )}
                  >
                    <Icon size={20} />
                    {t(`nav.${labelKey}`)}
                  </IntlLink>
                );
              })}

              <label className="mt-3 text-xs uppercase tracking-wider text-text-muted">
                Language
                <select
                  value={currentLocale.code}
                  onChange={(event) => changeLocale(event.target.value as 'en' | 'pt-BR' | 'es')}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text-secondary"
                >
                  {LOCALE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.flag} {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* XP card in mobile menu */}
              {connected && (
                <div className="mt-4 px-4 py-3 bg-surface rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <LevelBadge level={level} size="sm" />
                    <span className="text-sm font-medium text-text-secondary">
                      {t('common.level')} {level}
                    </span>
                  </div>
                  <XPBar xp={xp} level={level} levelProgress={levelProgress} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
