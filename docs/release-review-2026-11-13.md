# ReThread frontend release review — 13 November 2026

Added public `/verify` and `/verify/:passportId`, without a sign-in requirement. Pending and failed anchors remain unverified. A success message requires both anchored status and `matches: true`. Only validated transaction hashes form Amoy explorer links. The UI explains the limits of hash verification and labels the network as testnet.

Buyer orders now support receipt confirmation, cancellation, disputes and passport lookup. Authorized seller users can progress orders through processing, ready and dispatched; group contributions are visible as individual orders. These controls use the backend authorization checks and immutable completion workflow.

Seller and platform analytics include business performance with denominator definitions and unavailable-data explanations. Material totals remain separate by unit. Real settlement, provider refunds, ratings and reports remain open.

Cloudflare Pages: production branch main, build `npm run build`, output dist, Node 24. Set public `VITE_API_URL` to the reachable HTTPS API ending in `/api/v1`. Never expose backend credentials in VITE variables. Pages supplies the static SPA fallback when there is no top-level 404.html. Test `/verify/:passportId` directly after deployment. Backend HTTP service and blockchain worker need compatible hosting and scheduling separately.

Validation: ESLint, formatting and production build pass. Backend review documents isolated database, local contract and browser acceptance evidence. No production deployment is claimed by this document.
