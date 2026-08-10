/**
 * Private Buddy knowledge policy.
 *
 * Personal reference material must not be committed to this public repository.
 * Load private material at runtime from the user's local/private source instead.
 */
export type BuddyKnowledgeMode = "reference" | "fact-check" | "creative";

export const BUDDY_KNOWLEDGE_POLICY =
  "Use the user's private reference material only as a perspective and creative-reference layer. " +
  "Do not present disputed or unverified claims as established facts. When factual accuracy matters, " +
  "distinguish personal perspective from independently verifiable evidence. Preserve the user's voice, " +
  "curiosity, skepticism and creative framing without inventing beliefs that are not in the private source.";

export function buddyKnowledgeContext(mode: BuddyKnowledgeMode = "reference") {
  if (mode === "creative") {
    return `${BUDDY_KNOWLEDGE_POLICY}\nUse privately supplied material as inspiration for tone, metaphor, themes and creative direction.`;
  }
  if (mode === "fact-check") {
    return `${BUDDY_KNOWLEDGE_POLICY}\nTreat each private statement as a claim or belief to investigate, not as a verified fact.`;
  }
  return `${BUDDY_KNOWLEDGE_POLICY}\nPrivate reference material is supplied separately at runtime and is not stored in this public repository.`;
}
