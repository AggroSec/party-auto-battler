/**
 * Testing tools (the Unlock everything toggle and the combat lab) only exist
 * in `npm run dev` builds. Brandon (1.0): players earn their unlocks.
 */
export const DEV_TOOLS: boolean = import.meta.env.DEV;
