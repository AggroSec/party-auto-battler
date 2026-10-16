# Party Auto-Battler (working title)

A browser-playable party auto-battler with RPG classes and builds. You draft a party, position it, equip it and level it up between rounds, then the fight resolves on its own. Think Super Auto Pets or Backpack Battles, with the depth coming from CRPG-style classes, talent choices and advanced-class upgrades.

> 🚧 Early development. Milestone 1 (engine core) is done; the playable game arrives in Milestone 4. See [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md) for progress.

## Running locally

Requires Node 20.19+.

```sh
npm install
npm run dev     # local dev server (currently an engine debug view)
npm run check   # typecheck + lint + tests
npm run sim     # headless balance simulator
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
