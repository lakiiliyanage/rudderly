import Link from "next/link"

const productLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Explore", href: "/explore" },
]

const companyLinks: { label: string; href: string; external?: boolean }[] = [
  { label: "Changelog", href: "/changelog" },
  { label: "Press",     href: "/press" },
  { label: "GitHub",    href: "https://github.com/lakiiliyanage/rudderly", external: true },
]

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-950 border-t border-gray-800/60">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Top row: brand + link columns ── */}
        {/* grid grid-cols-1 sm:grid-cols-3 — stacks on mobile, 3 columns on desktop */}
        {/* gap-10 — generous spacing between columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-gray-800/60">

          {/* ── Brand column ── */}
          <div className="sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-sm">
                ⚡
              </span>
              <span className="font-semibold text-white">Rudderly</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              The visual, no-code builder for creating and sharing AI agents — no engineering background required.
            </p>
          </div>

          {/* ── Link columns ── */}
          {/* col-span-2 — takes up the remaining two columns */}
          {/* grid grid-cols-2 — splits into two equal columns inside */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-8">

            {/* Product column */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Product
              </h3>
              <ul className="flex flex-col gap-3">
                {productLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Company
              </h3>
              <ul className="flex flex-col gap-3">
                {companyLinks.map(({ label, href, external }) => (
                  <li key={href}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Bottom row: copyright + built with ── */}
        {/* flex justify-between — copyright left, built-with right */}
        {/* pt-6 — breathing room above the bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Rudderly. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            Built with
            <span className="text-violet-500 font-medium">Claude API</span>
            by Lakii
          </p>
        </div>

      </div>
    </footer>
  )
}
