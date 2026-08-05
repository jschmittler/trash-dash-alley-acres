export const POWERUP_PAUSE_DURATION = 0.5;
export const POWERUP_NOTICE_DURATION = 0.9;

const POWERUP_NOTICES = {
  taco: {
    kind: "taco",
    title: "TACO POWER!",
    accent: "#ffb13b",
  },
  cap: {
    kind: "cap",
    title: "GLIDER READY!",
    accent: "#ffe174",
  },
};

export function createPowerupNotice(kind) {
  const notice = POWERUP_NOTICES[kind];
  if (!notice) throw new Error(`Unknown power-up notice: ${kind}`);
  return { ...notice };
}

export function powerupNoticeProgress(elapsed) {
  return Math.max(0, Math.min(1, elapsed / POWERUP_NOTICE_DURATION));
}
