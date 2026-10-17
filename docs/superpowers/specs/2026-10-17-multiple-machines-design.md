# Multiple saved machines: a list, an order, one scan

Status: design and implementation on `feat/multiple-machines`, awaiting review.
Base: `upstream/develop` at `5cb58676`. Nothing in this document has been run
against an xBloom. Every Bluetooth claim below is either read from the code or
marked as untested.

## Problem

The app remembers one machine: `machineDeviceId`, plus `machineModel`,
`machineModelString` and `machineName` describing it. Somebody with a Studio at
home and another machine at work has to "Forget this machine" and pair again
every time they change place. In a cafe with several xBlooms it is worse: a
first-time scan takes whichever machine advertises first.

The two models also grind on scales that do not convert
(`library/machine/machineModel.ts`). A Home Studio and a Work Original are
different settings, so the model has to travel with the machine.

## Goals

- Keep a list of saved machines, any number of them, each with a name.
- One is the default. The rest have a priority order the user controls.
- When the app needs a machine, it scans once and connects to the
  highest-priority saved machine it hears. At home that is Home. At work Home
  is not heard, so it is Work.
- Several saved machines in range at once (a cafe) is handled by the same
  rule: the highest in the order wins, and switching to another is one tap.
- Switching machines switches the model, exactly as `applyMachineReading`
  switches it today.
- Existing users keep their machine as the default, with nothing to do.

## Non-goals

- No change to what is sent to a machine. Choosing or adding a machine sends
  the same connect and handshake any connect sends. No recipe, no brew.
- Never start a brew. A brew still starts only from BREW.
- No cloud sync of the list, and no list in backups (see Data model).
- No drag-to-reorder. See UI.
- No change to the live brew screen (`app/brew.tsx`). A running brew owns the
  link and the machine cannot change under it.

## Maintainer input

hsus (Discord): open to the feature, and suggested the home screen's machine
connection menu "could probably grow to allow for machine selection". That
panel (`components/MachinePanel.tsx`) is now the main place to see and switch
the machine in use. He agreed names are reasonable once there are several, and
asked what happens near several saved machines at once. That is the cafe rule
below.

## Data model

### The list

New setting `savedMachines`, a JSON array stored as a string (the
`hiddenShelves` pattern), parsed by `library/machine/savedMachines.ts`:

```ts
type SavedMachine = {
    id: string;              // BLE peripheral id, as machineDeviceId holds it
    label: string;           // user's name, "" until named, at most 24 chars
    model: MachineModel;     // "studio" | "original", per machine
    modelString: string;     // evidence, as machineModelString
    advertisedName: string;  // evidence, as machineName
    serial: string;          // reported serial, "" until it has connected
};
```

**The order is the priority and the first entry is the default.** There is no
separate default flag: a flag and an order are two facts that can disagree, and
one array has one answer. "Make default" moves an entry to the top.

There is no limit on the number of machines. Names need not be unique. The UI
tells machines apart with `machineTag`: `#H051` (the last four of the serial,
which is printed on the machine) once it has connected, or `ID 7F3A` (the end of
the BLE id) before then.

Parsing is forgiving per entry, like `Settings.get`: a damaged entry is
dropped, the rest survive, a duplicate id keeps its first (higher-priority)
copy, and an entry written before `serial` existed still reads.

### The active machine stays in the four old keys

`machineDeviceId`, `machineModel`, `machineModelString` and `machineName` keep
meaning what they always meant, now for "the machine in use". Every existing
reader goes on working untouched: the editor's BREW gate, the importers and hub
(which read `machineModel`), Easy Mode's slot record (keyed by device id), and
the backup. The list holds the rest.

`resolveSavedMachines(raw, active)` lays the four keys over the active entry.
Code that never heard of the list (the "Your xBloom" row, a restored backup,
Studio detection) writes `machineModel`, and the list believes it. Every write
of the list is made from this overlaid view, so the stored copy cannot drift.

### Migration

None is written. An upgrading user has `machineDeviceId` set and no list, and
`resolveSavedMachines` returns a list of one: their machine, unnamed, as the
default, with the model they had chosen. The list is first persisted when they
change something. Nothing can fail halfway, and a phone that goes back to an
older build finds its four keys where it left them. A test pins that loading
the list on an upgraded phone performs no writes.

### Backups

`savedMachines` joins `machineDeviceId` in `NOT_IN_BACKUP`, for the reason
already given there: on iOS a peripheral id is minted per phone, so a restored
list would name machines the new phone cannot reach. The names go with it,
which is the price.

### Rules, in `library/machine/savedMachineSettings.ts`

- `activateSavedMachine(id)`: save the list (so the outgoing machine keeps its
  model and readings), then set the four keys from the incoming entry. **This is
  the model-switching rule**: selecting Work (an Original) turns the importers
  to the Original; Home turns them back.
- `rememberMachine(id)` is what the link calls after a connect to an id it did
  not start with. Already saved: activate. The only saved machine came back
  under a new id (the stale-id rescan the single-machine path has always had):
  same machine, keeps its name and place. Otherwise a first pairing: append with
  the model already chosen.
- `addAndActivateMachine(entry)` is the add flow's own path, separate from
  `rememberMachine`, which would read a second machine as the stale-id case and
  rename the first.
- `forgetSavedMachine(id)`: forgetting the machine in use hands its place to the
  new default, model included, rather than leaving the phone with no machine
  (an empty `machineDeviceId` takes BREW off every recipe). Forgetting the last
  one clears the keys and readings, as unpairing always has.
- `recordSerial(id, serial)`: kept against the entry, written only when it
  changes.
- `saveSavedMachines(list)`: also pushes the active entry's model to
  `machineModel`, so changing the model in a machine's sheet behaves like the
  old "Your xBloom" row.

## Connection algorithm

### Why one scan, not a connect to each machine in turn

`BleTransport.connect(id)` to a machine that is not there does not fail fast.
Core Bluetooth never times out a pending connection by itself; the transport
gives up at `CONNECT_TIMEOUT_MS` (10 s), and `openLink` retries on
`CONNECT_DELAYS_MS` (five attempts over about 14 s). Trying an absent Home
before Work would cost about a minute.

`BleTransport.scan` is unfiltered and narrows in JavaScript by name prefix or
service UUID, so one scan hears every advertising xBloom at once. The list then
picks. Rhys confirmed this choice.

### The rule (`openLink`)

1. **Fewer than two saved:** unchanged. Connect straight to `machineDeviceId`
   with no scan; rescan only if that id has gone stale. A one-machine user's
   path is byte for byte what it was, and a test pins "no scan".
2. **Two or more saved, a machine picked by hand this session:** connect to
   that one only. No scan, no stale-id rescan (which could take any xBloom).
3. **Two or more saved, nothing picked:** one scan, judged by
   `scanVerdict(found, priority)`:
   - default heard: stop at once;
   - only a lower saved machine heard: keep listening for
     `SAVED_MACHINE_SETTLE_MS` (2 s) in case the default simply has not
     advertised yet, then settle;
   - nothing saved heard: keep listening, up to `SCAN_SECONDS` (10 s).

   Then `bestSavedMachine` takes the highest-priority saved machine heard and
   the normal retrying connect runs against that id alone.
4. **None heard:** `NoSavedMachineError` naming the machines: "None of your
   saved machines is nearby (Home, Work). Check one is switched on, then try
   again." The scan is not repeated (it already listened for all of them), and
   `useBrew`'s relink treats this error as final, so nobody waits twice. **An
   unsaved xBloom is never connected to automatically.** In a cafe it is
   somebody else's machine, and connecting makes it beep.

The scan never sends anything to any machine. Scanning stops when the verdict
says stop, when the settle timer fires, or at `SCAN_SECONDS`, whichever is first,
and `stopScan` always runs in `finally`.

Example (tested): five saved, `bar-1` (default) not nearby, `spare`, `window`
and `bar-2` heard plus one unsaved machine. The link connects to `bar-2`
(highest heard), switches the model to `bar-2`'s, and the survey keeps `spare`
and `window` for the picker to mark Nearby.

### Signal strength

`FoundMachine` now carries `rssi` where the radio reports it. It is used only to
order the add-a-machine list (loudest first, marked NEAREST as a hint). It is
never used to choose between saved machines. The user's order is the rule.

### A pick lasts the session

`chooseMachine` records `chosenThisSession` in module memory. Without it, a
trip to another app would release the link (`holdLinkAcrossAppState`) and the
return would reconnect by priority, switching a cafe user back to the default
without being asked. It is not persisted: the next launch is a new place, and
the order is how the user said to handle a new place.

### When the machine cannot change

`machineChangeBlocker` refuses a switch, an add, and locks every picker row
while a brew is active (`isActiveBrewPhase`) or `lostContact` (the machine is
assumed to still be brewing), and while an Easy Mode slot operation holds the
device (`assertCanForgetDevice`). A switch during a brew would leave a dose on
one machine and the recorder, wake lock and STOP pointing at another.

### Scans do not overlap

The radio has one scanner. `exclusiveScan` queues every scan in `useMachine.ts`
(the launch connect, the picker's look around, the add flow) behind the last, so
a second `BleManager.scan` cannot end the first one's window with its
`stopScan`. Each scan's result is kept as the latest survey.

## UI

All colour from `constants/colors.ts`, sheets through `XbrwSheet`, components at
module scope, no hand-written memoisation, no state reset in effects.

### The picker sheet (`components/MachinePickerSheet.tsx`)

One sheet, opened from two doors:

- **Home screen machine panel** (hsus's suggestion). With two or more saved, a
  `MACHINE  WORK >` row at the top of the panel says whose readings these are
  and opens the picker. With one or none, the panel is unchanged.
- **Editor machine chip** (`components/MachineChip.tsx`), the "brew screen" in
  Rhys's screenshots: a quiet outlined pill, `MACHINE WORK v`, centred directly
  above the BREW / STAGES / ABOUT switch. Not in the hero: the hero holds the
  title and rename glyph and collapses on scroll, so a chip there would crowd
  the title and then disappear. Above the deck switch it sits on the centre
  line, above all three decks, so it names the machine the split BREW will use
  whichever deck is showing. It shares the deck switch's scroll slot so the
  stages deck's sticky profile stays at index 2. Drawn only with two or more
  saved. `maxWidth` 260 with the name truncating, so it fits a folded cover
  screen and does not stretch on the unfolded one.

Opening the sheet runs a short look around (`SURVEY_SECONDS`, 4 s, never stops
early, sends nothing) unless the machine cannot change. A survey from the last
minute is shown while it runs. The sheet scrolls, for ten machines or more.

Three groups:

1. **CONNECTED**: the machine holding the link.
2. **NEARBY**: saved machines the scan heard. One tap switches: drop the
   current link, connect the chosen one, switch the model. Never a brew.
3. **NOT NEARBY**: saved machines not heard, greyed and not selectable. A
   machine that was not heard cannot be connected to, so offering it would only
   offer a wait for a timeout. RESCAN looks again.

The connected machine counts as nearby though it is not expected to advertise
while it holds a link (untested). Before any look, the groups read NOT LOOKED
FOR YET. If no saved machine is heard the sheet says so plainly and offers
RESCAN. Each row shows name, model, Default or Choice N, and the tag.

### Settings (`components/MachineSection.tsx`)

- **No machine:** unchanged. "Connect to my machine" is still the first pairing.
- **One machine:** unchanged ("Your xBloom" model row, Forget row), plus a row
  for the machine itself (so it can be named before a second exists) and **Add
  another machine**.
- **Two or more:** a row per machine in order (star and "Default" on the first,
  "Choice N" after, model, tag, Connected / In use), then Add another machine.
  The single "Your xBloom" row goes, because the model is per machine and is
  set in each machine's sheet; Forget moves into each machine's sheet.

The connected machine's live vitals (serial, firmware, water, grind, mode) stay
where they are: they describe the link, not a list entry. "Start brewing
automatically" stays global; nothing in the code makes it per machine.

**Machine sheet** (`components/MachineDetailSheet.tsx`, owned by
`app/settings.tsx` because a sheet inside the section's scroll view has no
height): name field (24 characters, committed when editing ends, so the chip
does not flicker through each letter), serial or tag, model (SegmentedControl),
Use this machine now, Make default, Move up, Move down, Forget this machine.

**Reordering** is by Make default (one tap to the top) and Move up / Move down.
The app has one drag pattern (`ShelfGrid` with `library/shelfDrag.ts`), built for
a grid of tiles, untestable in the renderer by its own admission, and awkward
for a screen reader. Buttons work with TalkBack and VoiceOver and are enough for
ten machines.

**Adding a machine** (`components/MachineAddSheet.tsx`, `hooks/useMachineAdder.ts`):
a full scan (`ADD_SCAN_SECONDS`, 6 s) lists every unsaved xBloom heard, with a
tag each, loudest first and marked NEAREST as a hint. The user taps one. The
app never adds the first one heard by itself, even when only one is listed. The
connect is pinned to that id (no rescan onto a saved machine). The new machine
goes on the end of the order with the model currently chosen, becomes the
machine in use, and its sheet opens so it can be named. It beeps on connect,
which is how somebody among several confirms it is the right one; the serial in
its sheet is the second check.

### Accessibility

- Every row is one labelled button whose label carries name, model, place, tag
  and state ("Work, Original, Choice 2, #H051, nearby"). Locked and not-nearby
  rows report `disabled`; the connected row reports `selected`.
- Touch targets are at least 44 pt (rows 56).
- Each new sheet is added to its screen's coverage guard (`screenCovered` on
  home and in the editor, the settings screen's hidden flag), so TalkBack cannot
  reach the screen behind it on Android.
- The star is decorative; "Default" is in the words.
- Copy is plain and has no em dashes.

## What needs testing on hardware

None of this has been run against a machine. Software tests use
`FakeTransport`, which hears every device at once and so cannot exercise the
settle timer or real advertising timing.

1. Two machines, default absent: launch connects to the second in under about
   15 s, and the console shows one scan.
2. Two machines in range: the default wins; the settle window is long enough
   that the default is not missed when the other advertises first.
3. Picker: Nearby matches reality; a connected machine is not advertising (the
   assumption behind counting it as nearby); switching drops and takes the link
   cleanly and the machine beeps.
4. Scanning while connected (the picker's look around) does not disturb the
   live link on Android or iOS.
5. Add flow among several unsaved machines: tags and NEAREST are useful, and the
   serial check works.
6. Model switching: import a hub recipe on a Studio, switch to an Original, and
   the importer asks for the Original's version.
7. App to background and back in a cafe after a manual pick: it returns to the
   picked machine.
8. Easy Mode slots follow the machine in use.
9. **Foldable (Rhys's Galaxy Z Fold 8 Ultra, One UI 9.0, Android 17):** chip and
   sheets on the cover screen and unfolded; fold and unfold with the picker
   open and with a machine connected. The machine in use is in settings and
   survives anything; the session pick lives in JavaScript memory and survives
   as long as the JS runtime does. Check that a fold does not restart the
   runtime or drop the BLE link, and that no reconnect is triggered by the
   configuration change itself.

## Open questions for hsus

1. Is `slotIdentity.serial` reliable enough to show as the identifier? The
   Model row reads blank on a connected J15 Studio on Android (seen on Rhys's
   phone), so the info blob is not complete everywhere.
2. Does a machine stop advertising while another phone holds its link? If not,
   the picker could show a machine as Nearby that cannot be connected.
3. Should a new machine inherit the current model, or should the add flow ask?
4. Is 2 s of settle and 4 s of survey a sensible trade on real hardware?
5. Should the editor chip also show link state (not connected, connecting)?
   Today it names the machine in use; when that machine is not connected, BREW
   connects by priority, which in a room with the default present can land on
   the default rather than the machine the chip named. A pick by hand avoids
   that.
