# Trash Dash Enemy Guide

This is the canonical active roster and behavior guide. Character concept art and sprite-reference sheets are linked by repository path so Codex can use them without re-uploading the art.

> **Important:** the sprite-reference sheets in this package are animation/source-art references. They include presentation layout, labels, and effects. They are not automatically production-ready atlases. Runtime extraction must validate transparency, frame boundaries, anchor points, collision geometry, and animation completeness before implementation.

## Global roster decisions

- Fox is removed from the active game roster.
- Bee moved from Level 1 to Level 2.
- Levels 1 and 2 each have five unique standard enemy types.
- Level 3 through Secret Level 6 each have four standard enemy types plus one boss.
- Level 1 boss now has approved concept and sprite-reference art in this package.
- Brutus the Bin-Hound now has approved concept and sprite-reference art in this package.
- Standard enemies use readable telegraphs, committed attacks, hit/recovery states, and humorous non-graphic defeat reactions.
- Flying enemies use hover/flight movement rather than forced terrestrial walk/run states.

## Level 1: Woodlands to City Limits

**Concept:** `reference/characters/level-01/concepts/common-enemies.png`

### Spider - Web-lunge crawler
Low scuttle, readable pre-lunge tension, web-assisted lunge/bite, vulnerable recovery.  
**Sprite reference:** `reference/characters/level-01/sprites/spider.png`

### Pigeon - Ground-and-air nuisance
Ground patrol and pecking behavior with an aggressive wing-assisted rush/peck attack.  
**Sprite reference:** `reference/characters/level-01/sprites/pigeon.png`

### Mosquito - Fast aerial striker
Hover/slow flight, fast straight-line dash, proboscis strike, post-dash recovery.  
**Sprite reference:** `reference/characters/level-01/sprites/mosquito.png`

### Opposum / Pilfer - Sneaky scavenger
Cautious scavenger movement, sudden claw/lunge aggression, bandit/scavenger visual identity.  
**Sprite reference:** `reference/characters/level-01/sprites/opossum-pilfer.png`

### Snake - Coiled ambusher
Slither, coil/telegraph, fast forward strike, stretched vulnerable recovery.  
**Sprite reference:** `reference/characters/level-01/sprites/snake.png`

**Boss concept:** `reference/characters/level-01/concepts/boss.png`

### Boss: Trash Dash, the Toxic Trashbag
Three-hit early-game boss. Idle menace with toxic slime buildup, short rushes, trash-slams that splash lingering slime, roaring intimidation, readable stun windows, and a humorous defeat/recovery gag.
**Sprite reference:** `reference/characters/level-01/sprites/boss-trash-dash.png`

## Level 2: Suburban After Dark

**Concept:** `reference/characters/level-02/concepts/common-enemies.png`  
**Supplementary approved design source:** `reference/characters/level-02/concepts/approved-direction-a-supplement.png`

### Squirel - Ranged acorn tosser
Hops between low suburban features and performs a clear acorn wind-up, release, follow-through, and recovery. The nut is a separate animated projectile with spin/travel/impact/break states.  
**Sprite reference:** `reference/characters/level-02/sprites/squirel.png`

### Dog - Reactive chaser
Alert/bark telegraph, committed charge, scenery crash/stun, recovery.  
**Sprite reference:** `reference/characters/level-02/sprites/dog.png`

### Skunk - Area-control enemy
Patrol, raised-tail warning, stink spray, hit/recovery, readable gas effects.  
**Sprite reference:** `reference/characters/level-02/sprites/skunk.png`

### Moth / Dustwing - Fluttering aerial menace
Hover/flutter, slow flight, fast dash, attack, hit/recovery, lantern/effect language.  
**Sprite reference:** `reference/characters/level-02/sprites/moth-dustwing.png`

### Bee - Venom dash flyer
Hover/flight/dash, stinger attack, venom effects, post-dash vulnerability.  
**Sprite reference:** `reference/characters/level-02/sprites/bee.png`

**Boss concept:** `reference/characters/level-02/concepts/boss.png`

### Boss: Brutus the Bin-Hound
Three-hit suburban boss. Warning bark telegraph, committed charge, collision/stun opening, trash toss, wet-yard hazard interactions, and a faster enraged phase. Collar / neck remains the readable weak point after stun windows.
**Sprite reference:** `reference/characters/level-02/sprites/boss-brutus-bin-hound.png`

## Level 3: Downtown Mayhem

**Common-enemy concept:** `reference/characters/level-03/concepts/common-enemies.png`  
**Boss concept:** `reference/characters/level-03/concepts/boss.png`

### Alley Cat Burglar - Platform ambusher
Paces fire escapes with a fish skeleton, tail-wiggle anticipation, leap/pounce, overshoot into a cardboard box, hit/recovery.  
**Sprite reference:** `reference/characters/level-03/sprites/alley-cat-burglar.png`

### Traffic-Cone Crab - Interactive patroller
Scuttle patrol, retreat into cone, stomp-launchable cone projectile/obstacle, exposed crab movement, hit/recovery.  
**Sprite reference:** `reference/characters/level-03/sprites/traffic-cone-crab.png`

### Sewer Rat Courier - Punishing chaser
Pizza-box carrier, glance-back idle, walk/sneak, sprint/chase, charge/shoulder check, pizza-slice drop and grease hazard.  
**Sprite reference:** `reference/characters/level-03/sprites/sewer-rat-courier.png`

### Subway Roach - Stop-and-go sprinter
Newspaper concealment, reveal, scuttle, telegraphed dash, skid/stop, hit/recovery.  
**Sprite reference:** `reference/characters/level-03/sprites/subway-roach.png`

### Boss: His Greasiness, the Pizza Rat King
Three-hit boss. Pan charge, crash/stun opening, bouncing pizza-slice throw, faster enraged charges, and defeat reveal as three ordinary rats.  
**Sprite reference:** `reference/characters/level-03/sprites/boss-pizza-rat-king.png`

## Level 4: Secret Space Center

**Common-enemy concept:** `reference/characters/level-04/concepts/common-enemies.png`  
**Boss concept:** `reference/characters/level-04/concepts/boss.png`

### Clipboard Hamster - Environmental operator
Transparent wheel movement, slow/fast roll, machinery power state, warning state, stomp/ejection, exposed hamster flee/hit/recovery.  
**Sprite reference:** `reference/characters/level-04/sprites/clipboard-hamster.png`

### Mop-Bot 3000 - Mobile hazard
Patrol roll, faster pursuit, suction warning, strong suction, reverse/pivot, intake pull, short-circuit hit, recovery.  
**Sprite reference:** `reference/characters/level-04/sprites/mop-bot-3000.png`

### Beaker Slime - Bouncing transformer
Blue low/quick bounce, Yellow high/slow bounce, Red long horizontal leap, anticipation, landing, chemical color change, hit/splash/recovery.  
**Sprite reference:** `reference/characters/level-04/sprites/beaker-slime.png`

### Phase Gecko - Ambush enemy
Wall cling, crawl, camouflage with eyes visible, flicker/reveal, straight tongue strike, tongue-stuck vulnerability, hit/recovery.  
**Sprite reference:** `reference/characters/level-04/sprites/phase-gecko.png`

### Boss: Project O.P.O.S.S.U.M.
Three-hit prototype boss. Charge-test startup, fast charge, barrier crash/stun, phase-shift fake charge, suction pulse, enraged alternating charges, harness-break defeat, normal-possum final reveal.  
**Sprite reference:** `reference/characters/level-04/sprites/boss-project-opossum.png`

## Level 5: Raccoon in Space

**Common-enemy concept:** `reference/characters/level-05/concepts/common-enemies.png`  
**Boss concept:** `reference/characters/level-05/concepts/boss.png`

### Satellite Hermit Crab - Shielded patroller
Dish-shell patrol, three-light signal telegraph, defensive crouch, shell lift/transmit vulnerability, quick scuttle, hit/recovery.  
**Sprite reference:** `reference/characters/level-05/sprites/satellite-hermit-crab.png`

### Asteroid Armadillo - Low-gravity roller
Walk/shuffle, curl anticipation, asteroid-ball state, low-gravity roll, airborne arc, ricochet, stomp redirect, uncurl vulnerability, hit/stun/recovery.  
**Sprite reference:** `reference/characters/level-05/sprites/asteroid-armadillo.png`

### Vacuum Jelly - Position-control flyer
Idle float, hover drift, double-pulse warning, contraction/suction, strong pull, trash swirl, vulnerable pop/release, reinflate/recovery.  
**Sprite reference:** `reference/characters/level-05/sprites/vacuum-jelly.png`

### Rocket Roach - Burst-movement enemy
Idle drift, slow patrol, two sputter warnings, ignition, rocket burst/dash, sustained straight-line blast, tumble after rocket failure, vulnerability, hit/recovery.  
**Sprite reference:** `reference/characters/level-05/sprites/rocket-roach.png`

### Boss: Galactogobbler, Hoarder of Worlds
Three-hit final boss for the main five-level arc. Suction inhale, exposed-mouth cough, Asteroid Armadillo projectile interaction, Rocket Roach burst interactions, gravity reversal, shell-break defeat, shrunken apologetic reveal, glowing-trash offering.  
**Sprite reference:** `reference/characters/level-05/sprites/boss-galactogobbler.png`

## Secret Level 6: The Abandoned Ballpark

**Common-enemy concept:** `reference/characters/level-06/concepts/common-enemies.png`  
**Boss concept:** `reference/characters/level-06/concepts/boss.png`

### Baserunning Beaver - Speedy slider
Mutant beaver with a baseball motif. Walk/run movement, crouched anticipation, stomach-first sliding attack, dirt/skid impact, quick turn, hit/stun/recovery.  
**Sprite reference:** `reference/characters/level-06/sprites/baserunning-beaver.png`

### Sliding Seagull - Dive-bomber
Flying enemy wearing a baseball helmet. Idle hover, patrol flight, flap loop, banking turn, target-lock warning, dive anticipation, diving attack, ground skim/slide, pull-up recovery, hit/stun/defeat.  
**Sprite reference:** `reference/characters/level-06/sprites/sliding-seagull.png`

### Windup Weasel - Pitch thrower
Ranged baseball enemy. Patrol/scamper, aim/target, full pitching windup, throw release/follow-through, quick next-ball setup, hit/stun/recovery. Baseballs are separate projectile/effect art with held, spinning, fastball, bounce/ricochet, impact/crack, and debris states.  
**Sprite reference:** `reference/characters/level-06/sprites/windup-weasel.png`

### Clobbering Cub - Heavy hitter
Bear cub with a battered baseball bat. Patrol/run, ready stance, backswing anticipation, side-swing attack, overhead variation, missed-swing recoil, bat-drag recovery, hit/stun/defeat.  
**Sprite reference:** `reference/characters/level-06/sprites/clobbering-cub.png`

### Boss: The Diamond Don - Ruler of the Rotted Diamond
An evil raccoon in a battered baseball jersey with theatrical old-school Chicago-gangster swagger. The approved concept establishes heavy slugger/bat attacks, dirty baseball pitches, a slide rush, command/taunt behavior, damage progression, hit/vulnerable windows, and a softened post-defeat state. Exact phase sequencing is not yet locked and should not be invented without a gameplay-design pass.  
**Sprite reference:** `reference/characters/level-06/sprites/boss-diamond-don.png`

## Shared animation/implementation rules

- Standard enemies normally take one stomp or powered attack unless their defining mechanic explicitly says otherwise.
- Every attack needs a readable visual/audio/lighting tell before its committed active window.
- Animation damage timing must align with the visible contact/release frame.
- Character silhouette and physical scale must remain stable between states.
- Grounding/hover anchors, hitboxes, hurtboxes, projectile release points, and collision boxes must be defined separately from transparent image bounds.
- Sprite-reference sheets should be audited for usable frames and extracted to clean runtime atlases. Do not display sheet labels, backgrounds, gutters, or presentation graphics in-game.
