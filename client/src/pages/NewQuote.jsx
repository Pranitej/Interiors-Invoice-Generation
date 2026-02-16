import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RoomEditor from "../components/RoomEditor";
import ExtrasEditor from "../components/ExtrasEditor";
import ClientSection from "../components/ClientSection";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import ROOM_CONFIG from "../json/roomConfig";
import PricingSection from "../components/PricingSection";
import AdminInvoice from "../components/AdminInvoice";
import { formatINR, roundTo2 } from "../utils/calculations";
import InvoicePreview from "../components/InvoicePreview";
import { Check, FilePlusCorner, RefreshCw, X } from "lucide-react";

const DRAFT_KEY = "invoice_draft";

function getItemDefaults(roomName, itemName) {
  const globalDefaults = ROOM_CONFIG.defaultDimensions || {
    height: 8.5,
    width: 1,
    depth: 1,
  };

  const room = ROOM_CONFIG.rooms?.find((r) => r.name === roomName);
  if (!room)
    return {
      frame: { ...globalDefaults },
      box: { ...globalDefaults },
    };

  const item = room.items?.find((i) => i.name === itemName) || {};
  return {
    frame: {
      height: item.defaultFrame?.height ?? globalDefaults.height,
      width: item.defaultFrame?.width ?? globalDefaults.width,
    },
    box: {
      height: item.defaultBox?.height ?? globalDefaults.height,
      width: item.defaultBox?.width ?? globalDefaults.width,
      depth: item.defaultBox?.depth ?? globalDefaults.depth,
    },
  };
}

export default function NewQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const prevIdRef = useRef(id);
  const isEditingRef = useRef(!!id);
  const isLoadingDraftRef = useRef(false);
  const draftRestoredRef = useRef(false);
  const userEditedGlobalRateRef = useRef(false);

  const [client, setClient] = useState({
    name: "",
    mobile: "",
    email: "",
    siteAddress: "",
    siteMapLink: "",
  });

  const [globalFrameRate, setGlobalFrameRate] = useState(0);
  const [globalBoxRate, setGlobalBoxRate] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [extrasState, setExtrasState] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [invoiceType, setInvoiceType] = useState("");

  // Collapsed states for each section
  const [collapsedSections, setCollapsedSections] = useState({
    client: false,
    pricing: false,
    rooms: false,
    extras: false,
    preview: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!id && !draftLoaded && user) {
      isLoadingDraftRef.current = true;
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          setClient(d.client || {});
          const savedFrameRate = d.globalFrameRate || 0;
          const savedBoxRate =
            typeof d.globalBoxRate === "number"
              ? d.globalBoxRate
              : savedFrameRate * 1.4;

          setGlobalFrameRate(savedFrameRate);
          setGlobalBoxRate(savedBoxRate);

          setRooms(d.rooms || []);
          setUseCurrentLocation(d.useCurrentLocation || false);
          setExtrasState(Array.isArray(d.extrasState) ? d.extrasState : []);
          setDiscount(Number(d.discount || 0));
          setInvoiceType(d.invoiceType || "");
          draftRestoredRef.current = true;
        }
      } catch (e) {
        console.error("Draft Error:", e);
      }
      setDraftLoaded(true);
      setTimeout(() => (isLoadingDraftRef.current = false), 120);
    }
  }, [id, draftLoaded, user]);

  useEffect(() => {
    if (isEditingRef.current && !id && prevIdRef.current && !id) {
      setClient({
        name: "",
        mobile: "",
        email: "",
        siteAddress: "",
        siteMapLink: "",
      });
      setGlobalFrameRate(0);
      setGlobalBoxRate(0);
      setRooms([]);
      setExtrasState([]);
      setUseCurrentLocation(false);
      setDraftLoaded(false);
      userEditedGlobalRateRef.current = false;
    }
    prevIdRef.current = id;
    isEditingRef.current = !!id;
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    if (!user.isAdmin) {
      alert("Only admin can edit invoices.");
      navigate("/history");
      return;
    }

    async function fetchInvoice() {
      try {
        setIsLoading(true);
        setCollapsedSections({
          client: false,
          pricing: false,
          rooms: true,
          extras: true,
          preview: false,
        });
        const res = await api.get(`/invoices/${id}`);
        const invoice = res.data;

        setClient(invoice.client);
        setDiscount(Number(invoice.discount || 0));
        setInvoiceType(invoice.invoiceType || "");

        const invoiceFrameRate = invoice.pricing.frameRate || 0;
        const invoiceBoxRate =
          typeof invoice.pricing.boxRate === "number"
            ? invoice.pricing.boxRate
            : invoiceFrameRate * 1.4;

        setGlobalFrameRate(invoiceFrameRate);
        setGlobalBoxRate(invoiceBoxRate);
        userEditedGlobalRateRef.current = false;

        setRooms(
          invoice.rooms.map((r) => ({
            name: r.name,
            description: r.description,
            frameRate: r.frameRate,
            boxRate:
              typeof r.boxRate === "number"
                ? r.boxRate
                : (invoiceBoxRate ?? invoiceFrameRate * 1.4),
            isCustomRate: r.frameRate !== invoice.pricing.frameRate,
            items: r.items.map((i) => ({
              name: i.name,
              frame: { ...i.frame },
              box: { ...i.box },
              totalPrice: i.totalPrice,
            })),
            accessories: r.accessories || [],
          })),
        );

        setExtrasState(
          invoice.extras.map((ex, i) => ({
            id: ex._id?.toString() || `${i}-${Date.now()}`,
            key: ex.key,
            label: ex.label,
            type: ex.type,
            inputs: ex.inputs,
            total: Number(ex.total),
          })),
        );

        setUseCurrentLocation(!!invoice.client.siteMapLink);
      } catch (e) {
        console.error("Load Invoice Error:", e);
        alert("Failed to load invoice");
        navigate("/history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoice();
  }, [id, user, navigate]);

  useEffect(() => {
    if (id || isLoadingDraftRef.current) return;

    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          client,
          globalFrameRate,
          globalBoxRate,
          rooms,
          extrasState,
          useCurrentLocation,
          discount,
          invoiceType,
          timestamp: Date.now(),
        }),
      );
    }, 900);

    return () => clearTimeout(t);
  }, [
    client,
    globalFrameRate,
    globalBoxRate,
    rooms,
    extrasState,
    useCurrentLocation,
    id,
    discount,
  ]);

  useEffect(() => {
    if (draftRestoredRef.current) {
      draftRestoredRef.current = false;
      return;
    }

    if (id && !userEditedGlobalRateRef.current) return;

    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        frameRate: globalFrameRate,
        boxRate: globalBoxRate,
      })),
    );
  }, [globalFrameRate, globalBoxRate, id]);

  const addRoom = () =>
    setRooms((p) => [
      ...p,
      {
        name: "",
        description: "",
        frameRate: globalFrameRate,
        boxRate: globalBoxRate || globalFrameRate * 1.4,
        isCustomRate: false,
        items: [],
        accessories: [],
      },
    ]);

  const removeRoom = (i) => setRooms((p) => p.filter((_, x) => x !== i));
  const updateRoom = (i, updated) =>
    setRooms((p) => {
      const copy = [...p];
      copy[i] = updated;
      return copy;
    });

  const computeGrandTotal = () => {
    const roomsTotal = rooms.reduce((sum, r) => {
      const items = (r.items || []).reduce(
        (s, i) => s + (i.totalPrice || 0),
        0,
      );
      const acc = (r.accessories || []).reduce(
        (s, a) => s + Number(a.price || 0) * Number(a.qty || 0),
        0,
      );
      return sum + items + acc;
    }, 0);

    const extrasTotal = extrasState.reduce(
      (s, e) => s + Number(e.total || 0),
      0,
    );

    return roomsTotal + extrasTotal;
  };

  const buildPayload = () => {
    const gross = computeGrandTotal();
    const safeDiscount = Math.min(Number(discount || 0), gross);
    const finalPayable = roundTo2(gross - safeDiscount);

    return {
      client,
      pricing: {
        frameRate: globalFrameRate,
        boxRate: globalBoxRate,
      },
      rooms,
      extras: extrasState.map((e) => ({
        key: e.key,
        label: e.label,
        type: e.type,
        inputs: e.inputs,
        total: e.total,
      })),
      grandTotalBeforeDiscount: gross, // before discount
      discount: safeDiscount, // NEW
      finalPayableAfterDiscount: finalPayable, // NEW
      invoiceType,
      createdBy: user.username,
      role: user.isAdmin ? "admin" : "Engineer",
    };
  };

  const handleSaveInvoice = async () => {
    if (!client.siteAddress.trim()) {
      alert("Site address is required to save the invoice.");
      return;
    }

    try {
      setIsLoading(true);
      setSaveStatus({ type: "loading", message: "Saving invoice..." });

      if (id) {
        await api.put(`/invoices/${id}`, buildPayload());
        setSaveStatus({
          type: "success",
          message: "Invoice updated successfully!",
        });
        setTimeout(() => {
          navigate("/history");
        }, 1500);
      } else {
        await api.post("/invoices", buildPayload());
        setSaveStatus({
          type: "success",
          message: "Invoice created successfully!",
        });
        localStorage.removeItem(DRAFT_KEY);
        setTimeout(() => {
          navigate("/history");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus({
        type: "error",
        message: "Failed to save invoice. Please try again.",
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNewInvoice = async () => {
    if (!client.siteAddress.trim()) {
      alert("Site address is required to save the invoice.");
      return;
    }

    try {
      setIsLoading(true);
      setSaveStatus({ type: "loading", message: "Saving as new invoice..." });

      await api.post("/invoices", buildPayload());

      setSaveStatus({
        type: "success",
        message: "Invoice saved as new successfully!",
      });
      setTimeout(() => {
        navigate("/history");
      }, 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus({
        type: "error",
        message: "Failed to save invoice. Please try again.",
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDraft = () => {
    if (
      !confirm(
        "Are you sure you want to clear the current draft? This action cannot be undone.",
      )
    )
      return;

    setClient({
      name: "",
      mobile: "",
      email: "",
      siteAddress: "",
      siteMapLink: "",
    });
    setGlobalFrameRate(0);
    setGlobalBoxRate(0);
    setRooms([]);
    setExtrasState([]);
    setDiscount(0);
    setInvoiceType("");
    setUseCurrentLocation(false);
    localStorage.removeItem(DRAFT_KEY);
    userEditedGlobalRateRef.current = false;
    setSaveStatus({ type: "info", message: "Draft cleared successfully." });
    setTimeout(() => setSaveStatus(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {id ? "Loading Invoice..." : "Loading Quote Builder..."}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {id ? "Fetching invoice details..." : "Preparing workspace..."}
          </p>
        </div>
      </div>
    );
  }

  const grandTotal = computeGrandTotal();
  const safeDiscount = Math.min(Number(discount || 0), grandTotal);
  const finalPayable = roundTo2(grandTotal - safeDiscount);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 rounded-lg bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 shadow-sm">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {/* <button
                onClick={() => navigate("/history")}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button> */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-800 dark:text-white truncate">
                  {id
                    ? `Editing Invoice #${id.substring(0, 6)}...`
                    : "New Quote"}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{rooms.length} rooms</span>
                  <span>•</span>
                  <span>{extrasState.length} extras</span>
                  <span>•</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatINR(finalPayable)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveInvoice}
              disabled={isLoading || !client.siteAddress.trim()}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              <span className="hidden xs:inline">{id ? "Update" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus && (
        <div className="fixed top-12 left-2 right-2 sm:left-auto sm:right-4 sm:max-w-sm z-50">
          <div
            className={`rounded-lg p-3 shadow-lg border text-sm ${
              saveStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : saveStatus.type === "error"
                  ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                  : saveStatus.type === "loading"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus.type === "loading" && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              )}
              <p className="font-medium">{saveStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Vertical Stack */}
      <div className="p-0 pt-3  mx-auto space-y-3">
        {/* Client Section Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div
            className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("client")}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h2 className="font-bold text-gray-800 dark:text-white">
                Client Information
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                Required
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  collapsedSections.client ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {!collapsedSections.client && (
            <div className="p-3">
              <ClientSection
                client={client}
                setClient={setClient}
                useCurrentLocation={useCurrentLocation}
                setUseCurrentLocation={setUseCurrentLocation}
                onClearDraft={handleClearDraft}
                canClearDraft={!id}
              />
            </div>
          )}
        </div>

        {/* Pricing Section Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div
            className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("pricing")}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="font-bold text-gray-800 dark:text-white">
                Pricing Rates
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Frame: ₹{globalFrameRate}</span>
                <span className="mx-2">•</span>
                <span className="font-medium">Box: ₹{globalBoxRate}</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  collapsedSections.pricing ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {!collapsedSections.pricing && (
            <div className="p-3">
              <PricingSection
                globalFrameRate={globalFrameRate}
                globalBoxRate={globalBoxRate}
                discount={discount}
                setDiscount={setDiscount}
                invoiceType={invoiceType}
                setInvoiceType={setInvoiceType}
                onChangeFrameRate={(value) => {
                  userEditedGlobalRateRef.current = true;
                  setGlobalFrameRate(value);
                  setGlobalBoxRate(roundTo2(value * 1.4));
                }}
                onChangeBoxRate={(value) => {
                  userEditedGlobalRateRef.current = true;
                  setGlobalBoxRate(value);
                }}
              />
            </div>
          )}
        </div>

        {/* Rooms Section Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div
            className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("rooms")}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h2 className="font-bold text-gray-800 dark:text-white">
                Rooms & Items
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
              </span>
              <div className="flex items-center gap-2">
                {rooms.length === 0 ? (
                  <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                    Add rooms
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addRoom();
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Room
                  </button>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                    collapsedSections.rooms ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {!collapsedSections.rooms && (
            <div className="p-3 space-y-3">
              {rooms.length > 0 ? (
                rooms.map((room, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <RoomEditor
                      room={room}
                      getItemDefaults={getItemDefaults}
                      onChange={(updated) => updateRoom(index, updated)}
                      onRemoveRoom={() => removeRoom(index)}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No rooms added yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Start by adding your first room
                  </p>
                  <button
                    onClick={addRoom}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add First Room
                  </button>
                </div>
              )}

              {rooms.length > 0 && (
                <button
                  onClick={addRoom}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Another Room
                </button>
              )}
            </div>
          )}
        </div>

        {/* Extras Section Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div
            className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("extras")}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h2 className="font-bold text-gray-800 dark:text-white">
                Additional Extras
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {extrasState.length}{" "}
                {extrasState.length === 1 ? "extra" : "extras"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  collapsedSections.extras ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {!collapsedSections.extras && (
            <div className="p-3">
              <ExtrasEditor extras={extrasState} setExtras={setExtrasState} />
            </div>
          )}
        </div>

        {/* Preview Section Card */}
        <div>
          <InvoicePreview
            id={id}
            client={client}
            globalFrameRate={globalFrameRate}
            globalBoxRate={globalBoxRate}
            rooms={rooms}
            extrasState={extrasState}
            grandTotal={grandTotal}
            discount={discount}
            invoiceType={invoiceType}
            finalPayable={finalPayable}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
          />
        </div>
      </div>

      {/* Sticky Bottom Action Bar - Only shown on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-3 z-50 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Grand Total
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatINR(finalPayable)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/history")}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <X />
            </button>

            {id ? (
              <>
                <button
                  onClick={handleSaveAsNewInvoice}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FilePlusCorner />
                </button>
                <button
                  onClick={handleSaveInvoice}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleSaveInvoice}
                disabled={isLoading || !client.siteAddress.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-40">
        <div className="flex flex-col gap-2">
          {id && (
            <button
              onClick={handleSaveAsNewInvoice}
              disabled={isLoading}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Save as New
            </button>
          )}
          <button
            onClick={handleSaveInvoice}
            disabled={isLoading || !client.siteAddress.trim()}
            className="px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {id ? "Update Invoice" : "Save Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
