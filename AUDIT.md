# Fuse Audit

## 1) Repository map

- `app/`: Next.js App Router entrypoints.
  - `app/page.tsx`: signed-out dashboard / landing screen. Shows auth dialog or signed-in user greeting and message list.
  - `app/new/page.tsx`: authenticated message composer. Validates local state and posts to `/api/messages`.
  - `app/onboarding/page.tsx`: authenticated profile setup for username selection.
  - `app/m/[id]/page.tsx`: public message reader page. Reads message metadata from Firestore but never reveals the body until the user clicks Reveal.
  - `app/api/*`: server routes for auth, profile, username availability, public reveal flow, and Inngest.
  - `app/layout.tsx`: root layout, theme provider, React Query provider, app-level toaster.

- `components/`: UI and client-side logic.
  - `AuthScreen/AuthDialog.tsx`: email/password and Google sign-in flow using Firebase client auth only.
  - `HomeScreen/*`: home/dashboard display, message list, greeting, hero CTA, and countdown UI.
  - `reader/*`: public reveal flow UI that fetches the message body from the public `/api/messages/[id]/open` endpoint and then counts down locally.
  - `layouts/Header.tsx`: account menu and sign-out.
  - `theme-provider.tsx`: theme toggle wrapper.

- `hooks/`: client-side hooks.
  - `ProtectedRoute.tsx`: redirect-to-home gate for authenticated pages.
  - `QueryProvider.tsx`: TanStack Query provider.
  - `use-me.ts`: fetches the current signed-in profile via `/api/me`.

- `lib/`: shared logic and server helpers.
  - `auth/with-auth.ts`: verifies Firebase ID token and wraps protected routes.
  - `auth/auth-fetch.ts`: client helper that attaches the current Firebase ID token to fetch requests.
  - `inngest/client.ts`: Inngest client app config.
  - `inngest/functions.ts`: message bomb detonation scheduled after the first reveal.
  - `username.ts`: username normalization, regex, and reserved-name checks.
  - `format-duration.ts`: human-readable time utilities.
  - `utils.ts`: minimal shared utility export.

- `firebase/`: Firebase code.
  - `firebase/client.ts`: public Firebase web config and auth-only initialization.
  - `firebase/admin.ts`: Firebase Admin SDK bootstrap for Firestore and Auth server-side operations.

- `public/`: static assets and icons.
- `package.json`: Next.js + Firebase + Inngest + Query dependencies.
- `.gitignore`: ignores `.env*` and the service account key JSON.
- `README.md`: default template; not a real project document.

## 2) Route and page inventory

| Path | Method | Public / protected | Auth mechanism | Input validated | Data read | Data written |
|---|---|---:|---|---|---|---|
| `/app/page.tsx` | SSR page | Public | None (UI gate via client auth) | N/A | None on server; client reads Firebase auth state | None |
| `/app/new/page.tsx` | Client page | Protected | Firebase client auth + `/api/me` check | Local-only form validation | Reads `/api/me` profile | None |
| `/app/onboarding/page.tsx` | Client page | Protected | Firebase client auth + `ProtectedRoute` | Local username validation | Calls `/api/username` to check handle availability | None until submit |
| `/app/m/[id]/page.tsx` | SSR page | Public | None | ID regex only | Firestore message doc metadata: sender, duration, bomb status | None |
| `/api/me` | GET | Protected | `withAuth` header Bearer token | Yes: none beyond token | `users/{uid}` profile data | None |
| `/api/onboarding` | POST | Protected | `withAuth` header Bearer token | Partially: username + reserved + body parse; no explicit JSON schema | Reads current user doc + usernames doc, writes user and username claim | Creates/updates `users/{uid}`, `usernames/{handle}` |
| `/api/username` | GET | Protected | `withAuth` header Bearer token | Regex and reserved name checks | Reads `usernames/{handle}` record | None |
| `/api/messages` | GET | Protected | `withAuth` header Bearer token | Minimal (auth only) | Reads all `messages` for `ownerUid == user.uid` | None |
| `/api/messages` | POST | Protected | `withAuth` header Bearer token | body length, duration range, numeric conversion | Reads the caller user profile to confirm onboarding | Creates `messages/{id}` document |
| `/api/messages/[id]/open` | POST | Public | None | ID is not strongly validated before Firestore; body is not validated because it is public | Reads `messages/{id}` and returns body if openable | Updates `status`, `openedAt`, `bombAt`, plus Inngest event send |
| `/api/inngest` | GET/POST/PUT | Public internal | Inngest signature validation in production (to be confirmed) | Handled by Inngest framework | Reads the triggered event’s message doc and updates bomb status | Updates `messages/{id}` with `status: bombed`, deletes body |

## 3) Secrets and environment variables

| Variable | Usage | Location | Server-only? |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client web config | `firebase/client.ts` | No (public client bundle) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client web config | `firebase/client.ts` | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client web config | `firebase/client.ts` | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client web config and Storage init | `firebase/client.ts` | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client web config | `firebase/client.ts` | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client web config | `firebase/client.ts` | No |
| `FIREBASE_PROJECT_ID` | Admin SDK project config | `firebase/admin.ts` | Yes |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK credential | `firebase/admin.ts` | Yes |
| `FIREBASE_PRIVATE_KEY` | Admin SDK private key | `firebase/admin.ts` | Yes |
| `INNGEST_SIGNING_KEY` | Inngest request verification | intended for `/api/inngest` and `lib/inngest/client.ts` | Yes |
| `INNGEST_EVENT_KEY` | Inngest event publishing | intended for `lib/inngest/client.ts` | Yes |

`serviceAccountKey.json` is gitignored, but the repo has a file committed in the working tree and it should be treated as a sensitive artifact. `.env*` is ignored per `.gitignore`.

## 4) Core data flows

### Create message
1. User signs in via Firebase client auth.
2. `app/new/page.tsx` calls `authFetch` to attach the Firebase ID token.
3. `POST /api/messages` verifies the bearer token via `withAuth`, confirms onboarding with `users/{uid}`, and validates `body` / `durationSec` / `label`.
4. Server creates `messages/{id}` with `ownerUid`, metadata, and `status: "pending"`.
5. Client receives `{ id }` and shows a public URL `/m/{id}`.

### Reveal + bomb
1. Recipient visits `/m/[id]`; the page reads public metadata only and shows a reveal button.
2. Clicking Reveal calls `POST /api/messages/[id]/open`.
3. The route transaction reads `messages/{id}`.
4. If `status` is `pending`, it sets `status: "opened"`, `openedAt`, and `bombAt = now + durationSec * 1000` and returns the decrypted body.
5. The route sends an Inngest event `message/opened` with the new deadline.
6. The Inngest function waits until `bombAt`, then updates the record to `status: "bombed"` and deletes the `body` field.
7. The public reader UI counts down locally based on the server-provided deadline and hides the body once the timer reaches zero.

### Dashboard
1. Authenticated user loads `/` and the app checks Firebase auth state.
2. `Header` fetches `/api/me` and displays the user profile.
3. `MessageList` polls `/api/messages` and shows each message with status, open time, and countdown for opened messages.
4. The API omits message bodies from owner responses and only returns metadata to avoid leaking content to the sender before bomb time.

## 5) High-level assessment

The project is close to the intended architecture, but the current implementation has several gaps that should be fixed before production:

- The Firebase client module still imports `firebase/storage` and initializes a storage bucket, contrary to the “auth-only” rule.
- The public open endpoint trusts `id` from the URL and does not validate it before querying Firestore.
- The server-side auth helper does not verify revoked tokens and does not emit a consistent `{ error, code }` error envelope on protected routes.
- The open route does not include a safety net for failed Inngest delivery or for a message whose `bombAt` has already elapsed but whose body was never removed.
- The app does not yet add security headers or response-level cache controls to public message-body endpoints.
- The current Next config is empty, so the site is missing explicit CSP/frame-ancestors protections and no-store headers.
