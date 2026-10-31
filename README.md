# Party Auto-Battler (working title)

A browser-playable party auto-battler with RPG classes and builds. You draft a party, position it, equip it and level it up between rounds, then the fight resolves on its own. Think Super Auto Pets or Backpack Battles, with the depth coming from CRPG-style classes, talent choices and advanced-class upgrades.

> 🚧 In development. Milestones 1–8 are done: the combat engine, run loop, builds (levels 1–10, stat points, talents, advanced and tertiary classes, talents that grant a second ability, items, synergies), a playable UI with drag-to-position and animated combat playback, 14 classes with 84 advanced and tertiary classes, stacking statuses (Runes, Dread, Blight, damage over time), and meta progression (a 10-tier difficulty ladder, 36 achievements that unlock classes, items, synergies and starting perks, signature items for every tertiary class, shop locks and a daily run), and juice (game-icons.net icons, retro sound effects made in code, combat and shop animations, a credits screen). Next: shipping. See [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md) for progress.

## Play

**[Play in your browser](https://aggrosec.github.io/party-auto-battler/)**. It works on phones too. The site redeploys on every merge to `main`, so it always shows the latest reviewed build. **Export play log** on the title screen saves your recent runs as a file that `npm run playlog -- <file>` can replay.

## Running locally

Requires Node 22.12+ (Node 24 LTS recommended, matching CI).

```sh
npm install
npm run dev     # play locally (dev builds add the combat lab and an Unlock everything toggle to the title screen)
npm run check   # typecheck + lint + tests
npm run sim     # headless balance simulator
npm run playlog # replay play logs recorded by npm run dev (playlogs/)
npm run icons   # re-fetch the game-icons.net icons and regenerate their credits
npm run build   # production build
```

## Project layout

```
src/engine/   pure, deterministic game logic (no DOM, no Math.random)
src/data/     classes and other content as typed data
src/sim/      headless balance simulator
src/ui/       React UI (src/ui/audio: sound effects)
src/assets/   icons (generated) and ATTRIBUTION.md
docs/         design doc, decision log, checkpoints, balance reports
```

## How this was built

Brandon designed and directed this project. [Claude Code](https://claude.com/claude-code) wrote the code. The process is part of the showcase:

- [CLAUDE.md](CLAUDE.md): the project brief and working agreement Claude Code follows
- [docs/DESIGN.md](docs/DESIGN.md): the living game design doc
- [docs/DECISIONS.md](docs/DECISIONS.md): every decision Claude Code made autonomously, with reasoning
- [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md): milestone summaries reviewed by Brandon
- [docs/BALANCE.md](docs/BALANCE.md): simulator reports used to balance before playtesting
