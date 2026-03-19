import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  List,
  MessageSquare,
  User,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Star,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createDonation,
  getMyDonations,
  submitFeedback,
  uploadDonationImage,
  type AnalysisResult,
  type AnalysisMeta,
  type DonorDonation,
} from "@/lib/api";

type Tab = "add" | "donations" | "feedback" | "profile";
type SubmissionNotice = {
  donationId: number;
  submittedAt: string;
  providerLabel?: string;
};

const DonorDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donations, setDonations] = useState<DonorDonation[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [aiMeta, setAiMeta] = useState<AnalysisMeta | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<SubmissionNotice | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [category, setCategory] = useState("veg");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [freshness, setFreshness] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");

  const loadDonations = async () => {
    try {
      setLoadingDonations(true);
      const response = await getMyDonations();
      setDonations(response.donations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load donations.");
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    void loadDonations();
  }, []);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const upload = await uploadDonationImage(file);
      setImageUrl(upload.imageUrl);
      setSelectedImageName(file.name);
      toast.success("Image uploaded", { description: "Food image attached for AI analysis." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const analyzeFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setAiResult(null);
    setAiMeta(null);
    setSubmissionNotice(null);

    try {
      const response = await createDonation({
        category,
        foodName,
        quantity: Number(quantity),
        prepTime,
        freshness: Number(freshness),
        location,
        imageUrl: imageUrl.trim() || undefined,
      });

      setAiResult(response.analysis);
      setAiMeta(response.analysisMeta || null);
      setDonations((prev) => [response.donation, ...prev]);
      setCountdown(Math.floor(response.analysis.safeTimeHours * 3600));
      setSubmissionNotice({
        donationId: response.donation.id,
        submittedAt: new Date().toISOString(),
        providerLabel: response.analysisMeta
          ? `${response.analysisMeta.provider} (${response.analysisMeta.model})`
          : undefined,
      });
      toast.success(response.message, {
        description: response.analysisMeta
          ? `AI Provider: ${response.analysisMeta.provider} (${response.analysisMeta.model})`
          : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze and save donation.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmittingFeedback(true);
      await submitFeedback({ rating, comment });
      setFeedbackSubmitted(true);
      toast.success("Feedback submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: "add", icon: Plus, label: t("dash.addFood") },
    { key: "donations", icon: List, label: t("dash.myDonations") },
    { key: "feedback", icon: MessageSquare, label: t("dash.feedback") },
    { key: "profile", icon: User, label: t("dash.profile") },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-heading font-bold">
            {t("dash.welcome")}, {user?.name}!
          </h1>
          <p className="text-muted-foreground">{t("dash.overview")}</p>
        </motion.div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={analyzeFood} className="glass-card p-6 space-y-5">
                  <h2 className="font-heading font-semibold text-lg">{t("dash.addFood")}</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("food.category")}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="veg">{t("food.veg")}</option>
                      <option value="nonveg">{t("food.nonveg")}</option>
                      <option value="dairy">{t("food.dairy")}</option>
                      <option value="bakery">{t("food.bakery")}</option>
                      <option value="fruits">{t("food.fruits")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("food.name")}</label>
                    <input
                      required
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("food.quantity")}</label>
                      <input
                        required
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("food.freshness")}</label>
                      <input
                        required
                        type="number"
                        step="0.5"
                        value={freshness}
                        onChange={(e) => setFreshness(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("food.prepTime")}</label>
                    <input
                      required
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="e.g., 30 mins ago"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("food.location")}</label>
                    <input
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Food Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage || analyzing}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30 file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm"
                    />
                    {uploadingImage && <p className="text-xs text-muted-foreground">Uploading image...</p>}
                    {selectedImageName && imageUrl && (
                      <p className="text-xs text-muted-foreground break-all">
                        Uploaded: {selectedImageName}
                      </p>
                    )}
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="or paste image URL"
                    />
                    {imageUrl && (
                      <div className="w-full rounded-lg border border-border bg-muted/20 p-2">
                        <img
                          src={imageUrl}
                          alt="Food preview"
                          className="w-full max-h-80 object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={analyzing || uploadingImage}
                    className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {analyzing ? t("ai.analyzing") : t("food.submit")}
                  </button>
                </form>

                <div>
                  <AnimatePresence>
                    {submissionNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="glass-card p-5 mb-4 border border-primary/30 bg-primary/5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base">Successfully submitted</p>
                            <p className="text-sm text-muted-foreground">
                              Donation ID: <span className="font-medium text-foreground">#{submissionNotice.donationId}</span>
                              {" · "}
                              {new Date(submissionNotice.submittedAt).toLocaleString()}
                            </p>
                            {submissionNotice.providerLabel && (
                              <p className="text-xs text-muted-foreground mt-1">
                                AI Engine: {submissionNotice.providerLabel}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {aiResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-card p-6"
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            AI Prediction Report
                          </h2>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {t("ai.result")}
                          </span>
                        </div>

                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                            aiResult.status === "safe"
                              ? "status-safe"
                              : aiResult.status === "moderate"
                                ? "status-moderate"
                                : "status-unsafe"
                          }`}
                        >
                          {aiResult.status === "safe" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : aiResult.status === "moderate" ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {t(`ai.${aiResult.status}`)}
                        </div>

                        <div className="space-y-4">
                          {aiMeta && (
                            <div className="text-xs text-muted-foreground border-b border-border pb-2">
                              Provider: {aiMeta.provider} | Model: {aiMeta.model}
                            </div>
                          )}
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">{t("ai.riskScore")}</span>
                            <span className="font-bold text-lg">{aiResult.riskScore}%</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Safe percentage</span>
                            <span className="font-bold text-lg">
                              {typeof aiResult.safePercentage === "number"
                                ? `${aiResult.safePercentage}%`
                                : `${Math.max(0, 100 - aiResult.riskScore)}%`}
                            </span>
                          </div>
                          <div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${
                                  aiResult.riskScore < 35
                                    ? "bg-green-500"
                                    : aiResult.riskScore < 70
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${aiResult.riskScore}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Risk meter (lower is safer)</p>
                          </div>
                          {typeof aiResult.confidence === "number" && (
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground">Model confidence</span>
                              <span className="font-bold">{Math.round(aiResult.confidence * 100)}%</span>
                            </div>
                          )}
                          {aiResult.urgency && (
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground">Urgency</span>
                              <span className="font-bold uppercase">{aiResult.urgency}</span>
                            </div>
                          )}

                          {countdown !== null && countdown > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t("ai.safeTime")}
                              </span>
                              <span className="font-mono font-bold text-primary animate-pulse">
                                {formatTime(countdown)}
                              </span>
                            </div>
                          )}

                          {aiResult.beneficiaryTags && aiResult.beneficiaryTags.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Beneficiary Tags</p>
                              <div className="flex flex-wrap gap-2">
                                {aiResult.beneficiaryTags.map((tag, i) => (
                                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiResult.suitableFor.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">{t("ai.suitableFor")}</p>
                              <div className="flex flex-wrap gap-2">
                                {aiResult.suitableFor.map((s, i) => (
                                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiResult.notRecommended.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">{t("ai.notRecommended")}</p>
                              <div className="flex flex-wrap gap-2">
                                {aiResult.notRecommended.map((s, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-3 py-1 rounded-full bg-destructive/10 text-destructive"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiResult.status === "unsafe" && aiResult.unsafeReasons && aiResult.unsafeReasons.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Unsafe - Detailed Reasons</p>
                              <ul className="space-y-1">
                                {aiResult.unsafeReasons.map((reason, i) => (
                                  <li key={i} className="text-xs px-3 py-2 rounded-md bg-destructive/10 text-destructive">
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium mb-1">{t("ai.explanation")}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {aiResult.explanation}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "donations" && (
            <motion.div
              key="donations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium">Image</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">{t("food.name")}</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">{t("food.category")}</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">{t("food.quantity")}</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">{t("admin.status")}</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">{t("ai.riskScore")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDonations ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                            Loading donations...
                          </td>
                        </tr>
                      ) : donations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                            No donations yet.
                          </td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr key={d.id} className="border-t border-border">
                            <td className="px-4 py-3 text-sm">
                              {d.imageUrl ? (
                                <a href={d.imageUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={d.imageUrl}
                                    alt={d.name}
                                    className="w-12 h-12 object-cover rounded-md border border-border"
                                  />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">No image</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">{d.name}</td>
                            <td className="px-4 py-3 text-sm capitalize">{d.category}</td>
                            <td className="px-4 py-3 text-sm">{d.quantity}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  d.status === "safe"
                                    ? "status-safe"
                                    : d.status === "moderate"
                                      ? "status-moderate"
                                      : "status-unsafe"
                                }`}
                              >
                                {d.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{d.riskScore}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card p-6 max-w-lg">
                {feedbackSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="font-semibold text-lg">{t("feedback.success")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                    <h2 className="font-heading font-semibold text-lg">{t("feedback.title")}</h2>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("feedback.rating")}</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className={`hover:scale-110 transition-transform ${
                              value <= rating ? "text-warning" : "text-muted-foreground"
                            }`}
                          >
                            <Star className="w-8 h-8 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("feedback.comment")}</label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {submittingFeedback ? "Submitting..." : t("feedback.submit")}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card p-6 max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-lg">{user?.name}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default DonorDashboard;
