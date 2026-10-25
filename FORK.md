# How ccc/main differs from upstream

This file lives on `ccc/main` only. It is the fork's own build of XBRW++
(rhys100/XBRW), made from hessius's `develop` plus the work listed here. It
never goes into a branch meant for upstream.

- Upstream: https://github.com/hessius/XBRW (`upstream`, branch `develop`)
- Fork: https://github.com/rhys100/XBRW (`origin`)
- Base of this build: upstream `develop` at `f48738f` (25 Oct 2026, after #267)
- The build before this one is kept at the tag `archive/ccc-main-2026-10-24` (`c0fd4b2`); the one before that at `archive/ccc-main-2026-10-23` (`5041763`)

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
| "Updates paused" for a paused feed with nothing cached | A paused roaster whose coffees were never loaded says Updates paused, not Loading coffees. | None (from hessius's preview) | Pending backport by hessius | Yes | `library/subscriptionStatus.ts` |
| OPEN RECIPE label (`fix/open-recipe-label`) | The catalogue coffee's primary action says what it does: it opens the recipe, unsaved. | [#270](https://github.com/hessius/XBRW/pull/270) | Open, sent 25 Oct 2026 | Yes | `app/roasterCoffee.tsx` |
| Easy Mode slots keep their library link (`fix/easy-mode-slot-link`) | Putting an unsaved catalogue or link recipe in a slot saves it first, so the slot does not later say REMOVED FROM LIBRARY. Old slots reconnect by share link. | [#272](https://github.com/hessius/XBRW/pull/272) | Open, sent 25 Oct 2026 | Yes | `app/editRecipe.tsx`, `components/EasyModeSlots.tsx`, `library/slots/slotSource.ts` |
| WRITE asks Easy Mode slot or NFC card (`feat/write-chooser`) | With a machine remembered, WRITE opens a small sheet: Easy Mode slot or NFC card. Stacked on the slot link fix. | [#273](https://github.com/hessius/XBRW/pull/273) | Open, sent 25 Oct 2026 | Yes | `app/editRecipe.tsx`, `components/WriteChooserSheet.tsx` |
| Easy Mode WRITE places and writes in one tap (`feat/easy-mode-replace-write`) | From WRITE, Easy Mode shows the recipe being placed and REPLACE or ADD on each slot. Choosing one assigns it and writes all three slots, connecting first if needed. Stacked on the write chooser; only worth offering with it. | [#275](https://github.com/hessius/XBRW/pull/275) | Open, sent 25 Oct 2026 | Yes | `app/easyMode.tsx`, `components/EasyModeSlots.tsx`, `components/EasyModeSlotCard.tsx`, `hooks/useEasyModeSlots.ts`, `app/editRecipe.tsx` |
| Roaster coffees in the Easy Mode slot picker (`feat/easy-mode-roaster-search`) | The slot picker's search also finds subscribed roasters' coffees and saves the one picked. | [#274](https://github.com/hessius/XBRW/pull/274) | Open, sent 25 Oct 2026 | Yes | `app/easyMode.tsx`, `components/EasyModeSlots.tsx`, `library/roasterSearch.ts` |
| Catalogue rows show origin, variety and process (`feat/catalogue-row-details`) | A roaster's coffee rows show origin, variety and process instead of bag sizes, and a home card with no note shows the bean's variety and process. | [#271](https://github.com/hessius/XBRW/pull/271) | Open, sent 25 Oct 2026 | Yes | `components/RoasterCoffeeRow.tsx`, `components/RecipeCard.tsx`, `library/coffeeDetails.ts` |
| List cards fill a wide window (`fix/wide-screen-list-cards`) | The home list rows (and the picking, community and roaster catalogue rows) no longer stop at 600 pt, so on an unfolded foldable the cards span the width instead of sitting flush left. | [#269](https://github.com/hessius/XBRW/pull/269) | Open, sent 25 Oct 2026 | Yes | `components/SwipeableRecipeRow.tsx`, `components/SelectableRecipeRow.tsx`, `components/HubRow.tsx`, `components/RoasterCoffeeRow.tsx` |
| Readable filled button labels (`fix/primary-button-ink`) | Labels on filled controls use the body face: BUY, OPEN RECIPE, SAVE, WRITE TO MACHINE, the editor's recipe-coloured BREW and its arrow, the selected deck tab, accent WRITE, selected rail, bag-size and history chips, the home card's BREW, and the white, red and green sheet buttons. Doto's dark dots on a light fill wash out on a phone. Unfilled and unselected states keep Doto. | [#268](https://github.com/hessius/XBRW/pull/268) | Open, sent 25 Oct 2026 | Yes | `components/FillLabel.tsx`, `components/SplitBrewButton.tsx`, `components/DeckSwitch.tsx`, `app/editRecipe.tsx`, `components/RailChip.tsx`, `components/ReadyToBrewCard.tsx`, `components/CatalogueParts.tsx`, `app/roasterCoffee.tsx`, `app/hubRecipe.tsx`, `app/easyMode.tsx`, `components/EasyModeSlots.tsx`, `components/BagSheet.tsx`, `components/HubSaveBar.tsx`, `components/NameShelfSheet.tsx`, `components/RenameSheet.tsx`, and the sheet buttons in `components/*Sheet.tsx`, `components/ShelfPickerBar.tsx`, `components/NewerVersionPrompt.tsx`, `components/BrewHistoryControls.tsx` |
| Long header titles wrap (`fix/header-title-wrap`) | A long name on a pushed screen (roaster coffee, hub recipe, roaster) wraps beside the back key instead of running off the right edge. | [#276](https://github.com/hessius/XBRW/pull/276) | Open, sent 25 Oct 2026 | Yes | `components/ScreenHeader.tsx` |

## Fork-only (never offered)

| Feature | What it does | Our PR | Upstream decision | ccc/main keeps ours | Files |
|---|---|---|---|---|---|
| Coffee bags on by default | Turns hessius's bag Labs switch on by default, because this build's owner tracks bags every day. It still turns off in Labs. Upstream tests that start from off now set it off first. | None | Never offered | Yes | `library/Settings.ts`, `app/settings.tsx` |
| Add a catalogue coffee to a shelf with its bag | With bags on, ADD TO SHELF opens upstream's bag form filled from the catalogue (sizes, price, roast level and advice, name). The bag is made, linked and chosen once the recipe is shelved. | None (was in hessius's preview) | Never offered | Yes, rebuilt on hessius's bag model | `app/roasterCoffee.tsx`, `library/roasterBag.ts`, `components/BagSheet.tsx` (a `suggestedName` prop) |
| Reorder the same bag size | A bag's REORDER opens the subscribed catalogue's buy link for the same size, else the coffee's page. | None (was in hessius's preview) | Never offered | Yes, on hessius's bag section | `components/BagManagement.tsx` |
| FROM names the roaster | ABOUT's FROM names the roaster and XPOD labels the roaster's xBloom profile name. | None (part of #237's first version) | Never offered on its own | Yes | `components/FromSection.tsx`, `components/PodSection.tsx` |
| FLAVOUR leads with flavours | ABOUT's FLAVOUR shows a coffee's flavours first, the roaster's notes under them. | None | Never offered | Yes | `components/PodCoffeeRows.tsx`, `library/coffeeDetails.ts` |
| Save as this dose | SAVE AS under the quick-edit explainer, in the editor and on the home sheet, writes the moved dose into the recipe (stages rescaled, bypass scaled by upstream's `scaleBypassForDose`). The editor writes at once only when nothing else waits for SAVE. | Was part of https://github.com/hessius/XBRW/pull/239 | Left out of #267 | Yes, rebuilt on #267's dose shortcuts | `library/quickEdit.ts` (`rescaleDose`, `recipeAtDose`, `canSaveDose`, `withoutDose`), `components/QuickEditPanel.tsx`, `app/editRecipe.tsx`, `app/index.tsx`, `hooks/useRecipeLibrary.ts` |
| Chosen size chip colours | The chosen 15G or 18G chip on a roaster's coffee uses the selection colours (readable in Light). Its body-face label now comes from `fix/primary-button-ink`. | None | Never offered | Yes | `app/roasterCoffee.tsx` |
| Home roaster tests order | Keeps the home roaster tests above upstream's machine switching block, which leaks into later tests. | None | Never offered | Yes | `app/__tests__/index.test.tsx` |

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
| Single cancel before a brew | At most one cancel, only when needed. | https://github.com/hessius/XBRW/pull/247 | Merged, then made stricter (ownership and ticket checks) | No | `library/machine/Machine.ts` |

### What our bag version had that his does not

- Opening Beanconqueror straight after a catalogue bag is made. His rule is no automatic app launch; ADD TO BEANCONQUEROR in the bag form still sends it.
- Nothing else of substance. Ours tied each bag to one recipe with one open bag at a time; his bags are independent of recipes, and that is a different model rather than a missing feature.
- His version adds what ours lacked: shared bags across recipes, an explicit No bag, per-brew accounting that survives history deletion, "check remaining coffee" when a brew's use is unknown, and backup validation.
- Both have: a roast day calendar picker, rest and peak guidance, Ready to brew, REORDER, and a Beanconqueror bag handoff.

## Rebuilding ccc/main after upstream moves

These are the steps used for the 24 and 25 Oct 2026 rebuilds. Use a worktree, never the
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
   call the action `openRecipe`; the size chip keeps the selection colours with a
   `FillLabel`. `app/easyMode.tsx` and its test: keep both sides, then drop the
   duplicate `SlotIndex` import and `mockAssign`, and close the roaster test block.
7. Run `npx tsc --noEmit`, `npx eslint .` and `npx jest` (both platforms).
8. Point `ccc/main` at the new head and push it with `--force-with-lease`.
9. Build the APK: `gh workflow run android-preview.yml --repo rhys100/XBRW -f ref=ccc/main`,
   then check the release `preview-ccc-main` for the new asset.
10. Update this file.
