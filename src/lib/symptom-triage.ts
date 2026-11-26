import type { Doctor, Service } from "@/types/hospital";

export interface TriageMatchResult {
  service: Service;
  suggestedDoctor?: Doctor;
  confidence: "high" | "medium";
  matchedKeywords: string[];
  isEmergency: boolean;
}

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  cardiology: [
    "heart",
    "chest",
    "bp",
    "blood pressure",
    "hypertension",
    "palpitation",
    "palpitations",
    "heartbeat",
    "pulse",
    "cholesterol",
    "cardiac",
    "angina",
    "ecg",
    "echo",
    "breathless",
    "shortness of breath",
    "cardio"
  ],
  orthopedics: [
    "knee",
    "joint",
    "bone",
    "back",
    "spine",
    "neck",
    "shoulder",
    "fracture",
    "sprain",
    "arthritis",
    "ligament",
    "acl",
    "meniscus",
    "sciatica",
    "ankle",
    "hip",
    "wrist",
    "elbow",
    "muscle",
    "orthopedic",
    "stiff",
    "walking"
  ],
  pediatrics: [
    "child",
    "baby",
    "infant",
    "kid",
    "kids",
    "toddler",
    "newborn",
    "son",
    "daughter",
    "vaccination",
    "vaccine",
    "immunisation",
    "immunization",
    "pediatric",
    "paediatric",
    "growth",
    "teething",
    "colic"
  ],
  neurology: [
    "migraine",
    "headache",
    "head",
    "brain",
    "nerve",
    "numb",
    "numbness",
    "tingling",
    "seizure",
    "epilepsy",
    "fit",
    "vertigo",
    "dizzy",
    "dizziness",
    "stroke",
    "tremor",
    "memory",
    "paralysis",
    "neuro"
  ],
  dermatology: [
    "skin",
    "rash",
    "acne",
    "pimple",
    "pimples",
    "eczema",
    "psoriasis",
    "itch",
    "itching",
    "allergy",
    "hives",
    "hair",
    "hair fall",
    "hairfall",
    "dandruff",
    "scalp",
    "fungal",
    "nail",
    "pigmentation",
    "mole",
    "dermatology"
  ],
  "general-medicine": [
    "fever",
    "cold",
    "cough",
    "flu",
    "viral",
    "diabetes",
    "sugar",
    "thyroid",
    "fatigue",
    "weakness",
    "tired",
    "stomach",
    "acidity",
    "gas",
    "gastritis",
    "vomit",
    "vomiting",
    "diarrhea",
    "infection",
    "throat",
    "sore throat",
    "checkup",
    "vitamin",
    "general"
  ]
};

const EMERGENCY_TERMS = [
  "severe chest pain",
  "heart attack",
  "cannot breathe",
  "can't breathe",
  "unconscious",
  "fainted",
  "stroke",
  "facial droop",
  "slurred speech",
  "heavy bleeding"
];

export function matchSymptomToDepartment(
  query: string,
  services: Service[],
  doctors: Doctor[]
): TriageMatchResult | null {
  if (services.length === 0) return null;
  const text = query.trim().toLowerCase();

  const isEmergency = EMERGENCY_TERMS.some((term) => text.includes(term));

  let bestService: Service =
    services.find((s) => s.slug === "general-medicine") || services[0];
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const svc of services) {
    let score = 0;
    const matched: string[] = [];

    const keywords = DEPARTMENT_KEYWORDS[svc.slug] || [];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += kw.includes(" ") ? 3 : 2;
        matched.push(kw);
      }
    }

    // Dynamic fallback matching against service title/category/shortDescription
    const dynamicTokens = `${svc.name} ${svc.category} ${svc.shortDescription}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4);
    for (const token of dynamicTokens) {
      if (text.includes(token) && !matched.includes(token)) {
        score += 1;
        matched.push(token);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestService = svc;
      bestMatches = matched;
    }
  }

  const suggestedDoctor = doctors.find(
    (d) => d.isActive && d.isVisible && d.serviceIds.includes(bestService.id)
  );

  return {
    service: bestService,
    suggestedDoctor,
    confidence: bestScore >= 2 ? "high" : "medium",
    matchedKeywords: bestMatches.slice(0, 4),
    isEmergency
  };
}
