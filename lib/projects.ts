// The project corpus. At request time each `embedText` is embedded with
// Cohere Embed v4 (input_type: search_document) and compared against the
// embedded company text (input_type: search_query). Highest cosine similarity
// wins, so the email mentions whichever project is actually most relevant to
// the company — fintech company -> Dice AI, consumer/social -> InterviewRoyale, etc.
//
// `embedText` is what gets matched (rich, keyword-dense, describes the *domain*).
// `pitchLine` is what the model is told to weave into the message (tight, human).

export type Project = {
  id: string;
  name: string;
  url: string;
  embedText: string;
  pitchLine: string;
};

export const PROJECTS: Project[] = [
  {
    id: "dice",
    name: "Dice AI",
    url: "https://creatordice.com",
    embedText:
      "Fintech and SaaS financial dashboard for content creators. Real-time profit and loss engine, revenue analytics, payments, OAuth integrations with Stripe, YouTube, and Patreon. Creator economy, monetization, financial data, dashboards, recurring revenue, subscriptions. Built and shipped solo, live in production.",
    pitchLine:
      "Dice AI (creatordice.com), a financial dashboard I built solo for creators with a real-time P&L engine and Stripe / YouTube / Patreon OAuth integrations",
  },
  {
    id: "interviewroyale",
    name: "InterviewRoyale",
    url: "https://interviewroyale.com",
    embedText:
      "Consumer multiplayer game. Real-time competitive interview prep where you log in and play against friends head to head. Gamification, social, real-time multiplayer, edtech, consumer product, live gameplay, matchmaking, engagement loops.",
    pitchLine:
      "InterviewRoyale (interviewroyale.com), a real-time multiplayer interview-prep game where you compete against friends",
  },
  {
    id: "racketsense",
    name: "RacketSense",
    url: "",
    embedText:
      "Computer vision and machine learning. Analyzes badminton gameplay from raw video: MediaPipe pose estimation tracks body landmarks, a velocity-based swing detector isolates shots, and a Random Forest classifier categorizes shot types from engineered biomechanical features. Rally sequencing with n-grams and Markov chains surfaces gameplay patterns. Python, scikit-learn, FastAPI, Next.js. Video analysis, sports tech, ML pipelines, model training, feature engineering, classification, applied AI.",
    pitchLine:
      "RacketSense, an ML project that analyzes badminton footage with pose estimation and a Random Forest classifier to detect and classify shots and surface gameplay patterns",
  },
  {
    id: "autumn",
    name: "Autumn.co",
    url: "",
    embedText:
      "Health tech and marketplace product. AI-powered onboarding flow connecting people to grief counselors and mental health advisors. Two-sided marketplace, provider matching, wellbeing, care navigation, sensitive onboarding, trust and safety.",
    pitchLine:
      "the provider–client onboarding flow I built at Autumn.co, a startup connecting people to grief counselors",
  },
];
