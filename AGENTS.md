This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project collaboration conventions

- Follow `README.md` → “커밋 컨벤션, 브랜치 전략” for commit and branch names. Read it and inspect recent commits before suggesting or writing a commit title; preserve gitmoji, type case, punctuation, and noun endings.
- Use this Mobile repository's issue numbers, not Frontend issue numbers. Do not invent issue numbers or claim a documented branch already exists without checking Git.
- Use `.github/ISSUE_TEMPLATE/issue_template.md` and `.github/pull_request_template.md` when drafting issues or PRs.
- Distinguish type/lint results, actual device verification, and unverified platforms. Link an ongoing issue without closing it; use `Closes` only when the whole issue is complete.

## Source organization

- Follow `ARCHITECTURE.md` for this project's organization; these are local choices, not mandatory React Native conventions.
- Keep routes in `src/app` thin. Put feature screens, components, hooks, fixtures and utilities under their respective feature folders.
- Use role-based screen names without `Preview`. Keep development data explicitly in `fixtures`; renaming a screen does not remove development guards or authorize real API integration.
- Put fixed styles next to the component in `ComponentName.styles.ts`. Import shared theme values from `@/styles/theme`.
- Move complex screen state/effects/actions to feature hooks. Keep small component-local UI state local rather than adding unnecessary abstractions.
- Structural changes must preserve the existing quote layout, style values and interactions. Keep automatic checks and actual device verification separate.

## Formatting

- Use the pinned local Prettier version and `.prettierrc`. Run `npm run format` and `npm run format:check`; do not pass ad hoc quote or width overrides.
- The formatter options match the current Frontend configuration (double quotes, 2 spaces, width 80). This is a project choice, not a React Native requirement.
- Keep formatting-only changes separate from feature changes. Preserve the asset-require test harness support for both quote styles.
