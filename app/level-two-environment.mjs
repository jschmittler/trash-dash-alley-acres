import { levelTwoEnvironmentRecords } from "./level-two-enemies.mjs";
import { LEVEL_TWO } from "./level-two.mjs";

export const LEVEL_TWO_HYDRANT_ENVIRONMENT_RECORD = Object.freeze({
  ...LEVEL_TWO.boss.hydrant,
  kind: "hydrant",
  encounterId: "brutus",
});

export const LEVEL_TWO_ENVIRONMENT_TRANSITIONS = Object.freeze([
  "entry",
  "death",
  "retry",
  "checkpoint-recovery",
  "phase-change",
  "defeat",
  "exit",
  "re-entry",
]);

const materializeLevelTwoEnvironment = (level) => {
  if (level?.id !== "level-2") return [];
  return [
    ...levelTwoEnvironmentRecords(),
    ...(level.boss?.hydrant
      ? [LEVEL_TWO_HYDRANT_ENVIRONMENT_RECORD]
      : []),
  ];
};

export function transitionLevelTwoEnvironment(previous, level, transition = "entry") {
  if (!LEVEL_TWO_ENVIRONMENT_TRANSITIONS.includes(transition)) {
    throw new RangeError(`Unknown Level 2 environment transition: ${transition}`);
  }
  // Static environment identities are materialized once per world. Lifecycle
  // events update the owner state without reconstructing or appending props.
  const records = previous?.records ?? Object.freeze(
    materializeLevelTwoEnvironment(level).map((record) => Object.freeze(record)),
  );
  const ids = new Set(records.map(({ id }) => id));
  if (ids.size !== records.length) throw new RangeError("Duplicate Level 2 environment ID");
  return Object.freeze({
    transition,
    revision: (previous?.revision ?? 0) + 1,
    records,
  });
}

export function createLevelTwoEnvironment(level) {
  return transitionLevelTwoEnvironment(undefined, level, "entry").records;
}

export function createLevelTwoEnvironmentRuntime(level, transition = "entry") {
  const environmentState = transitionLevelTwoEnvironment(undefined, level, transition);
  return {
    level,
    environmentState,
    environment: environmentState.records,
  };
}

export function applyLevelTwoEnvironmentTransition(runtime, transition) {
  if (!runtime?.level) throw new TypeError("Level 2 environment runtime requires a level");
  const environmentState = transitionLevelTwoEnvironment(runtime.environmentState, runtime.level, transition);
  runtime.environmentState = environmentState;
  runtime.environment = environmentState.records;
  return runtime;
}
