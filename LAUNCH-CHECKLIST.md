# Rough-In Redlines 2.1 — website launch checklist (branch `site-2.1`)

`site-2.1` = `main` + the held `manual` branch + the 2.1 content. **Nothing here is live until it is merged to `main`.**
Merge only when Rough-In Redlines 2.1 is approved in the App Store (and Crew/subscriptions are on PRODUCTION).

## 1. Before merging

- [ ] **Attorney-approved legal text.** Replace the drafts with the approved wording:
  - `privacy-2.1-DRAFT.html` → its approved text goes into **`privacy.html`** (new effective date). Leave out the
    approval-requests section (3) unless approvals launch too.
  - `terms-2.1-DRAFT.html` → the approved Crew section (and Google Play section) goes into **`terms.html`** as a new
    agreement version (e.g. v1.1). Bumping the version re-asks every user in the apps — ship it with the app build that
    carries the same text, and paste it into App Store Connect → License Agreement if the custom EULA is used.
  - Then **delete both DRAFT files** and their two `Disallow` lines in `robots.txt`.
- [ ] **Store links** (search the site for `data-launch-todo`):
  - [ ] **Website installer**: `index.html` links `/downloads/Rough-In-Redlines_2.1_x64-setup.exe` (two places). Upload the
        signed 2.1 installer there (GitHub Pages serves files < 100 MB) or change the URL, and bump
        `windows/latest.json` (`version`, `date`, `notes`) so Check for updates offers 2.1.
  - [ ] **Google Play**: `https://play.google.com/store/apps/details?id=com.randykraft.roughin` (index hero note, pricing
        note, download card). Confirm it opens publicly once the app is in **production** (it 404s while only in testing).
  - [ ] **Microsoft Store**: still the existing listing `9N7GGCQNF7K7`. Confirm the V2/2.1 Store listing is live there (or
        replace the ID if 2.1 is a new listing).
  - [ ] **App Store**: `https://apps.apple.com/app/id6828113217` (the RK Technology app). The old `6819901021` on `main`
        is the never-released Bergstrom-team record — gone on this branch. Optionally swap the text buttons for Apple's
        and Google's official badges.
- [ ] Prices still right: Crew $14.99 (Apple) / $15 (Lemon Squeezy), Pro $39.99, 3 devices per subscription, 1–5 per
      license, 7-day trial for 4 people.
- [ ] Re-check the panel-schedules wording: the "Panel schedules are on the iPad for now" line was removed from the
      Windows section (not re-verified for 2.1).

## 2. Merge

```sh
cd /Volumes/Dev/Projects/roughinredlines-site
git checkout main && git pull
git merge --no-ff site-2.1
git push            # GitHub Pages publishes main
```
The `manual` branch is already contained in `site-2.1`; it doesn't need merging separately (the V2 PDF it added is
replaced by `manual/Rough-In-Redlines-User-Manual-2.1.pdf`).

## 3. After publishing

- [ ] Open `/`, `/crew.html`, `/whats-new.html`, `/support.html#manual` on a phone and a PC; click every store button.
- [ ] Manual PDF opens from Support and How-to.
- [ ] Google Search Console: submit `whats-new.html` (it's in `sitemap.xml`).

## What changed on this branch

- Home: 2.1 hero (App Store + Microsoft Store, Google Play + website installer), new **#download** section (four ways),
  Crew live with personal vs company pricing, iPad pricing live, Android in platforms.
- `crew.html`: live; personal subscription vs company licenses; how to start each way; Crew includes Pro; lapse =
  view-only; cancel / account deletion; FAQ.
- `whats-new.html`: every 2.1 item (Crew, share links, one Add, colors/APWA/fills/legends, picture border and stacking,
  Find & Count, Bluebeam, platforms).
- FAQ / compare / support: no more "coming soon".
- Nav on every page: Crew "new", What's new, "Get the app"; "How it works" dropped so it fits; links collapse under 940 px.
- Manual: `manual/Rough-In-Redlines-User-Manual-2.1.pdf` (74 pages) built from `/Volumes/Dev/Projects/roughin-manual`
  branch `manual-2.1` (`node build.mjs rr`; new chapter `src/ch02b-new21.html`).
