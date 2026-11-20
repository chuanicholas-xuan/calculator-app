# Project TODO

Where the calculator app stands. Checked against the repo on 2026-11-20.

**Goal:** a calculator app, web first, then mobile. The web app is done and live. Mobile has not started.

## ✅ Done

**Web app, plain JavaScript version (PRs #1–#22)**
- [x] Vite project set up, GitHub repo, Vercel hosting (deploys on every push to `main`)
- [x] Basic calculator: keypad, `%`, delete (⌫), expression display, keyboard support
- [x] History: grouped by day, tap to reuse an answer, clear with confirm
- [x] Scientific mode: brackets, trig (deg/rad), logs, powers, roots, `x!`, π, e
- [x] Settings with 5 themes, remembered between visits
- [x] 14 converters: Currency (free daily rates, backup source, offline fallback), Length, Mass, Area, Time, Data, Volume, Speed, Temperature, Finance, Date, Discount, Numeral system, BMI

**React rebuild (PRs #23–#34)**
- [x] Every screen rebuilt in React, one PR each
- [x] Maths and storage kept in `src/core/` with no React, so a mobile app can reuse it
- [x] `react` branch merged into `main`; the live site now runs the React version
- [x] README (PR #33) and repo made public

## 🔧 In progress

- [ ] **Automated tests (PR #35, open since 7 Nov).** Adds Vitest and 44 tests for `src/core/`. All 44 pass and the build works. Waiting on you to review and merge.

## 📋 To do (next, web)

- [ ] Merge PR #35, then run `npm test` before every merge
- [ ] Run the tests automatically on GitHub for every PR (GitHub Actions, free for public repos)
- [ ] Accessibility check: screen reader labels on every key, keyboard focus you can see, colour contrast in all 5 themes
- [ ] Check the live site on a real phone (small screens, rotation, the on-screen keyboard)
- [ ] Delete the ~35 old feature branches that are already merged
- [ ] Learning notes still owed from the tutoring: History, Scientific mode, Themes, Converters

## 🗺️ Remaining (later, mobile)

- [ ] Choose the mobile tooling (Expo is the usual start for React Native). This adds new tools, so it needs your OK first
- [ ] Set up the React Native project and plug in `src/core/`
- [ ] Rebuild the screens for mobile: calculator, scientific mode, history, settings and themes, converters
- [ ] Save data on the phone (React Native has no `localStorage`)
- [ ] Test on a real Android and iPhone
- [ ] Publish (Google Play / App Store; both charge developer fees)
