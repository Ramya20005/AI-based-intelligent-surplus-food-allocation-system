export type UserRole = "donor" | "ngo" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  ngoName?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AnalysisResult {
  status: "safe" | "moderate" | "unsafe";
  riskScore: number;
  safePercentage?: number;
  safeTimeHours: number;
  suitableFor: string[];
  notRecommended: string[];
  beneficiaryTags?: string[];
  unsafeReasons?: string[];
  confidence?: number;
  urgency?: "low" | "medium" | "high";
  explanation: string;
}

export interface AnalysisMeta {
  provider: string;
  model: string;
  usedImage?: boolean;
  fallbackReason?: string;
}

export interface DonorDonation {
  id: number;
  name: string;
  category: string;
  quantity: number;
  imageUrl?: string;
  status: "safe" | "moderate" | "unsafe";
  riskScore: number;
  location?: string;
  freshnessHours?: number;
  prepTime?: string;
  createdAt?: string;
  safeTimeHours?: number;
  lockedAt?: string;
  lockedBy?: string;
}

export interface NgoDonation {
  id: number;
  name: string;
  category: string;
  quantity: number;
  imageUrl?: string;
  status: "safe" | "moderate";
  riskScore: number;
  location: string;
  createdAt: string;
  donorName: string;
  lockedBy?: string;
  safeTimeHours: number;
  remainingSeconds: number;
  distanceKm?: number;
}

export interface AdminDonation {
  id: number;
  name: string;
  category: string;
  quantity: number;
  imageUrl?: string;
  status: "safe" | "moderate" | "unsafe";
  riskScore: number;
  createdAt: string;
  donorName: string;
  lockedBy?: string;
  lockTime?: string;
}

export interface AdminStats {
  total: number;
  safe: number;
  moderate: number;
  unsafe: number;
  locked: number;
}

export interface AdminApplication {
  id: number;
  donationId: number;
  foodName: string;
  imageUrl?: string;
  applicantName: string;
  ngoName: string;
  contactPersonName: string;
  contactNumber: string;
  email: string;
  collectorName: string;
  collectorPhone: string;
  trustName?: string;
  ngoAddress?: string;
  appliedAt: string;
  ngoUserName: string;
}

export interface NgoApplyPayload {
  collectorName: string;
  collectorPhone: string;
}

export interface NgoProfile {
  ngoUserId: number;
  organizationName: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  contactEmail: string;
  contactPhone: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  isActive: boolean;
}

export interface NgoProfilePayload {
  organizationName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  serviceRadiusKm: number;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
}

const resolveDefaultApiBase = () => {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }

  return "http://127.0.0.1:4000/api";
};

const API_BASE = (import.meta.env.VITE_API_URL || resolveDefaultApiBase()).replace(/\/$/, "");
const TOKEN_KEY = "foodbridge_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers || {});
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (_networkError) {
    throw new Error(`Cannot connect to backend (${API_BASE}). Start backend on port 4000 and try again.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message || "Request failed.";
    throw new Error(message);
  }

  return payload as T;
};

export const apiKeys = {
  token: TOKEN_KEY,
  user: "foodbridge_user",
};

export const registerUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  ngoName?: string;
}) =>
  request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload: { email: string; password: string; role?: UserRole }) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCurrentUser = () =>
  request<{ user: User }>("/auth/me", {
    method: "GET",
  });

export const createDonation = (payload: {
  category: string;
  foodName: string;
  quantity: number;
  prepTime: string;
  freshness: number;
  location: string;
  imageUrl?: string;
}) =>
  request<{ donation: DonorDonation; analysis: AnalysisResult; analysisMeta?: AnalysisMeta; message: string }>(
    "/donor/donations",
    {
    method: "POST",
    body: JSON.stringify(payload),
    },
  );

export const uploadDonationImage = (imageFile: File) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return request<{
    message: string;
    imageUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>("/donor/upload-image", {
    method: "POST",
    body: formData,
  });
};

export const getMyDonations = () => request<{ donations: DonorDonation[] }>("/donor/donations");

export const submitFeedback = (payload: { rating: number; comment?: string }) =>
  request<{ message: string }>("/donor/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getNgoProfile = () => request<{ profile: NgoProfile | null }>("/ngo/profile");

export const saveNgoProfile = (payload: NgoProfilePayload) =>
  request<{ message: string; profile: NgoProfile }>("/ngo/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const saveNgoPushSubscription = (subscription: PushSubscriptionJSON) =>
  request<{ message: string }>("/ngo/push-subscriptions", {
    method: "POST",
    body: JSON.stringify(subscription),
  });

export const getNgoDonations = () =>
  request<{ donations: NgoDonation[]; profileWarning?: string }>("/ngo/donations");

export const applyNgoDonation = (id: number, payload: NgoApplyPayload) =>
  request<{ message: string }>(`/ngo/donations/${id}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getAdminStats = () => request<{ stats: AdminStats }>("/admin/stats");

export const getAdminDonations = () => request<{ donations: AdminDonation[] }>("/admin/donations");

export const getAdminApplications = () => request<{ applications: AdminApplication[] }>("/admin/applications");
