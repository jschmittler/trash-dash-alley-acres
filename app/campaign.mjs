import { registerCampaignLevels } from "./campaign-level.mjs";
import { LEVEL_ONE } from "./level-one.mjs";
import { LEVEL_TWO } from "./level-two.mjs";

export const CAMPAIGN_LEVELS = registerCampaignLevels([LEVEL_ONE, LEVEL_TWO]);
