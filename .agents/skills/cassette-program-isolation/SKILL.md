---
name: cassette-program-isolation
description: Rules for the Shadow Theater cassette system — each cassette is a self-contained program (motion, dialogue, BGM/SFX, scene list) that must not leak into other cassettes. Apply whenever adding, editing, or debugging cassette content, scene rendering, or audio routing in src/routes/index.tsx and related scene components.
---

# Cassette Program Isolation

The Shadow Theater app models each story as a **cassette**. A cassette is loaded into the deck via the INPUT/EJECT button on the main title UI. The theater stage then runs *exactly one* program — the one belonging to the loaded cassette.

## Hard rules

1. **One cassette = one program.** A cassette owns its scene list, motion components, dialogue, narration, BGM, and SFX. Nothing from another cassette may render or play while it is loaded.
2. **Gate every scene render on `program`, never on a generic `hasMotionProgram` boolean.** In `TheaterStage` use:

   ```ts
   const program: "ants-grasshopper" | "town-country" | null =
     cassetteId === "ants-grasshopper" ? "ants-grasshopper"
     : cassetteId === TOWN_COUNTRY_STORY.id ? "town-country"
     : null;
   ```

   Every `<SceneNMotion>` / `<StorySceneMotion>` JSX block must be wrapped in `program === "<that-program>" && ...`. Never share a guard between two programs.
3. **No cross-program fallthrough.** If you add a new cassette, extend the `program` union and add a new dedicated render branch. Do not reuse another program's Scene components or audio URLs.
4. **Free-upload workflow is its own state.** `allowSceneUploads = program === null`. Structured cassettes never expose upload/delete UI.
5. **Audio bus must be reset on theater exit.** `TheaterStage` already calls `audioCtl.setSpeed(1)` on unmount; preserve that. Any new per-program audio settings (volume, mute) applied inside the stage must also be reverted on unmount so main-title settings are not polluted.
6. **Default loaded cassette** is `ants-grasshopper`. If you rename a cassette id, update `DEFAULT_CASSETTE_ID` in `src/routes/index.tsx` and every gate referencing the old id in the same edit.

## Bug pattern to avoid

Symptom: loading cassette A shows cassette B's background but plays cassette B's motion/dialogue on top.

Cause: a shared boolean like `hasMotionProgram = cassetteId === "a" || cassetteId === "b"` is used to gate Scene components belonging to only one of them, so they render for the other cassette too.

Fix: replace the boolean with a discriminated `program` value and gate each scene block on the exact program string.

## Files involved

- `src/data/cassettes.ts` — cassette catalog (id, title, subtitle).
- `src/routes/index.tsx` — `ShadowTheaterTitle`, `TheaterStage`, `ListPanel`, `CassetteCard`.
- `src/components/Scene1Motion.tsx` … `Scene5Motion.tsx` — ants-grasshopper program.
- `src/components/StorySceneMotion.tsx` + `src/data/townCountryStory.ts` — town-country program.
- `src/lib/sceneAudio.tsx` — shared audio bus; route every program's BGM/SFX through `useSceneAudio`.

## Checklist when adding a new cassette program

- [ ] Add cassette entry in `src/data/cassettes.ts` with a unique id.
- [ ] Create program data module (scenes, durations, dialogue slots, BGM/SFX urls).
- [ ] Create scene component(s) that consume the bus via `useSceneAudio`.
- [ ] Extend the `program` union in `TheaterStage` and add gated render branches.
- [ ] Verify by loading each cassette in turn that no foreign motion/dialogue/audio appears.