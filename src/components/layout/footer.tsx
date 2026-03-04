import Link from 'next/link';
import { GraduationCap, Github, Twitter, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  Learn: [
    { label: 'All Courses', href: '/courses' },
    { label: 'Fundamentals', href: '/courses?track=fundamentals' },
    { label: 'DeFi Track', href: '/courses?track=defi' },
    { label: 'Security Track', href: '/courses?track=security' },
  ],
  Community: [
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Superteam', href: 'https://superteam.fun', external: true },
    { label: 'Discord', href: 'https://discord.gg/superteam', external: true },
  ],
  Resources: [
    { label: 'Solana Docs', href: 'https://docs.solana.com', external: true },
    { label: 'Anchor Framework', href: 'https://www.anchor-lang.com', external: true },
    { label: 'Metaplex', href: 'https://www.metaplex.com', external: true },
  ],
};

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-surface mt-auto', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="text-accent-cyan" size={22} />
              <span className="font-bold text-text-primary text-sm">
                Superteam <span className="text-accent-cyan">Academy</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Learn Solana development. Earn on-chain credentials. Build the
              future of Web3.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/superteamDAO"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com/SuperteamDAO"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                {section}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
                      >
                        {label}
                        <ExternalLink size={10} className="opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm text-text-muted hover:text-text-primary transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>
            © {new Date().getFullYear()} Superteam Academy. All rights reserved.
          </span>
          <div className="flex items-center gap-1.5">
            <span>Built on</span>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-accent-green hover:text-accent-green/70 font-medium transition-colors"
            >
              Solana
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
