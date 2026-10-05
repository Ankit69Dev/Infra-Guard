"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Send,
  X,
} from "lucide-react";

const departments = {
  ROAD: "Road Department",
  BRIDGE: "Bridge / Engineering Department",
  DRAINAGE: "Drainage Department",
  STREETLIGHT: "Electrical / Streetlight Department",
} as const;

const types = [
  {
    value: "ROAD",
    label: "Road",
    description: "Potholes, cracks, damaged surfaces",
  },
  {
    value: "BRIDGE",
    label: "Bridge",
    description: "Structural or safety problems",
  },
  {
    value: "DRAINAGE",
    label: "Drainage",
    description: "Blocked drains, flooding, damage",
  },
  {
    value: "STREETLIGHT",
    label: "Streetlight",
    description: "Broken or non-working lights",
  },
] as const;

type AssetType = keyof typeof departments;

type OSMLocation = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
};

interface ReportIssueModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReportIssueModal({
  open,
  onClose,
  onSuccess,
}: ReportIssueModalProps) {
  const currentCalendarYear = new Date().getFullYear();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState<AssetType>("ROAD");

  const [installationYear, setInstallationYear] =
    useState("");

  const [expectedMaintenanceYear, setExpectedMaintenanceYear] =
    useState("");

  const [currentYear, setCurrentYear] =
    useState(String(currentCalendarYear));

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");

  const [locations, setLocations] = useState<OSMLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
   * Load Ranchi locations from OSM API
   * whenever the modal is opened.
   */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadLocations() {
      try {
        setLocationsLoading(true);

        const response = await fetch("/api/locations");

        if (!response.ok) {
          throw new Error("Failed to load Ranchi locations.");
        }

        const data = await response.json();

        if (!cancelled) {
          setLocations(data.locations ?? []);
        }
      } catch (error) {
        console.error("Failed to load OSM locations:", error);

        if (!cancelled) {
          setLocations([]);
        }
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * Close with Escape and prevent background scrolling.
   */
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onClose]);

  /*
   * Reset the form.
   */
  function resetForm() {
    setTitle("");
    setDescription("");
    setType("ROAD");

    setInstallationYear("");
    setExpectedMaintenanceYear("");
    setCurrentYear(String(new Date().getFullYear()));

    setLatitude("");
    setLongitude("");
    setAddress("");

    setError("");
    setSuccess(false);
  }

  function handleClose() {
    if (submitting) return;

    resetForm();
    onClose();
  }

  /*
   * Validate lifecycle year.
   */
  function validateYear(
    value: string,
    label: string
  ): number | null {
    if (!value.trim()) {
      setError(`${label} is required.`);
      return null;
    }

    const year = Number(value);

    if (!Number.isInteger(year)) {
      setError(`${label} must be a valid year.`);
      return null;
    }

    if (year < 1800 || year > 2100) {
      setError(`${label} must be between 1800 and 2100.`);
      return null;
    }

    return year;
  }

  /*
   * Submit report.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter an issue title.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    const installation = validateYear(
      installationYear,
      "Installation / manufacturing year"
    );

    if (installation === null) {
      return;
    }

    const maintenance = validateYear(
      expectedMaintenanceYear,
      "Expected maintenance year"
    );

    if (maintenance === null) {
      return;
    }

    const current = validateYear(
      currentYear,
      "Current year"
    );

    if (current === null) {
      return;
    }

    if (installation > current) {
      setError(
        "Installation / manufacturing year cannot be after the current year."
      );
      return;
    }

    if (maintenance < installation) {
      setError(
        "Expected maintenance year cannot be before the installation year."
      );
      return;
    }

    if (!address) {
      setError("Please select the issue location.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Please select a valid issue location.");
      return;
    }

    if (lat < -90 || lat > 90) {
      setError("Invalid latitude for the selected location.");
      return;
    }

    if (lng < -180 || lng > 180) {
      setError("Invalid longitude for the selected location.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),

          type,

          installationYear: installation,
          expectedMaintenanceYear: maintenance,
          currentYear: current,

          latitude: lat,
          longitude: lng,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to submit the report."
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error("Report submission error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit the report."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  /*
   * =========================
   * SUCCESS SCREEN
   * =========================
   */
  if (success) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="relative z-[10000] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2
                size={34}
                className="text-emerald-600"
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Report Submitted
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your infrastructure issue has been submitted
              successfully. The relevant department has been
              assigned automatically and lifecycle risk has been
              calculated.
            </p>

            <div className="mt-5 w-full rounded-2xl bg-slate-50 p-4 text-left">
              <div className="flex items-center gap-3">
                <MapPin
                  size={18}
                  className="shrink-0 text-slate-500"
                />

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Location
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-800">
                    {address}, Ranchi
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <FileText
                  size={18}
                  className="shrink-0 text-slate-500"
                />

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Department
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {departments[type]}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-400">
                  Lifecycle information
                </p>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Installed
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      {installationYear}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      Maintenance
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      {expectedMaintenanceYear}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      Current
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      {currentYear}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess?.();
                handleClose();
              }}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * MAIN REPORT MODAL
   * =========================
   */
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          handleClose();
        }
      }}
    >
      <div className="relative z-[10000] flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <AlertTriangle
                  size={18}
                  className="text-slate-700"
                />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Report Infrastructure Issue
              </h2>
            </div>

            <p className="mt-1 pl-11 text-xs text-slate-500">
              Help authorities identify and respond to
              infrastructure problems in Ranchi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close report modal"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-6">
            {/* TYPE */}
            <section>
              <div className="mb-3">
                <label className="text-sm font-semibold text-slate-800">
                  Infrastructure Type
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Select what type of infrastructure has an
                  issue.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {types.map((item) => {
                  const selected = type === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setType(item.value)
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          selected
                            ? "text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          selected
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* DEPARTMENT */}
            <section>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Assigned Department
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {departments[type]}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Department is assigned automatically based
                  on the infrastructure type.
                </p>
              </div>
            </section>

            {/* TITLE */}
            <section>
              <label
                htmlFor="report-title"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Issue Title
              </label>

              <input
                id="report-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Large pothole near Main Road"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                maxLength={150}
              />
            </section>

            {/* DESCRIPTION */}
            <section>
              <label
                htmlFor="report-description"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Issue Description
              </label>

              <textarea
                id="report-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe what you observed and any safety concerns..."
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />

              <p className="mt-1 text-right text-[11px] text-slate-400">
                {description.length}/2000
              </p>
            </section>

            {/* LIFECYCLE INFORMATION */}
            <section>
              <div className="mb-3">
                <label className="text-sm font-semibold text-slate-800">
                  Infrastructure Lifecycle
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These values are used to calculate the
                  infrastructure risk automatically.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* INSTALLATION YEAR */}
                <div>
                  <label
                    htmlFor="installation-year"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Installation / Manufacturing Year
                  </label>

                  <input
                    id="installation-year"
                    type="number"
                    inputMode="numeric"
                    min="1800"
                    max="2100"
                    value={installationYear}
                    onChange={(event) =>
                      setInstallationYear(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 2020"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* MAINTENANCE YEAR */}
                <div>
                  <label
                    htmlFor="maintenance-year"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Expected Maintenance Year
                  </label>

                  <input
                    id="maintenance-year"
                    type="number"
                    inputMode="numeric"
                    min="1800"
                    max="2100"
                    value={expectedMaintenanceYear}
                    onChange={(event) =>
                      setExpectedMaintenanceYear(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 2027"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* CURRENT YEAR */}
                <div>
                  <label
                    htmlFor="current-year"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Current Year
                  </label>

                  <input
                    id="current-year"
                    type="number"
                    inputMode="numeric"
                    min="1800"
                    max="2100"
                    value={currentYear}
                    onChange={(event) =>
                      setCurrentYear(
                        event.target.value
                      )
                    }
                    placeholder={String(
                      currentCalendarYear
                    )}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  Risk is calculated automatically from the
                  infrastructure age and maintenance schedule.
                  You do not need to select a risk severity.
                </p>
              </div>
            </section>

            {/* LOCATION */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <MapPin
                  size={17}
                  className="text-slate-600"
                />

                <div>
                  <label
                    htmlFor="issue-location"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Issue Location
                  </label>

                  <p className="text-xs text-slate-500">
                    Select the Ranchi area where the issue was
                    observed.
                  </p>
                </div>
              </div>

              <select
                id="issue-location"
                value={
                  locations.find(
                    (location) =>
                      location.name === address &&
                      location.latitude.toString() ===
                        latitude &&
                      location.longitude.toString() ===
                        longitude
                  )?.id ?? ""
                }
                onChange={(event) => {
                  const selectedLocation =
                    locations.find(
                      (location) =>
                        location.id ===
                        event.target.value
                    );

                  if (!selectedLocation) {
                    setAddress("");
                    setLatitude("");
                    setLongitude("");
                    return;
                  }

                  setAddress(selectedLocation.name);

                  setLatitude(
                    String(selectedLocation.latitude)
                  );

                  setLongitude(
                    String(selectedLocation.longitude)
                  );

                  setError("");
                }}
                disabled={locationsLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {locationsLoading
                    ? "Loading Ranchi locations..."
                    : locations.length === 0
                      ? "No Ranchi locations available"
                      : "Select issue location"}
                </option>

                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ))}
              </select>

              {address && latitude && longitude && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-400">
                        Selected Location
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {address}, Ranchi
                      </p>
                    </div>

                    <MapPin
                      size={18}
                      className="shrink-0 text-slate-500"
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <span>
                      Latitude: {latitude}
                    </span>

                    <span>
                      Longitude: {longitude}
                    </span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-400">
                    Location data provided by OpenStreetMap.
                  </p>
                </div>
              )}
            </section>

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-sm leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}