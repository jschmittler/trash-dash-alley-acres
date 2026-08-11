# Trash Dash Foreground Gameplay Asset Guide

These sheets define modular props intended to make each level feel inhabited while also supporting gameplay. Assets should sit on the gameplay plane with clear contact points and may be standable, climbable, pushable, breakable, interactive, obstructive, or decorative depending on the item.

## Shared rules

- Preserve aspect ratio. Never squash or stretch props to fit a target box.
- Create collision geometry independently from transparent sprite bounds.
- Standable assets need an intentional, readable top/contact surface.
- Breakable and interactive props need distinct state art before implementation when gameplay requires it.
- Do not place props inside platform silhouettes or allow accidental z-order overlap.
- Decorative clutter may sit adjacent to gameplay props, but must not create invisible collision.
- Use repeated assets with scale/rotation restraint so repetition does not become obvious.

## Level 1 - Woodland & Urban Edge
`reference/foreground-assets/level-01/foreground-gameplay-assets.png`

Mossy stump, fallen log, fern clump, mushroom cluster, flat stone platform, wooden crate, rusty metal can, tire pile, wooden barricade, broken signpost, camp junk pile, broken concrete block.

## Level 2 - Suburban Backyard & Neighborhood
`reference/foreground-assets/level-02/foreground-gameplay-assets.png`

Trash bin, recycling bin, garbage bag, hedge clump, mailbox, lawn chair, wood fence, chain-link fence, kiddie pool, sprinkler, doghouse, box stack, cooler, toy car, beach ball, stepping stones.

## Level 3 - Downtown Nights
`reference/foreground-assets/level-03/foreground-gameplay-assets.png`

Dumpster, trash-bag pile, construction barricade, traffic cones, pizza boxes, milk crates, city newspaper box, bench fragment, manhole cover, sewer grate, cable spool, road sign.

## Level 4 - Secret Space Center
`reference/foreground-assets/level-04/foreground-gameplay-assets.png`

Hazard storage crate, rolling tool cart, sample canister, cable bundle, lab bin, utility barrel, floor terminal, maintenance trolley, containment pod, vent box, warning barrier, energy cell.

## Level 5 - Orbital Junkyard
`reference/foreground-assets/level-05/foreground-gameplay-assets.png`

Space cargo pod, satellite debris pile, cosmic crystal cluster, low-gravity scrap barrel, meteor chunk, alien trash mound, maintenance crate, oxygen canister, floating junk anchor, broken bot husk, cargo pallet, salvage signpost.

## Secret Level 6 - Abandoned Ballpark
`reference/foreground-assets/level-06/foreground-gameplay-assets.png`

Cracked brick wall, broken seat cluster, baseball gear crate, dugout bench, garbage can, concessions junk, tarp drape, ice cooler, peanut boxes, scoreboard debris, bat rack, home plate.
