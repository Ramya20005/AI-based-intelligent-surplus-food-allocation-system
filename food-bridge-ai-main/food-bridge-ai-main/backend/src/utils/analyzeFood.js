const FOOD_RULES = {
  veg: {
    suitableFor: ["Children", "Adults", "Elders"],
    beneficiaryTags: ["children", "adults", "elders"],
    notRecommended: ["Long-distance transport"],
  },
  dairy: {
    suitableFor: ["Adults", "Elders"],
    beneficiaryTags: ["adults", "elders"],
    notRecommended: ["Children under 5", "Outdoor distribution", "Long-distance transport"],
  },
  nonveg: {
    suitableFor: [],
    beneficiaryTags: [],
    notRecommended: ["Children", "Adults", "Elders", "Any redistribution - safety concern"],
  },
  bakery: {
    suitableFor: ["Children", "Adults", "Elders"],
    beneficiaryTags: ["children", "adults", "elders"],
    notRecommended: [],
  },
  fruits: {
    suitableFor: ["Children", "Adults", "Elders"],
    beneficiaryTags: ["children", "adults", "elders"],
    notRecommended: [],
  },
};

export const analyzeFood = ({ category, freshnessHours }) => {
  const freshness = Number(freshnessHours);

  if (!Number.isFinite(freshness) || freshness <= 0) {
    return {
      status: "unsafe",
      riskScore: 100,
      safePercentage: 0,
      safeTimeHours: 0,
      suitableFor: [],
      beneficiaryTags: [],
      notRecommended: ["Invalid freshness duration"],
      explanation: "Freshness value is invalid. Food cannot be considered safe for redistribution.",
      unsafeReasons: [
        "Invalid freshness value was provided.",
        "Food safety cannot be verified without valid freshness information.",
      ],
    };
  }

  if (category === "veg" && freshness > 2) {
    return {
      status: "safe",
      riskScore: 15,
      safePercentage: 85,
      safeTimeHours: Math.max(0.5, freshness - 0.5),
      ...FOOD_RULES.veg,
      explanation:
        "Vegetarian food with sufficient freshness duration. Safe for immediate redistribution to nearby centers.",
      unsafeReasons: [],
    };
  }

  if (category === "dairy") {
    return {
      status: "moderate",
      riskScore: 55,
      safePercentage: 45,
      safeTimeHours: Math.min(freshness, 1.5),
      ...FOOD_RULES.dairy,
      explanation:
        "Dairy products require careful temperature control. Moderate risk due to spoilage potential. Prioritize nearby distribution.",
      unsafeReasons: [
        "Dairy spoils quickly when cold-chain is uncertain.",
        "Consumption should happen quickly after pickup.",
      ],
    };
  }

  if (category === "nonveg") {
    return {
      status: "unsafe",
      riskScore: 82,
      safePercentage: 18,
      safeTimeHours: 0,
      ...FOOD_RULES.nonveg,
      explanation:
        "Non-vegetarian food with this duration has high contamination and spoilage risk. It should not be redistributed.",
      unsafeReasons: [
        "High microbial growth risk due to elapsed prep/freshness window.",
        "Cannot guarantee temperature-safe handling history.",
        "Unsafe for children, elders, and adults in community redistribution.",
      ],
    };
  }

  return {
    status: "safe",
    riskScore: 20,
    safePercentage: 80,
    safeTimeHours: freshness,
    ...(FOOD_RULES[category] || FOOD_RULES.bakery),
    explanation:
      "Food item assessed as safe for redistribution based on category and freshness parameters.",
    unsafeReasons: [],
  };
};
