# ReThread frontend update

Branch: `fix/rethread-ui-polish`, existing PR #7. Backend unchanged.

## Changes

- Supplied ReThread logo in shared branding and browser favicon; no gap in wordmark; browser title without em dash.
- Purple/coral/floral palette from poster and slide references across public pages and all role portals.
- Shared button normal, hover, pressed, focus and disabled states.
- Rounded sticky public header, sticky portal header, active navigation indication.
- Responsive forms, cards, grids, action rows and scrollable tables, including 320px screens.
- Listing purchase actions separated to prevent collisions.
- Browse filter reset clears search/material/unit/sort and returns to page one, shared by public and buyer discovery.
- Customer-facing Demo stock badges removed; admin sample records still distinguished accurately.
- Scroll reveals, floating decorations, perspective hover elevation and layered shadows; reduced-motion preferences respected.
- Profile access in every portal and from header identity chip.
- Browser-only display name and picture, account-scoped on the current browser. Pictures support PNG/JPEG/WebP up to 500 KB. Preview, remove, save and reset controls included. Storage errors are reported.
- Registered full name/email remain visible and unchanged. Appearance does not sync across devices or change server account data.
- Existing password reset and role-aware organization links; owner organization-name edit remains API-backed.

## SonarCloud

The existing GitHub SonarCloud integration already analyzes PR #7. No duplicate scanner was added. The previous commit's quality gate passed, but reported 91 new issues, zero security hotspots and 0% new-code coverage. Passing is not an issue-free claim. Current results: https://sonarcloud.io/dashboard?id=Raazia-Imran_ReSourcePK_Frontend&pullRequest=7

## Update your existing clone

Run these commands in your frontend directory, not the backend directory:

```bash
cd ReSourcePK_Frontend
git status
git fetch origin
git switch fix/rethread-ui-polish
git pull --ff-only origin fix/rethread-ui-polish
npm ci --ignore-scripts
npm run dev
```

If the branch is not present locally, use `git switch --track origin/fix/rethread-ui-polish` instead of `git switch fix/rethread-ui-polish`.

If `git status` lists edits you want to keep, commit them or run `git stash push -u -m "My local frontend changes"` before switching. Reapply with `git stash pop` after pulling and resolve any conflicts. Do not discard local work.

Keep your existing frontend `.env` and backend configuration. Run your backend as usual. The UI branch is not merged into main, so pulling main alone will not show these changes. Open the localhost address Vite prints. Build a production bundle with `npm run build`.

## Verification

The prior visual update passed 336 Chromium route/width checks and interactions. This addition passes lint/build/format and focused browser persistence/reset checks across buyer, owner, manager, staff, admin and reviewer. Browser tests use synthetic API fixtures; they do not verify live payments. No backend routes were written or changed; auth and workspace-data routes were read to verify supported actions.
