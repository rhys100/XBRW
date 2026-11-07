# How ccc/main differs from upstream

This file lives on `ccc/main` only. It is the fork's own build of XBRW++
(rhys100/XBRW), made from hessius's `develop` plus the work listed here. It
never goes into a branch meant for upstream.

- Upstream: https://github.com/hessius/XBRW (`upstream`, branch `develop`)
- Fork: https://github.com/rhys100/XBRW (`origin`)
- Base of this build: upstream `develop` at `584d1518` (8 Nov 2026 rebuild, after #297)
- The build before this one is kept at the tag `archive/ccc-main-2026-11-08` (`e0dce38`); before that `archive/ccc-main-2026-10-24` (`c0fd4b2`) and `archive/ccc-main-2026-10-23` (`5041763`)

Each row says what the feature does, our pull request if there is one, what
upstream decided, whether `ccc/main` keeps our version, and the main files.
Test files and docs are left out of the file lists.

## Kept because upstream rejected

| Feature | What it does | Our PR | Upstream decision | ccc/main keeps ours | Files |
|---|---|---|---|---|---|
| Roasters on the home screen | A strip of subscribed roasters under the home tiles, roaster coffees in home search, a BROWSE button in an empty library, and a "Show roasters on the home screen" switch. Pins are upstream's Show in Import choices. | https://github.com/hessius/XBRW/pull/240 | Rejected (closed). The pin became upstream's "Show in Import". | Yes, ported onto Show in Import | `components/RoasterStrip.tsx`, `components/RoasterSearchRow.tsx`, `components/EmptyLibrary.tsx`, `hooks/useHomeRoasters.ts`, `library/roasterHome.ts`, `app/index.tsx`, `app/settings.tsx`, `library/Settings.ts` |
| A copy of a roaster's coffee keeps its colour | Copying a recipe that names a roaster keeps the coffee's card colour. | https://github.com/hessius/XBRW/pull/245 | Rejected as broader than needed (closed). Upstream took the colour from feeds and links (`library/roasterColour.ts`). | Yes, narrowed to coffees that name a roaster | `library/RecipeDatabase.ts` |

## Pending upstream

| Feature | What it does | Our PR | Upstream decision | ccc/main keeps ours | Files |
|---|---|---|---|---|---|
| Half-point ratios survive import (`fix/half-point-ratio-import`) | Import keeps xBloom's ratio (1:14.5) when the stages match it, instead of rounding it and refusing to brew. Saved rounded copies are repaired once. Also: Quick Edit steps a half-point ratio in halves, and a backup keeps a brew quick-edited away from one. | [#298](https://github.com/hessius/XBRW/pull/298) | Open, sent 8 Nov 2026 | Yes, merged | `library/recipeIdentity.ts`, `library/xbloomRecipeData.ts`, `library/XBloomRecipe.ts`, `library/halfPointRepair.ts`, `library/RecipeDatabase.ts`, `hooks/useRecipeLibrary.ts`, `library/backup.ts`, `components/QuickEditPanel.tsx`, `app/brew.tsx` |

## Fork-only (never offered)

| Feature | What it does | Our PR | Upstream decision | ccc/main keeps ours | Files |
|---|---|---|---|---|---|
| Central Coast Coffee already subscribed | Once per install, fresh or existing, adds the Central Coast Coffee feed as a never-synced subscription and chooses it for Show in Import, so it is on home. The next ordinary sync reads it. Already subscribed does nothing, an unsubscribe stays gone (the `cccFeedSeeded` flag is not in a backup), offline costs nothing, and no offer sheet appears. If Show in Import already holds three, it is subscribed but not chosen. | None | Never offered | Yes | `library/cccFeedSeed.ts` (`CCC_FEED_URL`), `hooks/useRoasterForegroundSync.ts`, `library/Settings.ts` |
| Coffee bags on by default | Turns hessius's bag Labs switch on by default, because this build's owner tracks bags every day. It still turns off in Labs. Upstream tests that start from off now set it off first. | None | Never offered | Yes | `library/Settings.ts`, `app/settings.tsx` |
| Readable filled labels on by default | Turns `solidControlLabels` on. See the defaults table below. | None | Never offered | Yes | `library/Settings.ts` |
| Coffee details on cards on by default | Turns `showRecipeCardDetails` on. See the defaults table below. | None | Never offered | Yes | `library/Settings.ts` |
| One-tap Easy Mode write on by default | Turns `easyModeOneTapWrite` on. See the defaults table below. | None | Never offered | Yes | `library/Settings.ts` |
| Add a catalogue coffee to a shelf with its bag | With bags on, ADD TO SHELF opens upstream's bag form filled from the catalogue (sizes, price, roast level and advice, name). The bag is made, linked and chosen once the recipe is shelved. | None (was in hessius's preview) | Never offered | Yes, rebuilt on hessius's bag model | `app/roasterCoffee.tsx`, `library/roasterBag.ts`, `components/BagSheet.tsx` (a `suggestedName` prop) |
| Reorder the same bag size | A bag's REORDER opens the subscribed catalogue's buy link for the same size, else the coffee's page. | None (was in hessius's preview) | Never offered | Yes, on hessius's bag section | `components/BagManagement.tsx` |
| Save as this dose | SAVE AS under the quick-edit explainer, in the editor and on the home sheet, writes the moved dose into the recipe (stages rescaled, bypass scaled by upstream's `scaleBypassForDose`). The editor writes at once only when nothing else waits for SAVE. | Was part of https://github.com/hessius/XBRW/pull/239 | Left out of #267, and #277 confirms no SAVE AS | Yes, rebuilt on #267's dose shortcuts | `library/quickEdit.ts` (`rescaleDose`, `recipeAtDose`, `canSaveDose`, `withoutDose`), `components/QuickEditPanel.tsx`, `app/editRecipe.tsx`, `app/index.tsx`, `hooks/useRecipeLibrary.ts` |
| Home roaster tests order | Keeps the home roaster tests above upstream's machine switching block, which leaks into later tests. | None | Never offered | Yes | `app/__tests__/index.test.tsx` |

## Defaults this build changes

Each is hessius's own switch with a different starting value. All still turn off where he put them.

| Setting | Where the switch is | Upstream | ccc/main | Why |
|---|---|---|---|---|
| `bagExperimentEnabled` | Labs | off | **on** | The owner tracks bags every day. |
| `solidControlLabels` | Appearance, "Solid button labels" | off | **on** | Our readable filled buttons, https://github.com/hessius/XBRW/pull/268, which he took as this option in #280. The owner asked for them. |
| `showRecipeCardDetails` | "Coffee details on cards" | off | **on** | Our variety and process line, https://github.com/hessius/XBRW/pull/271, taken as this option in #281. |
| `easyModeOneTapWrite` | Labs, "Write Easy Mode slots on selection" | off | **on** | Our https://github.com/hessius/XBRW/pull/275, closed as superseded by his #287. Choosing a slot from WRITE writes all three slot drafts to the machine. |

Left as upstream set them, on purpose:

| Setting or gate | Upstream | Why it stays |
|---|---|---|
| Machine tools and settings (#284, #292): the Grind, Scale and Pour tools and the six setting editors | Gated by `controlCapabilities`; production profiles are empty, so no tool command is enabled. The #292 Machine Settings sheet (temperature and weight unit, brightness, water source) is shown when linked. | These write to a real machine and depend on his hardware qualification. Not ours to open. |
| xBloom Collective built-in feed (our https://github.com/hessius/XBRW/pull/278, via #281) | Hidden unless `EXPO_PUBLIC_XBLOOM_FEED_URL` is set | The endpoint returned 404 on 8 Nov 2026 at both `xbrw.app` and `xbrwplusplus.vercel.app`, so there is nothing to turn on yet. Once it is deployed, this is a build variable. |
| `showRecipeCardPhotos` | off | Not new in this round, and #277, #283 and #286 add no switch for it. Worth asking the owner: our pictures-by-default request was never taken. |
| `beanconquerorHandoff` | off | Labs. Not something this round's work hides. |
| `machineAutoStart`, `machineConsoleAcknowledged` | off | Machine behaviour, left as he set it. |

#277, #283, #286 and #290 add no other switches. #283's slot link, write chooser and roaster search are on for everyone.

## Upstream adapted (we use his version)

| Feature | What it does | Our PR | Upstream decision | ccc/main keeps ours | Files |
|---|---|---|---|---|---|
| Dose shortcuts and proportional bypass | One-tap 15, 18 and 20 g chips (plus the recipe's dose) in quick edit, with the bypass scaling with the dose. | https://github.com/hessius/XBRW/pull/239 | Adapted as https://github.com/hessius/XBRW/pull/267; ours closed. He dropped SAVE AS. | No, his version. SAVE AS is kept fork-only (above). | `components/QuickEditPanel.tsx`, `library/quickEdit.ts`, `library/bypassLimits.ts`, `hooks/useRecipeEditor.ts` |
| Bag tracker, rest and peak, Ready to brew | Coffee bags, freshness guidance and the home Ready to brew card. | https://github.com/hessius/XBRW/pull/238, https://github.com/hessius/XBRW/pull/241, https://github.com/hessius/XBRW/pull/242 | Adapted as https://github.com/hessius/XBRW/pull/266 behind a default-off Labs switch; ours closed as superseded | No. His model (bags shared across recipes, explicit No bag, run accounting). Our old bag data migrates from the `coffee_bags` table. | `library/CoffeeBagDatabase.ts`, `library/coffeeBag.ts`, `library/bagMigration.ts`, `components/BagSheet.tsx`, `components/BagManagement.tsx`, `components/ReadyToBrewCard.tsx`, `hooks/useBagManager.ts` |
| Magenta primary buttons | Primary actions filled in the brand colour. | https://github.com/hessius/XBRW/pull/243 | Adapted inside https://github.com/hessius/XBRW/pull/264 (appearance themes) | No | `constants/colors.ts`, `hooks/useAppearance.tsx` |
| Roaster catalogue from a feed link | Feed link, subscribe offer, catalogue and coffee page. | https://github.com/hessius/XBRW/pull/237 | Adapted as https://github.com/hessius/XBRW/pull/263 | No | `app/roaster*.tsx`, `library/roaster*.ts` |
| Pin a roaster | Keep a roaster to hand. | https://github.com/hessius/XBRW/pull/240 | Adapted as "Show in Import", up to three | No, but the home strip reads those choices | `app/subscription.tsx` |
| Picture in the editor header, cards and tiles | Recipe pictures in more places. | https://github.com/hessius/XBRW/pull/235 | Merged, then redesigned by hessius | No | `components/RecipeCard.tsx` |
| Settings opens on machines | Machine-first settings. | https://github.com/hessius/XBRW/pull/231 | Merged with his simplified layout | No | `app/settings.tsx` |
| One-tap Easy Mode write | From WRITE, Easy Mode shows PLACING with REPLACE or ADD on each slot; choosing one assigns and writes all three, connecting first if needed, then returns to the editor with a toast. | https://github.com/hessius/XBRW/pull/275 | Closed as superseded by his https://github.com/hessius/XBRW/pull/287, a default-off Labs setting | No, his version, default on here | `hooks/useEasyModePlacement.ts`, `app/easyMode.tsx`, `components/EasyModeSlots.tsx` |
| Readable filled button labels | Filled controls use the body face. | https://github.com/hessius/XBRW/pull/268 | Merged via https://github.com/hessius/XBRW/pull/280 as the opt-in "Solid button labels" | No, his version, default on here | `components/FillLabel.tsx` |
| Catalogue rows and card details | Catalogue rows show origin, variety and process; a home card with no note shows variety and process. | https://github.com/hessius/XBRW/pull/271 | Merged via https://github.com/hessius/XBRW/pull/281. Rows always; cards behind "Coffee details on cards" | No, his version, card line default on here | `components/RoasterCoffeeRow.tsx`, `components/RecipeCard.tsx`, `library/coffeeDetails.ts` |
| xBloom Collective feed | A built-in feed of xBloom's new releases. | https://github.com/hessius/XBRW/pull/278 | Merged via https://github.com/hessius/XBRW/pull/281, hidden until an endpoint is configured | No, his version, still hidden (see above) | `api/feeds/xbloom.ts`, `library/builtInFeeds.ts` |
| Easy Mode slots keep their library link | Saving an unsaved recipe first, so a slot does not later say REMOVED FROM LIBRARY. | https://github.com/hessius/XBRW/pull/272 | Merged via https://github.com/hessius/XBRW/pull/283, with his changes on same-link copies | No, his version | `library/slots/slotSource.ts`, `components/EasyModeSlots.tsx` |
| WRITE asks Easy Mode slot or NFC card | A small chooser when a machine is remembered. | https://github.com/hessius/XBRW/pull/273 | Merged via https://github.com/hessius/XBRW/pull/283 | No, his version | `components/WriteChooserSheet.tsx`, `app/editRecipe.tsx` |
| Roaster coffees in the slot picker | Slot picker search finds subscribed roasters' coffees. | https://github.com/hessius/XBRW/pull/274 | Merged via https://github.com/hessius/XBRW/pull/283, on cached feeds with cancellable lookups | No, his version | `app/easyMode.tsx`, `library/roasterSearch.ts` |
| OPEN RECIPE label | The catalogue coffee's primary action says what it does. | https://github.com/hessius/XBRW/pull/270 | Merged via https://github.com/hessius/XBRW/pull/280 | No, his version | `app/roasterCoffee.tsx` |
| List cards fill a wide window | Home and catalogue rows span an unfolded foldable. | https://github.com/hessius/XBRW/pull/269 | Merged via https://github.com/hessius/XBRW/pull/280 | No, his version | `components/SwipeableRecipeRow.tsx` and the other rows |
| Long header titles wrap | A long name wraps beside the back key. | https://github.com/hessius/XBRW/pull/276 | Merged via https://github.com/hessius/XBRW/pull/280 | No, his version | `components/ScreenHeader.tsx` |
| FROM names the roaster | ABOUT's FROM names the roaster and XPOD labels the xBloom profile name. | None (part of #237's first version) | Taken in https://github.com/hessius/XBRW/pull/277 | No, his version | `components/FromSection.tsx`, `components/PodSection.tsx` |
| FLAVOUR leads with flavours | Flavours first, the roaster's notes under them. | None | Taken in https://github.com/hessius/XBRW/pull/277 | No, his version | `components/PodCoffeeRows.tsx`, `library/coffeeDetails.ts` |
| "Updates paused" with nothing cached | A paused roaster never loaded says Updates paused. | None (from his preview) | Taken in https://github.com/hessius/XBRW/pull/277 | No, his version | `library/subscriptionStatus.ts` |
| Chosen size chip colours | The chosen 15G or 18G chip uses the selection colours. | None | Taken in https://github.com/hessius/XBRW/pull/277 | No, his version | `app/roasterCoffee.tsx` |
| Single cancel before a brew | At most one cancel, only when needed. | https://github.com/hessius/XBRW/pull/247 | Merged, then made stricter (ownership and ticket checks) | No | `library/machine/Machine.ts` |

### What our bag version had that his does not

- Opening Beanconqueror straight after a catalogue bag is made. His rule is no automatic app launch; ADD TO BEANCONQUEROR in the bag form still sends it.
- Nothing else of substance. Ours tied each bag to one recipe with one open bag at a time; his bags are independent of recipes, and that is a different model rather than a missing feature.
- His version adds what ours lacked: shared bags across recipes, an explicit No bag, per-brew accounting that survives history deletion, "check remaining coffee" when a brew's use is unknown, and backup validation.
- Both have: a roast day calendar picker, rest and peak guidance, Ready to brew, REORDER, and a Beanconqueror bag handoff.

### What our one-tap write had that his does not

- Nothing of substance. Both show PLACING, say REPLACE or ADD on each slot, connect first, write all three and return to the editor with "Written. <recipe> is in slot A."
- The differences: his runs only behind the switch and only from the editor's WRITE, and it also checks that the machine connected is the one intended, which ours did not. When a write cannot start, both bring the normal screen back with the reason.

## Rebuilding ccc/main after upstream moves

These are the steps used for the 24 and 25 Oct and 8 Nov 2026 rebuilds. Use a worktree, never the
shared checkout.

1. `git fetch upstream && git fetch origin`. If `origin/develop` is an ancestor of
   `upstream/develop`, fast-forward it: `git push origin upstream/develop:refs/heads/develop`.
2. Tag the current head before replacing it, and push the tag:
   `git tag archive/ccc-main-<date> origin/ccc/main && git push origin archive/ccc-main-<date>`.
3. Check what upstream merged since the last base (`git log <old base>..upstream/develop`).
   Move any row above whose upstream decision changed, and drop our version of
   anything upstream now does itself.
4. Rebase each fix branch onto `upstream/develop` (stacked ones with
   `git rebase --onto <rebased parent> <old parent tip>`), run its tests, and push
   with `git push --force-with-lease`. They are ours and not published upstream.
   Never force-push a branch with an open upstream PR without checking first.
5. Start a fresh branch from `upstream/develop` and run `npm ci` if the lockfile moved.
6. Merge the open upstream PRs we keep (none since #239 became #267), then add the
   fork-only commits (cherry-pick from the archive tag), then merge the fix branches
   with `--no-ff`. `docs/release-2.2.0-changes.md` and `docs/copy.md` conflicts are
   both sides kept. `app/roasterCoffee.tsx` conflicts: keep the bag functions and
   call the action `openRecipe`.
7. Run `npx tsc --noEmit`, `npx eslint .` and `npx jest` (both platforms). Paths go
   before `--selectProjects`, which otherwise swallows them and runs everything.
   Upstream's own CI skips a list of machine and settings suites
   (`testPathIgnorePatterns` in `.github/workflows/ci.yml`), several of which fail
   on `develop` itself. Compare any failure with `upstream/develop` before blaming
   this build.
8. Point `ccc/main` at the new head and push it with `--force-with-lease`.
9. Build the APK: `gh workflow run android-preview.yml --repo rhys100/XBRW -f ref=ccc/main`,
   then check the release `preview-ccc-main` for the new asset.
10. Update this file.
