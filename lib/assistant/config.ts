/**
 *   PANDA ASSISTANT SETTINGS: edit freely.
 *
 *  The assistant ALREADY knows everything in `lib/content.ts`
 *  (name, about, services, CRM, accounting, skills, case studies,
 *  tools, contact). Update that file and the panda learns it too.
 *
 *  • Lines marked  ✏️  are for extra information that is NOT on the
 *    site yet. Only add things that are true: the panda repeats
 *    them to visitors word for word.
 *  • Experience and achievements come from `lib/content.ts`
 *    (`experience`, `achievements`): they are empty right now, so
 *    the panda will say that work history isn't listed yet.
 */

export const assistantConfig = {
  /** Shown in the chat header. */
  name: "Rao Ali's Panda",
  /** First message in a new chat. */
  greeting:
    "Hi, I'm Rao Ali's panda assistant. Ask me about his skills, case studies and services, or how to get in touch. I can also take you to any section of the page.",

  /** Question chips shown to first-time visitors (keep them short). */
  suggestions: [
    "Who is Rao Ali?",
    "What services does he offer?",
    "Show me his projects",
    "What are his skills?",
    "How can I contact him?",
  ],

  /**
   * ✏️ Extra TRUE facts the panda may share, e.g.
   *   "Rao Ali speaks English and Urdu.",
   *   "He holds a B.Com from <university> (2022).",
   *   "He has 2 years of experience at <company> as an Accounts Executive.",
   */
  extraFacts: [] as string[],
};
