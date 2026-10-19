import { GithubIcon } from "@/components/github-icon";
import { links } from "@/lib/content";

// Logo X : simple-icons, domaine public (CC0).
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

const ICONS = {
  github: GithubIcon,
  x: XIcon,
};

/** Bas de page : les réseaux en petites icônes. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <ul className="site-footer__links">
        {links.map((link) => {
          const Icon = ICONS[link.icon];
          return (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                title={link.label}
                className="site-footer__link"
              >
                <Icon className="h-[1.15rem] w-[1.15rem]" />
              </a>
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
