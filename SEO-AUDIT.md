# Fuse SEO Audit

## Phase 0: Recon

Date: 2026-10-25

This audit records the repository before SEO implementation. No product code or
metadata was changed during reconnaissance.

### Route metadata at baseline

| Route | Baseline metadata |
| --- | --- |
| `/` | No title or description in the raw HTML. No canonical, Open Graph, Twitter, or robots metadata. Next.js emits charset, viewport, and the app favicon link. |
| `/m/[id]` | `generateMetadata` sets a title, description, and `robots: noindex, nofollow`. Open Graph only has title and description; there is no `metadataBase`, canonical, site name, absolute URL, image, or Twitter metadata. |
| `/new` | No route metadata. The route is wrapped in a client-side `ProtectedRoute`; initial HTML contains no heading or page content. |
| `/onboarding` | No route metadata. Initial HTML contains no heading or page content. |
| `/_not-found` | Next.js fallback route; no app-specific metadata or branded not-found page. |

No `app/robots.ts`, `app/sitemap.ts`, app manifest route, Open Graph image, or
Twitter image exists. `app/favicon.ico` is present. `public/` contains a
`site.webmanifest`, favicon PNG/ICO files, Android icon PNGs, an Apple touch
icon, and `logo.png`; the existing manifest has empty `name` and `short_name`,
white colors, and no maskable icon declaration. The root layout does not link
that manifest or set application metadata.

### Homepage raw HTML before JavaScript

Ran `pnpm build` successfully with Next.js 16.4.2, then requested the production
server's `/` HTML using `Invoke-WebRequest`. The response was HTTP 200. Before
client JavaScript, the HTML contains the signed-out hero and its CTA, including
the single h1, “Say it. Then watch it disappear.” The server-rendered content
therefore is not an empty shell.

The raw `<head>` contains charset, viewport, font preloads, stylesheet and
script references, the favicon link, and Next's size-adjust metadata. It does
not contain a `<title>`, description, canonical, Open Graph, Twitter, or robots
tags. The page is a client component initialized with `user === null`, so an
already-signed-in visitor can briefly see the public hero before Firebase auth
resolves and the private message list replaces it.

The hero's feature list currently says “Opens once.” That is inaccurate: the
message can be reopened until its countdown ends. This should be corrected
during the SEO copy pass.

### Message-link crawler rendering

`/m/[id]` server-renders the reader's pre-reveal state with sender (or
“Someone”), fuse duration, and a Reveal button. The server page reads only
message metadata (sender, duration, status/deadline); it does not read the
message body into the page or metadata. The body is requested by the client
only after an explicit Reveal action. A missing-link request showed the
“Message gone” title and “This message no longer exists.” description, with a
not-found reader state and no message body.

Phase 0 sampled an unknown message ID, not an actual user's live message.
Verification against a real shared link must not open it; any later check must
use only metadata and avoid recording message content or user IDs.

The message page has `noindex, nofollow`, which is appropriate, but the route
does not set `X-Robots-Tag`. Its Open Graph metadata is incomplete, and there
is no preview image route. The pages are not disallowed in robots.txt because
there is no robots.txt route yet.

### Branding and asset observations

- `app/globals.css` defines light and dark themes with orange/red fuse gradient
  tokens; the dark background is `oklch(0.155 0.005 285`.
- `components/Logo.tsx` is a Lucide flame without a visible wordmark; the
  “Fuse” span is hidden.
- The root layout uses Next font optimization with Inter, Roboto, and Geist
  Mono.
- Existing favicon and public icon assets have local worktree modifications.
  They were not inspected as source changes and must be preserved unless the
  owner confirms they may be replaced.

### Recon verification

- `pnpm build`: passed.
- Production raw HTML sampled at `/`, `/new`, `/onboarding`, and an unknown
  `/m/[id]`: all returned HTTP 200.
- No source implementation changes were made in Phase 0.

## Questions for the owner

1. What X/Twitter handle, if any, should be used for `twitter:site`?
2. Is there a Search Console verification token to include?
3. Should Privacy and Terms pages be added? They are recommended because the
   app collects email addresses.
4. Is “Say it. Then watch it disappear.” the preferred tagline?
5. The favicon and public icon assets are already modified in the worktree.
   May the SEO work update these files, or should all current icon assets be
   preserved and used as-is?
