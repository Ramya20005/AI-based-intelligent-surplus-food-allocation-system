import { analyzeFood as analyzeFoodFallback } from "../utils/analyzeFood.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const STATUS_VALUES = new Set(["safe", "moderate", "unsafe"]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const asStringList = (value, limit = 6) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];

const parseJsonFromModel = (rawText) => {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response was not valid JSON.");
    return JSON.parse(match[0]);
  }
};

const getStatusFromRisk = (riskScore) => {
  if (riskScore >= 70) return "unsafe";
  if (riskScore >= 35) return "moderate";
  return "safe";
};

const normalizeBeneficiaryTag = (tag) => {
  const normalized = String(tag || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("child")) return "children";
  if (normalized.startsWith("adult")) return "adults";
  if (normalized.startsWith("elder") || normalized.startsWith("senior")) return "elders";
  return normalized;
};

const normalizeAnalysis = ({ result, fallback, freshnessHours }) => {
  const fallbackStatus = fallback.status;
  const fallbackRisk = fallback.riskScore;
  const fallbackSafeTime = fallback.safeTimeHours;

  const riskScore = clamp(Math.round(Number(result?.riskScore ?? fallbackRisk)), 0, 100);
  const status =
    typeof result?.status === "string" && STATUS_VALUES.has(result.status.toLowerCase())
      ? result.status.toLowerCase()
      : getStatusFromRisk(riskScore);

  const safeTimeHours = clamp(
    Number.isFinite(Number(result?.safeTimeHours))
      ? Number(result.safeTimeHours)
      : Number(fallbackSafeTime ?? freshnessHours),
    0,
    Math.max(12, Number(freshnessHours) + 2),
  );

  const suitableFor = asStringList(result?.suitableFor, 6);
  const notRecommended = asStringList(result?.notRecommended, 6);
  const beneficiaryTags = asStringList(result?.beneficiaryTags, 3).map((tag) => tag.toLowerCase());
  const normalizedTags = beneficiaryTags
    .map((tag) => normalizeBeneficiaryTag(tag))
    .filter((tag) => ["children", "adults", "elders"].includes(tag));
  const finalBeneficiaryTags =
    normalizedTags.length > 0
      ? Array.from(new Set(normalizedTags))
      : asStringList(fallback?.beneficiaryTags, 3).map((tag) => normalizeBeneficiaryTag(tag));

  const confidence = clamp(Number(result?.confidence ?? 0.65), 0, 1);
  const safePercentage = clamp(Math.round(Number(result?.safePercentage ?? 100 - riskScore)), 0, 100);
  const unsafeReasons = asStringList(result?.unsafeReasons, 6);
  const fallbackUnsafeReasons = asStringList(fallback?.unsafeReasons, 6);

  const explanation =
    typeof result?.explanation === "string" && result.explanation.trim()
      ? result.explanation.trim()
      : fallback.explanation;

  const urgency =
    typeof result?.urgency === "string" && ["low", "medium", "high"].includes(result.urgency.toLowerCase())
      ? result.urgency.toLowerCase()
      : safeTimeHours <= 1
        ? "high"
        : safeTimeHours <= 3
          ? "medium"
          : "low";

  return {
    status,
    riskScore,
    safePercentage,
    safeTimeHours,
    suitableFor: suitableFor.length > 0 ? suitableFor : fallback.suitableFor,
    notRecommended: notRecommended.length > 0 ? notRecommended : fallback.notRecommended,
    beneficiaryTags: finalBeneficiaryTags,
    confidence,
    urgency,
    explanation,
    unsafeReasons:
      status === "unsafe"
        ? unsafeReasons.length > 0
          ? unsafeReasons
          : fallbackUnsafeReasons
        : unsafeReasons,
  };
};

const buildPrompt = ({ category, foodName, quantity, prepTime, freshnessHours, location }) => `
You are an AI model for surplus food safety and allocation.
Analyze this donation using food safety principles.

Donation metadata:
- foodName: ${foodName}
- category: ${category}
- quantityServings: ${quantity}
- prepTime: ${prepTime || "unknown"}
- freshnessHours: ${freshnessHours}
- pickupLocation: ${location}

Return STRICT JSON only, no markdown:
{
  "status": "safe|moderate|unsafe",
  "riskScore": 0-100 integer,
  "safePercentage": 0-100 integer,
  "safeTimeHours": number,
  "suitableFor": ["children|adults|elders"],
  "notRecommended": ["..."],
  "beneficiaryTags": ["children|elders|adults"],
  "unsafeReasons": ["detailed reason 1", "detailed reason 2"],
  "confidence": 0-1,
  "urgency": "low|medium|high",
  "explanation": "clear factual reason. If unsafe, explain why in detail."
}

Rules:
- Higher risk for dairy/nonveg with low freshness.
- unsafe means do not redistribute.
- Include beneficiary suitability explicitly.
- If status is unsafe, give concrete health/safety reasons.
`.trim();

const getImagePart = async (imageUrl) => {
  if (!imageUrl) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error("imageUrl must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("imageUrl must use http or https.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(parsedUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Unable to fetch image (${response.status}).`);
    }

    const mimeType = (response.headers.get("content-type") || "").split(";")[0];
    if (!mimeType.startsWith("image/")) {
      throw new Error("imageUrl does not point to an image.");
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      throw new Error("Image size must be between 1 byte and 5MB.");
    }

    return {
      inline_data: {
        mime_type: mimeType,
        data: bytes.toString("base64"),
      },
    };
  } finally {
    clearTimeout(timeout);
  }
};

const callGemini = async ({ payload, fallback }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const imagePart = await getImagePart(payload.imageUrl);

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(payload) }, ...(imagePart ? [imagePart] : [])],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.9,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n").trim();

  if (!text) {
    throw new Error("Gemini API returned an empty response.");
  }

  const parsed = parseJsonFromModel(text);
  return {
    analysis: normalizeAnalysis({
      result: parsed,
      fallback,
      freshnessHours: payload.freshnessHours,
    }),
    meta: {
      provider: "gemini",
      model,
      usedImage: Boolean(imagePart),
    },
  };
};

export const analyzeDonationWithAI = async (payload) => {
  const fallback = analyzeFoodFallback({
    category: payload.category,
    freshnessHours: payload.freshnessHours,
  });

  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const strict = String(process.env.AI_STRICT || "false").toLowerCase() === "true";

  if (provider === "gemini") {
    try {
      return await callGemini({ payload, fallback });
    } catch (error) {
      if (strict) throw error;
      return {
        analysis: {
          ...fallback,
          beneficiaryTags: fallback.beneficiaryTags || [],
          safePercentage: clamp(100 - fallback.riskScore, 0, 100),
          confidence: 0.55,
          urgency: fallback.safeTimeHours <= 1 ? "high" : fallback.safeTimeHours <= 3 ? "medium" : "low",
          explanation: `${fallback.explanation} (Fallback used: AI service unavailable.)`,
          unsafeReasons: fallback.unsafeReasons || [],
        },
        meta: {
          provider: "rule-fallback",
          model: "heuristic-v1",
          fallbackReason: error instanceof Error ? error.message : "Unknown AI error",
        },
      };
    }
  }

  return {
    analysis: {
      ...fallback,
      beneficiaryTags: fallback.beneficiaryTags || [],
      safePercentage: clamp(100 - fallback.riskScore, 0, 100),
      confidence: 0.55,
      urgency: fallback.safeTimeHours <= 1 ? "high" : fallback.safeTimeHours <= 3 ? "medium" : "low",
      unsafeReasons: fallback.unsafeReasons || [],
    },
    meta: {
      provider: "rule-fallback",
      model: "heuristic-v1",
      fallbackReason: "AI_PROVIDER is not set to gemini.",
    },
  };
};
