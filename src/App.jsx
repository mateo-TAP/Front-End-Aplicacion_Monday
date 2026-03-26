import React, { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import axios from "axios";
import "monday-ui-react-core/tokens";
import "monday-ui-react-core/dist/main.css";
import "./App.css";

const monday = mondaySdk();
// Usamos variable de entorno para la URL del Backend separado
const configuredApiUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
const deprecatedBackendHost = "back-end-aplicacion-monday.netlify.app";
const placeholderBackendHost = "TU-BACKEND-VERCEL.vercel.app";
const defaultProductionApiUrl = "https://back-end-aplicacion-monday.vercel.app/api";
const API_URL = (
  configuredApiUrl &&
  !configuredApiUrl.includes(deprecatedBackendHost) &&
  !configuredApiUrl.includes(placeholderBackendHost)
    ? configuredApiUrl
    : defaultProductionApiUrl
).replace(/\/$/, "");

/* ─── Iconos SVG inline ─── */
const IconCert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>
);
const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const IconUpload = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0073ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ca72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const MENU_ITEMS = [
  { id: "datos", label: "Datos Fiscales", icon: <IconBuilding /> },
  { id: "certificados", label: "Certificados AFIP", icon: <IconCert /> },
  { id: "mapping_v2", label: "Mapeo Visual (Nuevo)", icon: <IconList /> },
  { id: "board_setup", label: "Configurar Tablero", icon: <IconSettings /> },
  { id: "invoices", label: "Emitir Facturas", icon: <IconFile /> },
];

const BOARD_ITEM_REQUIRED_COLUMNS = [
  { key: "client_document", label: "CUIT / DNI Receptor", aliases: ["cuit receptor", "dni receptor", "cuit / dni receptor", "cuit/dni receptor", "documento receptor", "documento cliente", "documento", "nro documento", "numero documento"], acceptedTypes: ["text", "numbers"] },
  { key: "client_document_type", label: "Tipo Documento", aliases: ["tipo documento", "tipo doc"], acceptedTypes: ["status", "dropdown", "color"] },
  { key: "billing_status", label: "Estado Comprobante", aliases: ["estado comprobante", "estado facturacion", "estado factura", "facturacion"], acceptedTypes: ["status", "color", "dropdown"] },
  { key: "invoice_pdf", label: "Comprobante PDF", aliases: ["comprobante pdf", "pdf comprobante", "pdf factura", "factura pdf"], acceptedTypes: ["file"] }
];

const BOARD_SUBITEM_REQUIRED_COLUMNS = [
  { key: "concept", label: "Concepto (línea)", aliases: ["concepto", "detalle", "descripcion", "producto", "servicio", "nombre"], acceptedTypes: ["text", "long-text", "name"] },
  { key: "quantity", label: "Cantidad (línea)", aliases: ["cantidad", "cant"], acceptedTypes: ["numbers"] },
  { key: "unit_price", label: "Precio Unitario (línea)", aliases: ["precio unitario", "precio", "importe unitario"], acceptedTypes: ["numbers", "numeric", "money"] }
];

const IVA_OPTIONS = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
];

const COMPROBANTE_STATUS_FLOW = {
  trigger: "Crear Comprobante",
  processing: "Creando Comprobante",
  success: "Comprobante Creado",
  error: "Error - Mirar Comentarios",
};

const App = () => {
  const [context, setContext] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [activeSection, setActiveSection] = useState("datos");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSavedData, setIsFetchingSavedData] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiError, setApiError] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [isFiscalLocked, setIsFiscalLocked] = useState(false);
  const [isCertificatesLocked, setIsCertificatesLocked] = useState(false);
  const [isMappingLocked, setIsMappingLocked] = useState(false);
  const [isSavingBoardConfig, setIsSavingBoardConfig] = useState(false);
  const [isSavingUserApiToken, setIsSavingUserApiToken] = useState(false);
  const [userApiToken, setUserApiToken] = useState("");
  const [hasSavedUserApiToken, setHasSavedUserApiToken] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isEmittingFacturaC, setIsEmittingFacturaC] = useState(false);
  const [emitFacturaCResult, setEmitFacturaCResult] = useState(null);

  // Certificados
  const [crtFile, setCrtFile] = useState(null);
  const [keyFile, setKeyFile] = useState(null);
  const [hasSavedCertificates, setHasSavedCertificates] = useState(false);
  const [certificateExpirationDate, setCertificateExpirationDate] = useState("");

  // Datos fiscales
  const [fiscal, setFiscal] = useState({
    puntoVenta: "",
    cuit: "",
    fechaInicio: "",
    razonSocial: "",
    domicilio: "",
    condicionIva: "Responsable Inscripto",
  });
  const [hasSavedFiscalData, setHasSavedFiscalData] = useState(false);

  // Mapeo
  const [columns, setColumns] = useState([]);
  const [subitemColumns, setSubitemColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [boardConfig, setBoardConfig] = useState({
    status_column_id: "",
    trigger_label: COMPROBANTE_STATUS_FLOW.trigger,
    processing_label: COMPROBANTE_STATUS_FLOW.processing,
    success_label: COMPROBANTE_STATUS_FLOW.success,
    error_label: COMPROBANTE_STATUS_FLOW.error,
  });
  const [emitForm, setEmitForm] = useState({
    itemId: "",
  });
  const requiredMappingFields = ["fecha_emision", "receptor_cuit", "concepto", "cantidad", "precio_unitario"];
  const mappingCompleted = requiredMappingFields.every((field) => Boolean(mapping[field]));
  const mappedRequiredCount = requiredMappingFields.filter((field) => Boolean(mapping[field])).length;

  const normalizeText = (value) =>
    (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const statusColumns = columns.filter((column) =>
    ["status", "color", "dropdown"].includes(column.type)
  );

  const getRequiredColumnsStatus = (requiredColumns, availableColumns) => requiredColumns.map((requiredColumn) => {
    const foundColumn = availableColumns.find((column) => {
      const normalizedTitle = normalizeText(column.label);
      const matchesAlias = requiredColumn.aliases.some((alias) =>
        normalizedTitle.includes(normalizeText(alias))
      );
      if (!matchesAlias) return false;
      return requiredColumn.acceptedTypes.includes(column.type);
    });

    const foundWithAnyType = availableColumns.find((column) => {
      const normalizedTitle = normalizeText(column.label);
      return requiredColumn.aliases.some((alias) =>
        normalizedTitle.includes(normalizeText(alias))
      );
    });

    if (foundColumn) {
      return { ...requiredColumn, status: "ok", foundColumn };
    }

    if (foundWithAnyType) {
      return { ...requiredColumn, status: "wrong_type", foundColumn: foundWithAnyType };
    }

    return { ...requiredColumn, status: "missing", foundColumn: null };
  });

  const requiredItemColumnsStatus = getRequiredColumnsStatus(BOARD_ITEM_REQUIRED_COLUMNS, columns);
  const requiredSubitemColumnsStatus = getRequiredColumnsStatus(BOARD_SUBITEM_REQUIRED_COLUMNS, subitemColumns);
  const requiredBoardColumnsStatus = [...requiredItemColumnsStatus, ...requiredSubitemColumnsStatus];
  const hasSubitemsColumnInBoard = columns.some((column) => column.type === "subtasks");
  const hasSubitemsStructureReady = hasSubitemsColumnInBoard && subitemColumns.length > 0;

  const allRequiredItemColumnsReady = requiredItemColumnsStatus.every((column) => column.status === "ok");
  const allRequiredSubitemColumnsReady = requiredSubitemColumnsStatus.every((column) => column.status === "ok");
  const allRequiredBoardColumnsReady = allRequiredItemColumnsReady && allRequiredSubitemColumnsReady;
  const hasAutomationConfig = Boolean(boardConfig.status_column_id);

  useEffect(() => {
    monday
      .get("sessionToken")
      .then((res) => setSessionToken(res?.data || ""))
      .catch((err) => {
        console.error("No se pudo obtener sessionToken de monday:", err);
        setSessionToken("");
      });

    monday.get("context").then((res) => {
      console.log("Contexto inicial:", res.data);
      setContext(res.data);
    });

    monday.get("location").then((res) => {
      setLocationData(res.data);
    });

    const unsubscribeContext = monday.listen("context", (res) => {
      console.log("Contexto recibido:", res.data);
      setContext(res.data);
    });

    const unsubscribeLocation = monday.listen("location", (res) => {
      setLocationData(res.data);
    });

    return () => {
      unsubscribeContext?.();
      unsubscribeLocation?.();
    };
  }, []);

  useEffect(() => {
    const checkApi = async () => {
      try {
        await axios.get(`${API_URL}/health`, { timeout: 8000 });
        setApiStatus("ok");
        setApiError("");
      } catch (err) {
        setApiStatus("error");
        setApiError(err?.message || "No se pudo conectar al backend");
      }
    };

    checkApi();
  }, []);

  const boardId = context?.boardId || context?.locationContext?.boardId || null;
  const contextItemId = context?.itemId || context?.pulseId || context?.locationContext?.itemId || "";
  const appFeatureId = context?.appFeatureId || null;
  const viewIdFromHref = locationData?.href?.match(/\/views\/(\d+)/)?.[1] || null;
  const authHeaders = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};

  // Fetch columns when context is ready
  useEffect(() => {
    if (context?.boardId) {
      monday
        .api(`query { boards(ids: [${context.boardId}]) { columns { id title type settings_str } } }`)
        .then(async (res) => {
          const boardColumns = res.data?.boards?.[0]?.columns || [];
          if (!boardColumns.length) return;

          const cols = boardColumns.map((c) => ({
            value: c.id,
            label: c.title,
            type: c.type,
          }));
          setColumns(cols);

          const subitemsColumn = boardColumns.find((c) => c.type === "subtasks");
          if (!subitemsColumn?.settings_str) {
            setSubitemColumns([]);
            return;
          }

          let subitemsBoardId = null;
          try {
            const settings = JSON.parse(subitemsColumn.settings_str);
            subitemsBoardId =
              settings?.boardIds?.[0] ||
              settings?.boardId ||
              settings?.board_ids?.[0] ||
              null;
          } catch (err) {
            console.error("No se pudo parsear settings_str de subitems:", err);
          }

          if (!subitemsBoardId) {
            setSubitemColumns([]);
            return;
          }

          try {
            const subitemsRes = await monday.api(
              `query { boards(ids: [${subitemsBoardId}]) { columns { id title type } } }`
            );
            const subCols =
              subitemsRes.data?.boards?.[0]?.columns
                .map((c) => ({
                  value: c.id,
                  label: c.id === "name" ? "Nombre del subitem" : c.title,
                  type: c.type,
                })) || [];
            setSubitemColumns(subCols);
          } catch (err) {
            console.error("No se pudieron cargar columnas de subitems:", err);
            setSubitemColumns([]);
          }
        });
    }
  }, [context]);

  useEffect(() => {
    const fetchSavedSetup = async () => {
      if (!context?.account?.id) return;

      setIsFetchingSavedData(true);
      try {
        const response = await axios.get(`${API_URL}/setup/${context.account.id}`, {
          params: {
            board_id: boardId,
            view_id: viewIdFromHref,
            app_feature_id: appFeatureId
          },
          headers: authHeaders
        });
        const data = response.data;

        if (data?.hasFiscalData && data?.fiscalData) {
          setFiscal({
            puntoVenta: data.fiscalData.default_point_of_sale?.toString() || "",
            cuit: data.fiscalData.cuit || "",
            fechaInicio: data.fiscalData.fecha_inicio
              ? new Date(data.fiscalData.fecha_inicio).toISOString().split("T")[0]
              : "",
            razonSocial: data.fiscalData.business_name || "",
            domicilio: data.fiscalData.domicilio || "",
            condicionIva: data.fiscalData.iva_condition || "Responsable Inscripto",
          });
          setHasSavedFiscalData(true);
          setIsFiscalLocked(true);
        }

        if (data?.hasCertificates) {
          setHasSavedCertificates(true);
          setIsCertificatesLocked(true);
          setCertificateExpirationDate(
            data?.certificates?.expiration_date
              ? new Date(data.certificates.expiration_date).toLocaleDateString("es-AR")
              : ""
          );
        }

        if (data?.visualMapping?.mapping && typeof data.visualMapping.mapping === "object") {
          setMapping(data.visualMapping.mapping);
          setIsMappingLocked(Boolean(data.visualMapping.is_locked));
        } else {
          setMapping({});
          setIsMappingLocked(false);
        }

        if (data?.boardConfig && typeof data.boardConfig === "object") {
          setBoardConfig({
            status_column_id: data.boardConfig.status_column_id || "",
            trigger_label: COMPROBANTE_STATUS_FLOW.trigger,
            processing_label: COMPROBANTE_STATUS_FLOW.processing,
            success_label: COMPROBANTE_STATUS_FLOW.success,
            error_label: COMPROBANTE_STATUS_FLOW.error,
          });
        }

        try {
          const tokenResponse = await axios.get(`${API_URL}/user-api-token/${context.account.id}`, {
            headers: authHeaders,
          });
          setHasSavedUserApiToken(Boolean(tokenResponse?.data?.has_token));
        } catch (tokenErr) {
          console.error("No se pudo consultar estado de token de usuario:", tokenErr);
          setHasSavedUserApiToken(false);
        }
      } catch (err) {
        console.error("No se pudieron recuperar datos guardados:", err);
        setApiStatus("error");
        setApiError(err?.response?.data?.error || err?.message || "Error consultando setup");
      } finally {
        setIsFetchingSavedData(false);
      }
    };

    fetchSavedSetup();
  }, [context, boardId, viewIdFromHref, appFeatureId, sessionToken]);

  useEffect(() => {
    if (boardConfig.status_column_id || statusColumns.length === 0) return;

    setBoardConfig((prev) => ({
      ...prev,
      status_column_id: statusColumns[0].value,
    }));
  }, [boardConfig.status_column_id, statusColumns]);

  useEffect(() => {
    if (!contextItemId) return;
    setEmitForm((prev) => {
      if (prev.itemId) return prev;
      return { ...prev, itemId: String(contextItemId) };
    });
  }, [contextItemId]);

  useEffect(() => {
    if (activeSection !== "datos" && hasSavedFiscalData) {
      setIsFiscalLocked(true);
    }
    if (activeSection !== "certificados" && hasSavedCertificates) {
      setIsCertificatesLocked(true);
    }
    if (activeSection !== "mapping_v2" && mappingCompleted) {
      setIsMappingLocked(true);
    }
  }, [activeSection, hasSavedFiscalData, hasSavedCertificates, mappingCompleted]);

  const handleFiscalChange = (field, value) => {
    setFiscal((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "crt") setCrtFile(file);
    if (type === "key") setKeyFile(file);
  };

  const handleSaveFiscal = async () => {
    console.log("🚀 Iniciando guardado de datos fiscales...");
    console.log("📦 Contexto actual:", context);
    if (!context || !context.account) return;
    setIsLoading(true);
    try {
      const payload = {
        monday_account_id: context.account.id.toString(),
        board_id: boardId,
        view_id: viewIdFromHref,
        app_feature_id: appFeatureId,
        business_name: fiscal.razonSocial,
        cuit: fiscal.cuit,
        iva_condition: fiscal.condicionIva,
        default_point_of_sale: parseInt(fiscal.puntoVenta) || 0,
        domicilio: fiscal.domicilio,
        fecha_inicio: fiscal.fechaInicio
      };

      const response = await axios.post(`${API_URL}/companies`, payload, { headers: authHeaders });
      alert("¡Éxito! Datos fiscales guardados.");
      setHasSavedFiscalData(true);
      setIsFiscalLocked(true);
      setApiStatus("ok");
      
      monday.execute("notice", {
          message: "Datos fiscales guardados con éxito",
          type: "success",
          duration: 5000
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      const detailed = err.response?.data?.details ? `\n\nDetalle: ${err.response.data.details}` : "";
      alert("Error: " + errorMsg + detailed);

      monday.execute("notice", {
          message: "Error al guardar: " + errorMsg,
          type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCertificates = async () => {
    if (!crtFile || !keyFile || !context) {
        monday.execute("notice", { message: "Por favor, seleccioná ambos archivos (.crt y .key)", type: "error" });
        return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("crt", crtFile);
    formData.append("key", keyFile);
    formData.append("monday_account_id", context.account.id.toString());
    formData.append("board_id", boardId || "");
    formData.append("view_id", viewIdFromHref || "");
    formData.append("app_feature_id", appFeatureId || "");

    try {
        await axios.post(`${API_URL}/certificates`, formData, {
          headers: { "Content-Type": "multipart/form-data", ...authHeaders }
      });
      alert("Certificados subidos correctamente.");
      setHasSavedCertificates(true);
      setIsCertificatesLocked(true);
      setCrtFile(null);
      setKeyFile(null);
      setApiStatus("ok");
      monday.execute("notice", {
          message: "Certificados subidos y encriptados correctamente",
          type: "success",
          duration: 5000
      });
    } catch (err) {
      alert("Error al subir certificados.");
        setApiStatus("error");
        setApiError(err?.response?.data?.error || err?.message || "Error al subir certificados");
      monday.execute("notice", {
          message: "Error al subir certificados. Verificá el servidor backend.",
          type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fiscalFormCompleted =
    Boolean(fiscal.razonSocial?.trim()) &&
    Boolean(fiscal.cuit?.trim()) &&
    Boolean(fiscal.puntoVenta?.toString().trim()) &&
    Boolean(fiscal.fechaInicio) &&
    Boolean(fiscal.domicilio?.trim()) &&
    Boolean(fiscal.condicionIva?.trim());

  const fiscalStatus = hasSavedFiscalData || fiscalFormCompleted ? "complete" : "incomplete";
  const certificateStatus = hasSavedCertificates || (crtFile && keyFile) ? "complete" : "incomplete";
  const mappingStatus = isMappingLocked || mappingCompleted ? "complete" : "incomplete";
  const boardSetupReady = hasSavedFiscalData && hasSavedCertificates && mappingCompleted && allRequiredBoardColumnsReady && hasAutomationConfig;
  const boardSetupStatus = boardSetupReady ? "complete" : "incomplete";

  const sectionStatus = {
    datos: fiscalStatus,
    certificados: certificateStatus,
    mapping_v2: mappingStatus,
    board_setup: boardSetupStatus,
  };

  const getStatusLabel = (status) => {
    if (status === "complete") return "Completo";
    return "Pendiente";
  };

  const handleSaveVisualMapping = async () => {
    const missingFields = requiredMappingFields.filter((field) => !mapping[field]);
    if (missingFields.length > 0) {
      alert("Faltan campos por mapear antes de guardar.");
      return;
    }

    if (!context?.account?.id || !boardId) {
      alert("No se pudo identificar cuenta/tablero para guardar el mapeo.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/mappings`, {
        monday_account_id: context.account.id.toString(),
        board_id: boardId,
        view_id: viewIdFromHref,
        app_feature_id: appFeatureId,
        mapping,
        is_locked: true,
      }, { headers: authHeaders });

      setIsMappingLocked(true);
      monday.execute("notice", {
        message: "Mapeo visual guardado correctamente",
        type: "success",
        duration: 4000,
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || "Error al guardar mapeo visual";
      alert(errorMsg);
      monday.execute("notice", {
        message: errorMsg,
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBoardConfig = async () => {
    if (!context?.account?.id || !boardId) {
      alert("No se pudo identificar cuenta/tablero para guardar la configuración.");
      return;
    }

    if (!allRequiredBoardColumnsReady) {
      alert("Faltan columnas requeridas o hay columnas con tipo incompatible.");
      return;
    }

    if (!boardConfig.status_column_id) {
      alert("Seleccioná la columna de estado que disparará la emisión.");
      return;
    }

    setIsSavingBoardConfig(true);
    try {
      await axios.post(`${API_URL}/board-config`, {
        monday_account_id: context.account.id.toString(),
        board_id: boardId,
        view_id: viewIdFromHref,
        app_feature_id: appFeatureId,
        status_column_id: boardConfig.status_column_id,
        trigger_label: COMPROBANTE_STATUS_FLOW.trigger,
        success_label: COMPROBANTE_STATUS_FLOW.success,
        error_label: COMPROBANTE_STATUS_FLOW.error,
        required_columns: requiredBoardColumnsStatus.map((column) => ({
          key: column.key,
          expected_label: column.label,
          scope: BOARD_ITEM_REQUIRED_COLUMNS.some((itemColumn) => itemColumn.key === column.key) ? "item" : "subitem",
          resolved_column_id: column.foundColumn?.value || null,
          resolved_column_title: column.foundColumn?.label || null,
          resolved_column_type: column.foundColumn?.type || null,
          status: column.status,
        })),
      }, { headers: authHeaders });

      monday.execute("notice", {
        message: "Configuración de tablero guardada",
        type: "success",
        duration: 4000,
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || "Error al guardar configuración de tablero";
      alert(errorMsg);
      monday.execute("notice", {
        message: errorMsg,
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsSavingBoardConfig(false);
    }
  };

  const handleSaveUserApiToken = async () => {
    if (!context?.account?.id) {
      alert("No se pudo identificar la cuenta de monday para guardar token.");
      return;
    }

    if (!userApiToken.trim()) {
      alert("Ingresá un token antes de guardar.");
      return;
    }

    setIsSavingUserApiToken(true);
    try {
      await axios.post(`${API_URL}/user-api-token`, {
        monday_account_id: context.account.id.toString(),
        api_token: userApiToken.trim(),
      }, { headers: authHeaders });

      setHasSavedUserApiToken(true);
      setUserApiToken("");
      monday.execute("notice", {
        message: "Token de usuario guardado correctamente",
        type: "success",
        duration: 4000,
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || "Error al guardar token";
      const errorDetail = err?.response?.data?.details || err?.response?.data?.code || "";
      alert(errorDetail ? `${errorMsg}\n\nDetalle: ${errorDetail}` : errorMsg);
      monday.execute("notice", {
        message: errorDetail ? `${errorMsg} (${errorDetail})` : errorMsg,
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsSavingUserApiToken(false);
    }
  };

  const updateItemStatusInMonday = async (itemId, statusLabel) => {
    if (!boardConfig.status_column_id || !boardId || !itemId) return;

    const statusValueJson = JSON.stringify({ label: statusLabel });
    const statusValueLiteral = JSON.stringify(statusValueJson);

    const mutation = `mutation {
      change_column_value(
        board_id: ${Number(boardId)},
        item_id: ${Number(itemId)},
        column_id: "${boardConfig.status_column_id}",
        value: ${statusValueLiteral}
      ) { id }
    }`;

    await monday.api(mutation);
  };

  const createItemUpdateInMonday = async (itemId, body) => {
    if (!itemId || !body) return;
    const mutation = `mutation {
      create_update(item_id: ${Number(itemId)}, body: ${JSON.stringify(body)}) { id }
    }`;
    await monday.api(mutation);
  };

  const handleEmitFacturaC = async () => {
    if (!context?.account?.id || !boardId) {
      alert("No se pudo identificar cuenta/tablero para emitir factura C.");
      return;
    }

    if (!emitForm.itemId?.trim()) {
      alert("Ingresá el ID del item a emitir.");
      return;
    }

    setIsEmittingFacturaC(true);
    setEmitFacturaCResult(null);
    try {
      const itemQuery = `query {
        boards(ids: [${boardId}]) {
          items(ids: [${emitForm.itemId.trim()}]) {
            id
            name
            column_values {
              id
              text
              value
            }
            subitems {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }`;

      const itemResponse = await monday.api(itemQuery);
      const mondayItem = itemResponse?.data?.boards?.[0]?.items?.[0];
      if (!mondayItem) {
        throw new Error("No se encontró el item en Monday para emitir Factura C");
      }

      try {
        await updateItemStatusInMonday(emitForm.itemId.trim(), COMPROBANTE_STATUS_FLOW.processing);
      } catch (statusErr) {
        console.error("No se pudo setear estado en procesamiento:", statusErr);
      }

      const payload = {
        monday_account_id: context.account.id.toString(),
        board_id: boardId,
        item_id: emitForm.itemId.trim(),
        issue_in_afip: true,
        item_snapshot: {
          id: mondayItem.id,
          name: mondayItem.name,
          main_columns: mondayItem.column_values || [],
          subitems: (mondayItem.subitems || []).map((subitem) => ({
            id: subitem.id,
            name: subitem.name,
            column_values: subitem.column_values || [],
          })),
        },
      };

      const response = await axios.post(`${API_URL}/invoices/emit-c`, payload, {
        headers: authHeaders,
      });

      if (response.data?.pdf_base64) {
        const fileBytes = atob(response.data.pdf_base64);
        const byteNumbers = new Array(fileBytes.length);
        for (let i = 0; i < fileBytes.length; i += 1) {
          byteNumbers[i] = fileBytes.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Factura-C-${emitForm.itemId.trim()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }

      setEmitFacturaCResult({
        ok: true,
        message: response.data?.message || "Factura C procesada",
        detail: JSON.stringify({
          draft: response.data?.draft || null,
          afip_result: response.data?.afip_result || null,
          pdf_generado: Boolean(response.data?.pdf_base64),
          monday_upload: response.data?.monday_upload || null,
        }, null, 2),
      });

      try {
        await updateItemStatusInMonday(emitForm.itemId.trim(), COMPROBANTE_STATUS_FLOW.success);
        const afipResult = response.data?.afip_result;
        if (afipResult?.cae) {
          await createItemUpdateInMonday(
            emitForm.itemId.trim(),
            `Comprobante emitido correctamente. CAE: ${afipResult.cae}. Vencimiento CAE: ${afipResult.cae_vencimiento || "N/D"}. Número: ${afipResult.numero_comprobante || "N/D"}.`
          );
        }
      } catch (statusErr) {
        console.error("No se pudo actualizar estado/nota de éxito en Monday:", statusErr);
      }

      monday.execute("notice", {
        message: response.data?.afip_result?.cae ? "Factura C emitida en AFIP" : "Factura C procesada en backend",
        type: "success",
        duration: 4000,
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || "Error al emitir Factura C";
      const errorDetail = err?.response?.data?.details || "";

      setEmitFacturaCResult({
        ok: false,
        message: errorMsg,
        detail: errorDetail,
      });

      try {
        await updateItemStatusInMonday(emitForm.itemId?.trim(), COMPROBANTE_STATUS_FLOW.error);
        await createItemUpdateInMonday(
          emitForm.itemId?.trim(),
          `Error al emitir comprobante: ${errorMsg}${errorDetail ? `\nDetalle: ${errorDetail}` : ""}`
        );
      } catch (statusErr) {
        console.error("No se pudo actualizar estado/nota de error en Monday:", statusErr);
      }

      monday.execute("notice", {
        message: errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsEmittingFacturaC(false);
    }
  };

  const renderVisualSelect = (fieldId, placeholderText, scope = "board") => {
    const options = scope === "subitem" ? subitemColumns : columns;
    const hasValue = Boolean(mapping[fieldId]);

    return (
    <select
      className={`invoice-preview-select ${hasValue ? "mapped" : "unmapped"} ${isMappingLocked ? "disabled" : ""}`}
      value={mapping[fieldId] || ""}
      onChange={e => setMapping({...mapping, [fieldId]: e.target.value})}
      title={placeholderText}
      disabled={isMappingLocked}
    >
      <option value="">Seleccionar: {placeholderText}</option>
      {options.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
    );
  };

  const getMappedColumnLabel = (fieldId, scope = "board") => {
    const selectedValue = mapping[fieldId];
    if (!selectedValue) return "sin columna seleccionada";
    const options = scope === "subitem" ? subitemColumns : columns;
    const found = options.find((o) => o.value === selectedValue);
    return found?.label || selectedValue;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">FE</div>
          <span className="sidebar-title">Facturación<br/>Electrónica</span>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-content">
                <span>{item.label}</span>
                {sectionStatus[item.id] && (
                  <span className={`status-pill ${sectionStatus[item.id]}`}>
                    {getStatusLabel(sectionStatus[item.id])}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className={`status-dot ${context ? "online" : ""}`} />
            <span className="status-text">
              {context ? "Conectado" : "Sin contexto"}
            </span>
          </div>
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ─── */}
      <main className="main-content">
        <div className={`section-status-banner ${apiStatus === "ok" ? "complete" : apiStatus === "error" ? "incomplete" : "neutral"}`} style={{ marginBottom: "14px" }}>
          {apiStatus === "ok" && (
            <><strong>Backend:</strong> conectado correctamente ({API_URL}).</>
          )}
          {apiStatus === "checking" && (
            <><strong>Backend:</strong> verificando conexión ({API_URL})...</>
          )}
          {apiStatus === "error" && (
            <><strong>Backend:</strong> sin conexión o URL incorrecta ({API_URL}). {apiError}</>
          )}
        </div>

        {isLoading && (
            <div className="loading-overlay">
                <div className="loader"></div>
                <p>Procesando datos de forma segura...</p>
            </div>
        )}

        {/* ═══ SECCIÓN: DATOS FISCALES ═══ */}
        {activeSection === "datos" && (
          <section className="section">
            <div className="section-header">
              <h1 className="section-title">Datos Fiscales</h1>
              <p className="section-subtitle">
                Completá la información de tu empresa para la facturación electrónica.
              </p>
            </div>

            <div className={`section-status-banner ${fiscalStatus}`}>
              {hasSavedFiscalData ? (
                <><strong>Estado:</strong> Datos fiscales ya guardados. Revisalos y actualizalos si cambió algo.</>
              ) : (
                <><strong>Estado:</strong> Faltan completar datos fiscales para continuar.</>
              )}
            </div>

            <fieldset className={`section-fieldset ${isFiscalLocked ? "locked" : ""}`} disabled={isFiscalLocked}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Razón Social</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Mi Empresa S.A."
                  value={fiscal.razonSocial}
                  onChange={(e) => handleFiscalChange("razonSocial", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CUIT</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="20123456789"
                  value={fiscal.cuit}
                  onChange={(e) => handleFiscalChange("cuit", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Punto de Venta</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="1"
                  value={fiscal.puntoVenta}
                  onChange={(e) => handleFiscalChange("puntoVenta", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Inicio de Actividades</label>
                <input
                  className="form-input"
                  type="date"
                  value={fiscal.fechaInicio}
                  onChange={(e) => handleFiscalChange("fechaInicio", e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Domicilio Comercial</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Av. Corrientes 1234, CABA"
                  value={fiscal.domicilio}
                  onChange={(e) => handleFiscalChange("domicilio", e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Condición frente al IVA</label>
                <div className="radio-group">
                  {IVA_OPTIONS.map((option) => (
                    <label key={option} className={`radio-card ${fiscal.condicionIva === option ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="condicionIva"
                        value={option}
                        checked={fiscal.condicionIva === option}
                        onChange={(e) => handleFiscalChange("condicionIva", e.target.value)}
                        hidden
                      />
                      <span className="radio-dot" />
                      <span className="radio-label">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              {hasSavedFiscalData && (
                <button type="button" className="btn-secondary" onClick={() => setIsFiscalLocked((prev) => !prev)}>
                  {isFiscalLocked ? "Modificar" : "Bloquear"}
                </button>
              )}
              <button className="btn-primary" onClick={handleSaveFiscal} disabled={isLoading || isFiscalLocked}>
                {isLoading ? "Guardando..." : "Guardar Datos Fiscales"}
              </button>
            </div>
            </fieldset>

            {isFetchingSavedData && (
              <p className="fetching-text">Cargando datos guardados...</p>
            )}
          </section>
        )}

        {/* ═══ SECCIÓN: CERTIFICADOS ═══ */}
        {activeSection === "certificados" && (
          <section className="section">
            <div className="section-header">
              <h1 className="section-title">Certificados AFIP</h1>
              <p className="section-subtitle">
                Subí tus archivos de certificado y clave privada. Los archivos se encriptarán automáticamente antes de guardarse.
              </p>
            </div>

            <div className={`section-status-banner ${certificateStatus}`}>
              {hasSavedCertificates ? (
                <>
                  <strong>Estado:</strong> Certificados ya cargados.
                  {certificateExpirationDate ? ` Vencimiento informado: ${certificateExpirationDate}.` : ""}
                  {" "}Si querés, podés reemplazarlos con nuevos archivos.
                </>
              ) : (
                <><strong>Estado:</strong> Todavía no hay certificados guardados para esta cuenta.</>
              )}
            </div>

            <div className="cards-row">
              {/* Card CRT */}
              <div className="upload-card">
                <div className="upload-card-header">
                  <h3>Certificado (.crt)</h3>
                  <p>Archivo de certificado público</p>
                </div>
                {isCertificatesLocked && hasSavedCertificates && !crtFile ? (
                  <div className="upload-success">
                    <IconCheck />
                    <span>Archivo .crt subido en sistema</span>
                  </div>
                ) : crtFile ? (
                  <div className="upload-success">
                    <IconCheck />
                    <span>{crtFile.name}</span>
                    <button className="btn-text" onClick={() => setCrtFile(null)}>Cambiar</button>
                  </div>
                ) : (
                  <label className="upload-zone" htmlFor="crt-upload">
                    <IconUpload />
                    <span className="upload-zone-text">Arrastrá o hacé clic para subir</span>
                    <span className="upload-zone-hint">.crt</span>
                    <input
                      id="crt-upload"
                      type="file"
                      accept=".crt"
                      onChange={(e) => handleFileChange(e, "crt")}
                      hidden
                    />
                  </label>
                )}
              </div>

              {/* Card KEY */}
              <div className="upload-card">
                <div className="upload-card-header">
                  <h3>Clave Privada (.key)</h3>
                  <p>Archivo de clave privada</p>
                </div>
                {isCertificatesLocked && hasSavedCertificates && !keyFile ? (
                  <div className="upload-success">
                    <IconCheck />
                    <span>Archivo .key subido en sistema</span>
                  </div>
                ) : keyFile ? (
                  <div className="upload-success">
                    <IconCheck />
                    <span>{keyFile.name}</span>
                    <button className="btn-text" onClick={() => setKeyFile(null)}>Cambiar</button>
                  </div>
                ) : (
                  <label className="upload-zone" htmlFor="key-upload">
                    <IconUpload />
                    <span className="upload-zone-text">Arrastrá o hacé clic para subir</span>
                    <span className="upload-zone-hint">.key</span>
                    <input
                      id="key-upload"
                      type="file"
                      accept=".key"
                      onChange={(e) => handleFileChange(e, "key")}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="form-actions">
                {hasSavedCertificates && (
                  <button type="button" className="btn-secondary" onClick={() => setIsCertificatesLocked((prev) => !prev)}>
                    {isCertificatesLocked ? "Modificar" : "Bloquear"}
                  </button>
                )}
              <button className="btn-primary" onClick={handleUploadCertificates} disabled={isLoading || !crtFile || !keyFile || isCertificatesLocked}>
                    {isLoading ? "Subiendo..." : "Guardar Certificados"}
                </button>
            </div>

            {isCertificatesLocked && hasSavedCertificates && (
              <p className="fetching-text">Los certificados ya estan cargados. Toca "Modificar" para reemplazarlos.</p>
            )}

            <div className="info-box" style={{marginTop: "24px"}}>
              <span className="info-box-icon">🔒</span>
              <span>
                <strong>Seguridad:</strong> Tu clave privada se encripta con algoritmos bancarios antes de salir de tu computadora y nunca se guarda en texto plano.
              </span>
            </div>
          </section>
        )}

        {/* ═══ SECCIÓN: MAPEO VISUAL V2 ═══ */}
        {activeSection === "mapping_v2" && (
          <section className="section" style={{maxWidth: "850px"}}>
            <div className="section-header">
              <h1 className="section-title">Mapeo Visual de Factura</h1>
              <p className="section-subtitle">
                Mapeá las columnas haciendo click directamente en los campos de una factura modelo.
              </p>
            </div>

            <div className={`section-status-banner ${mappingStatus}`}>
              {isMappingLocked ? (
                <><strong>Estado:</strong> Mapeo visual guardado y bloqueado para evitar cambios accidentales. Campos obligatorios mapeados: {mappedRequiredCount}/{requiredMappingFields.length}.</>
              ) : (
                <><strong>Estado:</strong> Configurá el mapeo visual y guardalo para no repetirlo. Campos obligatorios mapeados: {mappedRequiredCount}/{requiredMappingFields.length}.</>
              )}
            </div>

            <div className="invoice-preview-wrapper">
              <div className="invoice-preview-container">
                <div className="original-tag">Original</div>
                
                <div className="header-row">
                    <div className="header-left">
                        <div className="emisor-name">{fiscal.razonSocial || "TU EMPRESA S.A."}</div>
                        <div className="emisor-details">
                            <p className="line"><span className="label">Razón Social:</span> {fiscal.razonSocial || "Tu Empresa S.A."}</p>
                            <p className="line"><span className="label">Domicilio Comercial:</span> {fiscal.domicilio || "-"}</p>
                            <p className="line"><span className="label">Condición frente al IVA:</span> {fiscal.condicionIva}</p>
                        </div>
                    </div>

                    <div className="header-center">
                        <div className="invoice-type-box">
                            <span className="letter">C</span>
                            <span className="code">COD. 011</span>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="factura-title">Factura</div>
                        <div className="line"><span className="label">Punto de Venta:</span> {fiscal.puntoVenta || "0001"} &nbsp;&nbsp; <span className="label">Comp. Nro:</span> 00000001</div>
                        <div className="line"><span className="label">Fecha de Emisión:</span> {renderVisualSelect("fecha_emision", "Fecha Emisión")}</div>
                        <div className="line"><span className="label">CUIT:</span> {fiscal.cuit || "20-12345678-9"}</div>
                        <div className="line"><span className="label">Inicio Actividades:</span> {fiscal.fechaInicio || "-"}</div>
                    </div>
                </div>

                <div className="info-row">
                  <div className="info-line">
                    <div className="info-col-left"><span className="label">CUIT:</span> {renderVisualSelect("receptor_cuit", "CUIT")}</div>
                    <div className="info-col-right"><span className="label">Razón Social:</span> Dato fijo (no mapeable)</div>
                    </div>
                  <div className="info-line">
                    <div className="info-col-left"><span className="label">Condición IVA:</span> Dato fijo (no mapeable)</div>
                    <div className="info-col-right"><span className="label">Domicilio:</span> Dato fijo (no mapeable)</div>
                    </div>
                </div>

                <div className="items-section">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th style={{width: "40%"}}>Producto / Servicio</th>
                                <th style={{width: "15%"}}>Cantidad</th>
                                <th style={{width: "20%"}}>Precio Unit.</th>
                                <th style={{width: "25%"}}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-left">{renderVisualSelect("concepto", "Concepto/Detalle", "subitem")}</td>
                                <td className="text-right">{renderVisualSelect("cantidad", "Cant.", "subitem")}</td>
                                <td className="text-right">{renderVisualSelect("precio_unitario", "Precio", "subitem")}</td>
                              <td className="text-right">Calculado automaticamente: Cantidad x Precio Unit.</td>
                            </tr>
                            <tr style={{height: "80px"}}>
                                <td colSpan="4" style={{borderLeft: "none", borderRight: "none", borderBottom: "none"}}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="totals-section">
                    <table className="totals-table">
                        <tbody>
                            <tr>
                                <td className="label">Importe Total: $</td>
                                <td className="value">
                                  Calculado automaticamente
                                  <div style={{ fontSize: "10px", marginTop: "2px" }}>
                                    Usa la suma de "Cantidad x Precio Unit." por cada subitem.
                                  </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

              </div>
            </div>

            <div className="form-actions" style={{marginTop: "20px"}}>
              <button type="button" className="btn-secondary" onClick={() => setIsMappingLocked((prev) => !prev)}>
                {isMappingLocked ? "Modificar" : "Bloquear"}
              </button>
              <button className="btn-primary" onClick={handleSaveVisualMapping} disabled={isMappingLocked}>
                Guardar Mapeo Visual
              </button>
            </div>
          </section>
        )}

        {/* ═══ SECCIÓN: CONFIGURACIÓN DE TABLERO ═══ */}
        {activeSection === "board_setup" && (
          <section className="section board-setup-section">
            <div className="section-header">
              <h1 className="section-title">Configuración de Tablero</h1>
              <p className="section-subtitle">
                Verificá la estructura mínima del tablero para habilitar emisión automática sin errores.
              </p>
            </div>

            <div className={`section-status-banner ${boardSetupStatus}`}>
              {boardSetupReady ? (
                <><strong>Estado:</strong> Tablero listo para emisión automática.</>
              ) : (
                <><strong>Estado:</strong> Faltan pasos de configuración para habilitar emisión automática.</>
              )}
            </div>

            <div className="board-setup-card board-guide-card">
              <div className="board-guide-header">
                <h3 className="board-setup-card-title">Guía rápida de configuración</h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsGuideModalOpen(true)}
                >
                  Abrir tutorial
                </button>
              </div>
              <ol className="board-guide-list">
                <li>Completá Datos Fiscales y Certificados AFIP.</li>
                <li>En el tablero principal, creá o verificá la columna de subítems.</li>
                <li>En cada subítem (línea de factura), asegurate de tener Concepto, Cantidad y Precio Unitario.</li>
                <li>Volvé al Mapeo Visual y asigná columnas de cabecera (ítem) y líneas (subítem).</li>
                <li>Guardá esta configuración para activar la emisión automática.</li>
              </ol>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Checklist de configuración</h3>
              <ul className="board-setup-checklist">
                <li className={hasSavedFiscalData ? "ok" : "pending"}>Datos fiscales guardados</li>
                <li className={hasSavedCertificates ? "ok" : "pending"}>Certificados AFIP guardados</li>
                <li className={mappingCompleted ? "ok" : "pending"}>Mapeo visual obligatorio completo</li>
                <li className={hasSubitemsStructureReady ? "ok" : "pending"}>Estructura de subítems disponible para líneas</li>
                <li className={allRequiredItemColumnsReady ? "ok" : "pending"}>Columnas de ítem (cabecera) detectadas</li>
                <li className={allRequiredSubitemColumnsReady ? "ok" : "pending"}>Columnas de subítem (líneas) detectadas</li>
                <li className={hasAutomationConfig ? "ok" : "pending"}>Reglas de automatización cargadas</li>
              </ul>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Columnas a nivel ítem (cabecera)</h3>
              <div className="board-columns-table-wrapper">
                <table className="board-columns-table">
                  <thead>
                    <tr>
                      <th>Columna requerida</th>
                      <th>Estado</th>
                      <th>Columna detectada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requiredItemColumnsStatus.map((column) => (
                      <tr key={column.key}>
                        <td>{column.label}</td>
                        <td>
                          {column.status === "ok" && <span className="table-status ok">OK</span>}
                          {column.status === "missing" && <span className="table-status missing">Falta</span>}
                          {column.status === "wrong_type" && <span className="table-status wrong-type">Tipo incompatible</span>}
                        </td>
                        <td>{column.foundColumn ? `${column.foundColumn.label} (${column.foundColumn.type})` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Columnas a nivel subítem (líneas de factura)</h3>
              <p className="board-setup-helper">
                Estas columnas viven en el board de subítems y representan cada línea de la factura.
              </p>
              {!hasSubitemsColumnInBoard && (
                <div className="board-setup-inline-warning">
                  No se detecta columna de subítems en este tablero. Agregá subítems en monday para poder mapear líneas de factura.
                </div>
              )}
              {hasSubitemsColumnInBoard && !hasSubitemsStructureReady && (
                <div className="board-setup-inline-warning">
                  Se detectó la columna de subítems, pero aún no se pudieron leer sus columnas internas. Creá al menos un subítem y recargá.
                </div>
              )}
              <div className="board-columns-table-wrapper">
                <table className="board-columns-table">
                  <thead>
                    <tr>
                      <th>Columna requerida</th>
                      <th>Estado</th>
                      <th>Columna detectada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requiredSubitemColumnsStatus.map((column) => (
                      <tr key={column.key}>
                        <td>{column.label}</td>
                        <td>
                          {column.status === "ok" && <span className="table-status ok">OK</span>}
                          {column.status === "missing" && <span className="table-status missing">Falta</span>}
                          {column.status === "wrong_type" && <span className="table-status wrong-type">Tipo incompatible</span>}
                        </td>
                        <td>{column.foundColumn ? `${column.foundColumn.label} (${column.foundColumn.type})` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Reglas de automatización</h3>
              <p className="board-setup-helper">
                Esta app usa estos 4 estados fijos en la columna de estado para disparar y seguir el proceso.
              </p>
              <div className="board-flow-statuses" role="list" aria-label="Flujo de estados de comprobante">
                <span className="board-flow-pill trigger" role="listitem">{COMPROBANTE_STATUS_FLOW.trigger}</span>
                <span className="board-flow-pill processing" role="listitem">{COMPROBANTE_STATUS_FLOW.processing}</span>
                <span className="board-flow-pill success" role="listitem">{COMPROBANTE_STATUS_FLOW.success}</span>
                <span className="board-flow-pill error" role="listitem">{COMPROBANTE_STATUS_FLOW.error}</span>
              </div>
              <div className="form-grid board-config-grid">
                <div className="form-group full-width">
                  <label className="form-label">Columna de estado que dispara emisión</label>
                  <select
                    className="form-input"
                    value={boardConfig.status_column_id}
                    onChange={(e) => setBoardConfig((prev) => ({ ...prev, status_column_id: e.target.value }))}
                  >
                    <option value="">Seleccionar columna de estado</option>
                    {statusColumns.map((column) => (
                      <option key={column.value} value={column.value}>{column.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleSaveBoardConfig}
                  disabled={isSavingBoardConfig || !allRequiredBoardColumnsReady}
                >
                  {isSavingBoardConfig ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Token API de usuario (para subir PDF automático)</h3>
              <p className="board-setup-helper">
                Guardá tu token personal de monday para que el backend pueda adjuntar el PDF en la columna <strong>Comprobante PDF</strong> sin configurar variables por cliente.
              </p>
              <div className={`section-status-banner ${hasSavedUserApiToken ? "complete" : "incomplete"}`} style={{ marginBottom: "12px" }}>
                {hasSavedUserApiToken
                  ? <><strong>Estado:</strong> Ya hay un token guardado para este usuario.</>
                  : <><strong>Estado:</strong> Falta guardar token para habilitar subida automática del PDF.</>}
              </div>
              <div className="form-grid board-config-grid">
                <div className="form-group full-width">
                  <label className="form-label">Token API de monday</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Ej: eyJ..."
                    value={userApiToken}
                    onChange={(e) => setUserApiToken(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleSaveUserApiToken}
                  disabled={isSavingUserApiToken || !userApiToken.trim()}
                >
                  {isSavingUserApiToken ? "Guardando token..." : "Guardar Token API"}
                </button>
              </div>
            </div>

            {isGuideModalOpen && (
              <div className="setup-guide-modal-overlay" role="dialog" aria-modal="true" aria-label="Tutorial configuración de tablero">
                <div className="setup-guide-modal">
                  <div className="setup-guide-modal-header">
                    <h3>Tutorial: configurar tablero en 2 niveles</h3>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsGuideModalOpen(false)}
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="setup-guide-modal-body">
                    <p>
                      Este flujo separa la factura en dos partes: ítem (cabecera) y subítem (líneas de detalle).
                    </p>

                    <h4>1) Configuración a nivel ítem (cabecera)</h4>
                    <ul>
                      <li>Documento Cliente</li>
                      <li>Tipo Documento</li>
                      <li>Estado Facturación (trigger de automatización)</li>
                    </ul>

                    <h4>2) Configuración a nivel subítem (líneas)</h4>
                    <ul>
                      <li>Concepto o descripción del producto/servicio</li>
                      <li>Cantidad</li>
                      <li>Precio Unitario</li>
                    </ul>

                    <h4>3) Checklist recomendado</h4>
                    <ol>
                      <li>Crear al menos un subítem de prueba en monday.</li>
                      <li>Volver a esta sección y validar que aparezcan columnas de subítem.</li>
                      <li>Completar Mapeo Visual.</li>
                      <li>Definir regla de automatización por estado.</li>
                      <li>Guardar configuración.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══ SECCIÓN: EMITIR FACTURAS ═══ */}
        {activeSection === "invoices" && (
          <section className="section">
            <div className="section-header">
              <h1 className="section-title">Emitir Facturas</h1>
              <p className="section-subtitle">
                MVP inicial: preparación de Factura C directamente desde backend.
              </p>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Flujo de estados para emisión</h3>
              <div className="board-flow-statuses" role="list" aria-label="Flujo de estados de comprobante">
                <span className="board-flow-pill trigger" role="listitem">{COMPROBANTE_STATUS_FLOW.trigger}</span>
                <span className="board-flow-pill processing" role="listitem">{COMPROBANTE_STATUS_FLOW.processing}</span>
                <span className="board-flow-pill success" role="listitem">{COMPROBANTE_STATUS_FLOW.success}</span>
                <span className="board-flow-pill error" role="listitem">{COMPROBANTE_STATUS_FLOW.error}</span>
              </div>
              <p className="board-setup-helper">
                El backend toma el item + subitems y arma el borrador de Factura C para avanzar a autorización AFIP.
              </p>
            </div>

            <div className="board-setup-card">
              <h3 className="board-setup-card-title">Emitir Factura C (manual)</h3>
              <div className="form-grid board-config-grid">
                <div className="form-group">
                  <label className="form-label">Board ID detectado</label>
                  <input className="form-input" type="text" value={boardId || "Sin board detectado"} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">ID del item a emitir</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ej: 1234567890"
                    value={emitForm.itemId}
                    onChange={(e) => setEmitForm((prev) => ({ ...prev, itemId: e.target.value }))}
                  />
                </div>

              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleEmitFacturaC}
                  disabled={isEmittingFacturaC || !boardId}
                >
                  {isEmittingFacturaC ? "Preparando en backend..." : "Preparar Factura C"}
                </button>
              </div>

              {emitFacturaCResult && (
                <div className={`emit-result ${emitFacturaCResult.ok ? "ok" : "error"}`}>
                  <strong>{emitFacturaCResult.ok ? "OK" : "Error"}:</strong> {emitFacturaCResult.message}
                  {emitFacturaCResult.detail && (
                    <pre className="emit-result-detail">{emitFacturaCResult.detail}</pre>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default App;
