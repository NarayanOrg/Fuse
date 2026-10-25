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

## Owner inputs recorded

- X/Twitter site: `@narayanbona`.
- Search Console verification token: none supplied; no token meta tag was
  added.
- Privacy and Terms pages: deferred.
- Preferred tagline: “Say it. Then watch it disappear.”
- Existing modified icon assets: preserve them. SEO commits did not stage the
  separate local icon and logo edits.

## Implementation and final verification

### Delivered

- Added centralized site identity, canonical/metadata helpers, environment
  aware indexing directives, generated app icons and manifest, robots.txt,
  and a production-only sitemap.
- Added default and per-message Open Graph/Twitter PNG routes. Images are
  1200×630, use local Outfit fonts, and do not include message bodies. Message
  lookups project only sender/privacy, duration, status, and expiry metadata.
- Added complete metadata for the homepage, `/new`, `/onboarding`, and
  `/m/[id]`. Message pages remain `noindex, nofollow` and now return the same
  directive in `X-Robots-Tag`.
- Added homepage WebApplication JSON-LD and a server-rendered “How Fuse works”
  section. Corrected “Opens once” to “Reopens until timer ends.”
- Added a Firebase-verified, HttpOnly session cookie for server-side
  homepage selection. Cookie creation and clearing use the existing
  authenticated, Arcjet-protected API pattern. The client-authenticated
  homepage remains available as a fallback if a valid session cookie is not
  present.
- Removed the temporary synthetic OG preview route after image layout checks.

### Verification performed

- `pnpm build` with `VERCEL_ENV=production`: passed on Next.js 16.4.2.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed with one warning in the separately modified,
  uncommitted `components/theme-provider.tsx` (`ThemeHotkey` is unused).
- Production raw HTML: `/` returned 200 with `index, follow`, canonical,
  description, Open Graph/Twitter metadata, valid WebApplication JSON-LD, and
  the server-rendered explainer. `/new` and `/onboarding` returned 200 with
  canonical metadata and `noindex, nofollow`. An unknown `/m/abc123` returned
  200 with “Message gone”, noindex metadata, and `X-Robots-Tag: noindex,
  nofollow`.
- Production robots.txt returned 200 and disallows `/api/`, `/new`, and
  `/onboarding`; the production sitemap returned 200 and contains only `/`.
  A non-production build correctly emitted noindex metadata and an empty
  sitemap.
- Default and message-specific Open Graph/Twitter endpoints returned PNGs at
  1200×630, each under 100 KB, with the configured shared cache headers.
  Message preview image responses also carry `X-Robots-Tag`.
- The removed `/og-preview/Al` fixture route returns 404. Unauthenticated
  `POST` and `DELETE` requests to `/api/session` return 401.
- Authenticated session creation/clearing was not exercised with a live
  Firebase user token. Verify sign-in and logout on the deployed site.

### Deployment and search follow-up

1. Set `NEXT_PUBLIC_SITE_URL` to the public production origin and deploy with
   `VERCEL_ENV=production`.
2. In Google Search Console, verify the domain (no verification token was
   provided), inspect the homepage, then submit
   `https://<production-host>/sitemap.xml`. Repeat site verification and
   sitemap submission in Bing Webmaster Tools if desired.
3. After deployment, test the homepage and a representative message link with
   the Meta Sharing Debugger and the social platform preview tools in use.
   Confirm message preview cards show only sender/status/timer information.
4. Sign in and verify the homepage shows the account view; confirm the
   `__session` cookie is HttpOnly and Secure in production, then log out and
   verify it is cleared.

### Phase commits

- Phase 0: `3c0afd3` — `docs: add Phase 0 SEO audit`
- Phase 1: `158ac1f` — `feat(seo): add canonical site metadata foundation`
- Phase 2: `5d579c1` — `feat(seo): add app icons and crawl metadata routes`
- Phase 3: `6774bcc` — `feat(seo): add social preview images`
- Phase 4: `6f9b7e3` — `feat(seo): complete page metadata and homepage rendering`
