import { BASE_CLASSES } from './builds/index.ts';
import type { ClassDef, ClassId } from './class-types.ts';

export type { ClassDef, ClassId, ClassRole } from './class-types.ts';

/** Every class, defined alongside its talents and advanced classes in src/data/builds. */
export const CLASSES: Record<ClassId, ClassDef> = BASE_CLASSES;

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
export const STARTER_CLASS_IDS = CLASS_IDS.filter((id) => !CLASSES[id].unlockable);
