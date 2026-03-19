import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Lock, MapPin, Clock, AlertTriangle, Save, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  applyNgoDonation,
  getNgoDonations,
  getNgoProfile,
  saveNgoProfile,
  type NgoApplyPayload,
  type NgoDonation,
  type NgoProfilePayload,
} from "@/lib/api";

interface FoodItem extends NgoDonation {
  locked: boolean;
}

type ApplyFormMap = Record<number, NgoApplyPayload>;

const formatRemainingTime = (remainingSeconds: number) => {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const baseProfileForm = (organizationName: string, userEmail: string): NgoProfilePayload => ({
  organizationName: organizationName || "",
  address: "",
  contactEmail: userEmail || "",
  contactPhone: "",
  serviceRadiusKm: 15,
  notifyEmail: true,
  notifySms: false,
  notifyPush: false,
});

const NGODashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileWarning, setProfileWarning] = useState("");

  const [profileForm, setProfileForm] = useState<NgoProfilePayload>(
    baseProfileForm(user?.ngoName || "", user?.email || ""),
  );
  const [profileSaved, setProfileSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeApplyId, setActiveApplyId] = useState<number | null>(null);
  const [submittingApplyId, setSubmittingApplyId] = useState<number | null>(null);
  const [applyForms, setApplyForms] = useState<ApplyFormMap>({});
  const seenAvailableFoodIdsRef = useRef<Set<number>>(new Set());
  const initializedFoodSnapshotRef = useRef(false);

  const hasLocationConfigured = useMemo(
    () => profileSaved && Boolean(profileForm.address.trim()) && profileForm.serviceRadiusKm > 0,
    [profileForm.address, profileForm.serviceRadiusKm, profileSaved],
  );
  const isProfileView = useMemo(
    () => new URLSearchParams(location.search).get("tab") === "profile",
    [location.search],
  );

  const getDefaultApplyForm = (): NgoApplyPayload => ({
    collectorName: "",
    collectorPhone: "",
  });

  const applyDonationSnapshot = (donations: NgoDonation[], warningMessage: string, notifyOnNew: boolean) => {
    const mapped: FoodItem[] = donations.map((food) => ({
      ...food,
      locked: Boolean(food.lockedBy),
    }));
    const currentAvailable = mapped.filter((food) => !food.locked).map((food) => food.id);

    if (notifyOnNew && profileForm.notifyEmail && initializedFoodSnapshotRef.current && !warningMessage) {
      const newAvailable = mapped.filter(
        (food) => !food.locked && !seenAvailableFoodIdsRef.current.has(food.id),
      );
      if (newAvailable.length > 0) {
        toast.info("New nearby food available", {
          description: `${newAvailable.length} new donation(s) found near your NGO profile.`,
        });
      }
    }

    seenAvailableFoodIdsRef.current = new Set(currentAvailable);
    initializedFoodSnapshotRef.current = true;
    setFoods(mapped);
    setProfileWarning(warningMessage || "");
  };

  const hydrateNgoData = async () => {
    try {
      setLoading(true);
      const [profileResponse, donationResponse] = await Promise.all([getNgoProfile(), getNgoDonations()]);

      if (profileResponse.profile) {
        setProfileForm({
          organizationName: profileResponse.profile.organizationName || "",
          address: profileResponse.profile.address || "",
          contactEmail: profileResponse.profile.contactEmail || "",
          contactPhone: profileResponse.profile.contactPhone || "",
          serviceRadiusKm: Number(profileResponse.profile.serviceRadiusKm || 15),
          notifyEmail: Boolean(profileResponse.profile.notifyEmail),
          notifySms: Boolean(profileResponse.profile.notifySms),
          notifyPush: Boolean(profileResponse.profile.notifyPush),
        });
        setProfileSaved(true);
        setEditingProfile(false);
      } else {
        setProfileForm(baseProfileForm(user?.ngoName || "", user?.email || ""));
        setProfileSaved(false);
        setEditingProfile(true);
      }

      applyDonationSnapshot(donationResponse.donations, donationResponse.profileWarning || "", false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load NGO dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void hydrateNgoData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const donationResponse = await getNgoDonations();
        applyDonationSnapshot(donationResponse.donations, donationResponse.profileWarning || "", true);
      } catch {
        // Ignore poll failures; primary load path already handles error display.
      }
    }, 10000);

    return () => window.clearInterval(timer);
  }, [profileForm.notifyEmail]);

  const saveProfile = async () => {
    if (!profileForm.organizationName.trim()) {
      toast.error("Enter NGO organization name.");
      return;
    }
    if (!profileForm.contactPhone.trim()) {
      toast.error("Enter NGO contact phone number.");
      return;
    }
    if (!profileForm.contactEmail.trim()) {
      toast.error("Enter NGO contact email.");
      return;
    }
    if (!profileForm.address.trim()) {
      toast.error("Enter full NGO address for nearby filtering.");
      return;
    }
    if (!Number.isFinite(profileForm.serviceRadiusKm) || profileForm.serviceRadiusKm <= 0) {
      toast.error("Enter valid service radius in km.");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await saveNgoProfile(profileForm);
      setProfileSaved(true);
      setEditingProfile(false);
      toast.success(response.message, {
        description: "Profile saved. These details will auto-fill when locking food.",
      });
      await hydrateNgoData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save NGO profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const openApplyForm = (foodId: number) => {
    if (!profileSaved) {
      toast.error("Save NGO profile first. Then apply and lock food.");
      return;
    }
    setActiveApplyId(foodId);
    setApplyForms((prev) => ({
      ...prev,
      [foodId]: prev[foodId] || getDefaultApplyForm(),
    }));
  };

  const updateFormField = (foodId: number, field: keyof NgoApplyPayload, value: string) => {
    setApplyForms((prev) => ({
      ...prev,
      [foodId]: {
        ...(prev[foodId] || getDefaultApplyForm()),
        [field]: value,
      },
    }));
  };

  const handleApplySubmit = async (foodId: number) => {
    const form = applyForms[foodId];
    if (!form) return;
    if (Object.values(form).some((value) => !String(value).trim())) {
      toast.error("Collector name and collector phone are required.");
      return;
    }

    try {
      setSubmittingApplyId(foodId);
      await applyNgoDonation(foodId, form);
      toast.success(t("ngo.applied"), { description: "Food has been allocated to your organization." });
      setActiveApplyId(null);
      await hydrateNgoData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to apply for this food.");
    } finally {
      setSubmittingApplyId(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-heading font-bold">
            {t("dash.welcome")}, {user?.name}!
          </h1>
          <p className="text-muted-foreground">{isProfileView ? "Profile Details" : t("ngo.available")}</p>
        </motion.div>

        {isProfileView && (
          <div className="glass-card p-5 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-heading font-semibold text-lg">NGO Location Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Fill NGO details once. It gets saved to your profile and auto-fills lock form fields.
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${hasLocationConfigured ? "status-safe" : "status-moderate"}`}>
                {hasLocationConfigured ? "Configured" : "Needs setup"}
              </span>
            </div>

            {profileSaved && !editingProfile ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  NGO details are saved in your profile. These will be used while locking food.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">NGO Name</p>
                    <p className="font-medium">{profileForm.organizationName || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Contact Phone</p>
                    <p className="font-medium">{profileForm.contactPhone || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Contact Email</p>
                    <p className="font-medium">{profileForm.contactEmail || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Service Radius</p>
                    <p className="font-medium">{profileForm.serviceRadiusKm} km</p>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Full Address</p>
                  <p className="font-medium">{profileForm.address || "-"}</p>
                </div>
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">In-app nearby food alerts: </span>
                  <span className="font-medium">{profileForm.notifyEmail ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="inline-flex items-center gap-2 border border-input px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/ngo-dashboard")}
                    className="inline-flex items-center gap-2 border border-input px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Back to Available Food
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground mb-3">
                  Enter NGO Name, Contact Phone, Contact Email, Full Address, and Radius. After saving, nearby food will
                  appear and these details will be prefilled while locking food.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">NGO Name</label>
                    <input
                      value={profileForm.organizationName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Enter NGO/Trust name"
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Contact Phone</label>
                    <input
                      value={profileForm.contactPhone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="Enter NGO contact number"
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Contact Email</label>
                    <input
                      value={profileForm.contactEmail}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="Enter NGO email"
                      type="email"
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Service Radius (km)</label>
                    <input
                      value={profileForm.serviceRadiusKm}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, serviceRadiusKm: Number(e.target.value || 0) }))
                      }
                      placeholder="Example: 15"
                      type="number"
                      min={1}
                      max={100}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1">Full Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full NGO address (area, city, state)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                  />
                </div>

                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profileForm.notifyEmail}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, notifyEmail: e.target.checked }))}
                    />
                    Enable in-app nearby food alerts
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    When enabled, this dashboard shows alert when new nearby donation appears.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? "Saving..." : "Save NGO Profile"}
                  </button>
                  {profileSaved && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 border border-input px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/ngo-dashboard")}
                    className="inline-flex items-center gap-2 border border-input px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Back to Available Food
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!isProfileView && !profileSaved && (
          <div className="glass-card p-4 mb-6 border border-amber-500/30 bg-amber-500/10 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-amber-700" />
                <span>Complete profile from top-right menu: Profile</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/ngo-dashboard?tab=profile")}
                className="border border-input rounded-lg px-3 py-1.5 text-sm font-medium bg-background"
              >
                Open Profile
              </button>
            </div>
          </div>
        )}

        {!isProfileView && profileWarning && (
          <div className="glass-card p-4 mb-6 border border-amber-500/30 bg-amber-500/10 text-sm">
            <div className="flex items-center gap-2">
              <LocateFixed className="w-4 h-4 text-amber-700" />
              <span>{profileWarning}</span>
            </div>
          </div>
        )}

        {!isProfileView && (loading ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Loading available food...</div>
        ) : foods.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            No nearby food items found. Save NGO profile with full address and wait for donor submissions nearby.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {foods.map((food, i) => {
                const form = applyForms[food.id] || getDefaultApplyForm();
                const showForm = activeApplyId === food.id;
                const isSubmitting = submittingApplyId === food.id;

                return (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card p-5 relative ${food.locked ? "opacity-75" : "hover-lift"}`}
                  >
                    {food.imageUrl ? (
                      <img
                        src={food.imageUrl}
                        alt={food.name}
                        className="w-full h-44 object-contain bg-muted/20 rounded-lg border border-border mb-4"
                      />
                    ) : null}

                    {food.locked && (
                      <div className="absolute top-3 right-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
                        >
                          <Lock className="w-4 h-4 text-destructive" />
                        </motion.div>
                      </div>
                    )}

                    <div className="mb-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          food.status === "safe" ? "status-safe" : "status-moderate"
                        }`}
                      >
                        {food.status === "safe" ? (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                        )}
                        {food.status.toUpperCase()} - {food.riskScore}%
                      </span>
                    </div>

                    <h3 className="font-heading font-semibold text-lg mb-1">{food.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize mb-3">
                      {food.category} - {food.quantity} servings
                    </p>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" /> {food.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" /> {t("ai.safeTime")}: {formatRemainingTime(food.remainingSeconds)}
                    </div>
                    {typeof food.distanceKm === "number" && (
                      <div className="text-xs text-muted-foreground mb-4">
                        Distance: <span className="font-semibold">{food.distanceKm.toFixed(2)} km</span>
                      </div>
                    )}

                    {food.locked ? (
                      <div className="text-center py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" />
                        {t("ngo.locked")} {food.lockedBy ? `by ${food.lockedBy}` : ""}
                      </div>
                    ) : showForm ? (
                      <div className="space-y-2 border border-border rounded-lg p-3 bg-background/60">
                        <p className="text-sm font-semibold">NGO Application Form</p>
                        <p className="text-xs text-muted-foreground">
                          NGO details come from saved profile. Enter only collector details.
                        </p>
                        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          <p>Trust/NGO: {profileForm.organizationName || "-"}</p>
                          <p>Address: {profileForm.address || "-"}</p>
                        </div>
                        <input
                          value={form.collectorName}
                          onChange={(e) => updateFormField(food.id, "collectorName", e.target.value)}
                          placeholder="Collector Name"
                          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                        />
                        <input
                          value={form.collectorPhone}
                          onChange={(e) => updateFormField(food.id, "collectorPhone", e.target.value)}
                          placeholder="Collector Phone Number"
                          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => void handleApplySubmit(food.id)}
                            disabled={isSubmitting}
                            className="flex-1 bg-accent text-accent-foreground py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {isSubmitting ? "Submitting..." : "Submit & Lock"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveApplyId(null)}
                            disabled={isSubmitting}
                            className="px-3 py-2 rounded-lg border border-input text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openApplyForm(food.id)}
                        className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                      >
                        {t("ngo.apply")}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default NGODashboard;
