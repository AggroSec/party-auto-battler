# Party Auto-Battler (working title)

A browser-playable party auto-battler with RPG classes and builds. You draft a party, position it, equip it and level it up between rounds, then the fight resolves on its own. Think Super Auto Pets or Backpack Battles, with the depth coming from CRPG-style classes, talent choices and advanced-class upgrades.

> 🚧 In development. Milestones 1–6 are done: the combat engine, run loop, builds (levels 1–10, stat points, talents, advanced and tertiary classes, talents that grant a second ability, items, synergies), a playable UI with drag-to-position and animated combat playback, and 11 classes with 66 advanced and tertiary classes, including summoners. Next: meta progression (Milestone 7), then juice and shipping. See [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md) for progress.

## Play

**[Play in your browser](https://aggrosec.github.io/party-auto-battler/)**. It works on phones too. The site redeploys on every merge to `main`, so it always shows the latest reviewed build. **Export play log** on the title screen saves your recent runs as a file that `npm run playlog -- <file>` can replay.

## Running locally

Requires Node 22.12+ (Node 24 LTS recommended, matching CI).

```sh
npm install
npm run dev     # play locally (the combat lab is linked from the title screen)
npm run check   # typecheck + lint + tests
npm run sim     # headless balance simulator
npm run playlog # replay play logs recorded by npm run dev (playlogs/)
npm run build   # production build
```

## Project layout

```
src/engine/   pure, deterministic game logic (no DOM, no Math.random)
src/data/     classes and other content as typed data
src/sim/      headless balance simulator
src/ui/       React UI
docs/         design doc, decision log, checkpoints, balance reports
```

## How this was built

Brandon designed and directed this project. [Claude Code](https://claude.com/claude-code) wrote the code. The process is part of the showcase:

- [CLAUDE.md](CLAUDE.md): the project brief and working agreement Claude Code follows
- [docs/DESIGN.md](docs/DESIGN.md): the living game design doc
- [docs/DECISIONS.md](docs/DECISIONS.md): every decision Claude Code made autonomously, with reasoning
- [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md): milestone summaries reviewed by Brandon
- [docs/BALANCE.md](docs/BALANCE.md): simulator reports used to balance before playtesting
