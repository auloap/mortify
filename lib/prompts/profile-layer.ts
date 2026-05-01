export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const TYPE_PROSE: Record<EnneagramType, string> = {
  1: `The user carries a deep inner standard they hold themselves and the world to. They are prone to self-criticism when they fall short, and their besetting struggle is resentment — the slow burn when things (or people, including themselves) are not as they should be. Under stress they become anxious and self-doubting. Their growth edge is learning to receive grace rather than only striving to deserve it — to rest in being loved before being improved.`,
  2: `The user finds their worth in being needed, and tends to give generously while quietly keeping score. Their besetting struggle is pride — the subtle belief that they know what others need and that love must be earned through service. Under stress they become possessive and manipulative. Their growth edge is learning to receive without needing to repay, and to acknowledge their own needs before God.`,
  3: `The user is wired for performance and has learned to present a polished version of themselves to the world. Their besetting struggle is deceit — not necessarily lying, but the deep habit of shaping their image rather than revealing their soul. Under stress they become disengaged and numb. Their growth edge is learning that they are loved for who they are, not what they produce — that rest is not laziness but an act of trust.`,
  4: `The user has a deep longing to be fully known and significant, and is prone to comparing their inner experience unfavourably against others. Their besetting struggle is envy — the ache for what's missing rather than gratitude for what's present. Under stress they become clingy and lose themselves in others' needs. Their growth edge is learning to receive their identity as given by God rather than constructed through feeling and self-expression.`,
  5: `The user protects themselves through withdrawal and accumulation of knowledge, and tends to ration their emotional and relational energy carefully. Their besetting struggle is avarice — hoarding inner resources out of a deep fear of being depleted. Under stress they become scattered and impulsive. Their growth edge is learning that engagement with life and others will not drain them dry — that they are sustained by God, not just by solitude.`,
  6: `The user operates from a chronic undercurrent of anxiety and doubt, scanning for what might go wrong and seeking solid ground through systems, relationships, or beliefs. Their besetting struggle is fear — not just of danger, but of their own judgment and inner authority. Under stress they become aggressive or paranoid. Their growth edge is learning to trust that they are held — that courage is not the absence of fear but movement despite it.`,
  7: `The user moves fast and keeps their options open, habitually reframing pain into possibility to avoid sitting with what hurts. Their besetting struggle is gluttony — not just of pleasure, but of experience, ideas, and escape routes. Under stress they become perfectionist and critical. Their growth edge is learning that the present moment — including its pain — is where God meets them, and that depth is only found by staying.`,
  8: `The user leads with intensity and has learned early that vulnerability is dangerous. They are prone to excess and to steamrolling others when their sense of justice or control is threatened. Their besetting struggle is lust — not primarily sexual, but a craving for intensity, control, and impact. Under stress they withdraw and shut down. Their growth edge is learning that true strength is found in surrender, and that allowing themselves to be known is not weakness but intimacy.`,
  9: `The user tends to merge with others' needs and agendas, and has a deep habit of numbing their own desires and voice to avoid conflict. Their besetting struggle is sloth — not laziness, but a spiritual inertia, a forgetting of themselves. Under stress they become anxious and worried. Their growth edge is learning to show up — to know what they want, what they believe, and to offer it to God and others without disappearing.`,
};

// Short addendum per type+wing pair describing how the wing flavours this person
const WING_ADDENDA: Partial<Record<EnneagramType, Partial<Record<number, string>>>> = {
  1: {
    9: "Their 9-wing adds a quieter, more withdrawn quality — they tend to internalize their standards and struggle in silence rather than voice their frustration.",
    2: "Their 2-wing adds warmth and relational investment — their inner critic often expresses itself as a desire to help others meet their potential.",
  },
  2: {
    1: "Their 1-wing adds a principled, sometimes moralistic edge — they give with a strong sense of duty, and guilt is never far behind when they feel they've fallen short.",
    3: "Their 3-wing adds ambition and image-awareness — they are more likely to give in ways that are visible and to derive identity from being seen as generous.",
  },
  3: {
    2: "Their 2-wing adds interpersonal warmth — they achieve partly to be loved, and they genuinely care about the people they're performing for.",
    4: "Their 4-wing adds depth and a pull toward authenticity — they feel the tension between image and soul more acutely, and can be harder on themselves for it.",
  },
  4: {
    3: "Their 3-wing adds a drive for recognition and external expression — they want to be known, but also to be admired, and this can pull them toward performance.",
    5: "Their 5-wing adds withdrawal and intellectualism — they process their longing inwardly, and can become reclusive and cerebral when the ache is strong.",
  },
  5: {
    4: "Their 4-wing adds emotional depth and a longing to be understood — they are more in touch with their inner world, and more likely to feel the pain of isolation.",
    6: "Their 6-wing adds loyalty and anxiety — they are more relational than a typical 5, but also more prone to scanning for threats and second-guessing their conclusions.",
  },
  6: {
    5: "Their 5-wing adds intellectual withdrawal — when anxious, they retreat into analysis and can become isolated behind layers of thinking.",
    7: "Their 7-wing adds a more optimistic, scattered quality — they cope with anxiety through activity and reframing, and can appear more confident than they feel.",
  },
  7: {
    6: "Their 6-wing adds loyalty and a tendency toward anxiety beneath the buoyancy — they care deeply about their people and feel the weight of what they're running from more than they show.",
    8: "Their 8-wing adds intensity and assertiveness — they pursue experience with force and can become combative when their freedom or joy is threatened.",
  },
  8: {
    7: "Their 7-wing adds restlessness and a love of adventure — they pursue intensity through variety and ideas as well as power, and can be charismatic and visionary.",
    9: "Their 9-wing adds a more measured, steady quality — they lead with patience and can be deeply loyal, but the withdrawal under stress can be more complete and silent.",
  },
  9: {
    8: "Their 8-wing adds more force and directness — they are more likely to assert themselves when roused, but the return to peace is still the default.",
    1: "Their 1-wing adds a principled, idealistic quality — they care about doing things right, and their self-forgetting can take the form of quietly absorbing others' expectations.",
  },
};

// Spoken pastorally — describes the stress disintegration pattern without naming it
const STRESS_NOTES: Record<EnneagramType, string> = {
  1: "When they are carrying more than usual, they tend to lose confidence in themselves and spiral into self-doubt and anxious introspection. Speak to the one who is weary of their own inner critic.",
  2: "When they are carrying more than usual, their giving can curdle into control — they become more demanding and less able to let others simply be. Speak to the one who is exhausted by their own generosity.",
  3: "When they are carrying more than usual, they tend to go numb and disengage — the performance stops, and they don't know who they are underneath it. Speak to the one who has lost themselves in the doing.",
  4: "When they are carrying more than usual, they tend to lose their sense of self in others — becoming clingy and dependent in ways that surprise even them. Speak to the one who is grasping for solid ground.",
  5: "When they are carrying more than usual, they become scattered and impulsive — the careful ration of energy breaks down and they act without thinking. Speak to the one who feels suddenly unmoored.",
  6: "When they are carrying more than usual, they become aggressive and reactive — the anxiety that usually shows as caution breaks through as attack. Speak to the one who is fighting because they are afraid.",
  7: "When they are carrying more than usual, they become critical and rigid — the optimism collapses into fault-finding and a desperate need for control. Speak to the one who can no longer outrun what hurts.",
  8: "When they are carrying more than usual, they shut down and withdraw — the intensity goes inward and they become unreachable. Speak to the one who is protecting a wound they haven't named yet.",
  9: "When they are carrying more than usual, they become anxious and restless — the numbness gives way to worry that they can't quiet or set down. Speak to the one who has forgotten where they put themselves.",
};

export function getProfilePrompt(type: EnneagramType, wing: number | null): string {
  const base = TYPE_PROSE[type];
  const wingNote = wing !== null ? (WING_ADDENDA[type]?.[wing] ?? "") : "";
  return [base, wingNote].filter(Boolean).join(" ");
}

export function getStressNote(type: EnneagramType): string {
  return STRESS_NOTES[type];
}
