// Maxwell's actual background and a few real examples of his outreach voice.
// These are injected into the Chat prompt as few-shot examples so the output
// sounds like him — down to earth, specific, no AI filler — instead of generic.

export const PROFILE = `
Name: Maxwell Peng
Who I am: CS student at Western University (Canada). I compete for Team Canada in
badminton, which taught me to show up consistently and perform under pressure.
What I do: I build and ship real products, mostly at the intersection of AI and
consumer/SaaS. I've worked exclusively at startups.
Links: maxwellpeng.com | github.com/thecodemonki | linkedin.com/in/maxwell-peng-070116246
Stack: React, TypeScript, Next.js, Node.js, Python.
`.trim();

// Voice rules distilled from how Maxwell actually writes (and what he avoids).
export const VOICE_RULES = `
- Down to earth and conversational. Sounds like a real person, not a cover letter.
- Lead with genuine interest in what THEY are building, fast. Get to the point.
- Be specific about real, live work. Name the project and what it does in one line.
- Confident but not arrogant. Short sentences. No corporate filler.
- NEVER use these phrases: "genuinely", "I'm excited about the idea that", "passionate",
  "thrilled", "I am writing to", "I would be a great fit", "synergy", "leverage", "delve".
- No em-dashes-as-drama, no overlong windups. One clear ask at the end.
- Mention the badminton / Team Canada angle only when it adds something, not by reflex.
`.trim();

// Real examples of Maxwell's outreach, used as few-shot anchors.
export const FEW_SHOT_EXAMPLES = [
  {
    channel: "linkedin",
    company: "Early-stage AI startup (Airtap) hiring an intern, posted by the founder Spencer.",
    project: "AI products / shipping real things",
    message: `Hey Spencer, saw your post about the Airtap internship and I want in!

I'm Maxwell, a CS student at Western University in Canada. I've built AI into real products, an onboarding flow at Autumn.co connecting people to grief counselors, and Dice AI, a contract analysis tool for creators. I also built InterviewRoyale, a multiplayer interview prep game that's live. Stack is React, TypeScript, Next.js, Node.js.

I'm curious about AI products and I want the hands-on experience of shipping things real users actually run. That's exactly what this sounds like.

maxwellpeng.com | github.com/thecodemonki | linkedin.com/in/maxwell-peng-070116246`,
  },
  {
    channel: "email",
    company: "Frontend Web Developer Intern role at a startup that cares about live, hands-on work.",
    project: "Dice AI + InterviewRoyale (live links)",
    message: `Subject: Frontend intern — live projects inside

Hi Sanchitha, I came across the Frontend Web Developer Intern role and wanted to reach out.

I have real hands-on experience with the stack you're looking for. I worked at Atlashaus where I built product pages and FAQs on Shopify, and I've shipped full-stack projects in React, TypeScript, Next.js, and Node.js.

I'm a CS student at Western in Canada, I compete for Team Canada in badminton, and I like building things that actually ship. A few live links:

- creatordice.com — financial dashboard for creators
- interviewroyale.com — multiplayer interview prep game

Would love to chat if you're open to it.

Maxwell Peng`,
  },
];
