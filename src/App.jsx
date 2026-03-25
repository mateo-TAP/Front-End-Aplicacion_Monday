import React, { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import axios from "axios";
import "monday-ui-react-core/tokens";
import "monday-ui-react-core/dist/main.css";
import "./App.css";

const monday = mondaySdk();
// Usamos variable de entorno para la URL del Backend separado
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api";

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
  { id: "invoices", label: "Emitir Facturas", icon: <IconFile /> },
];

const IVA_OPTIONS = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
];

const App = () => {
  const [context, setContext] = useState(null);
  const [activeSection, setActiveSection] = useState("datos");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSavedData, setIsFetchingSavedData] = useState(false);

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
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    monday.listen("context", (res) => {
      console.log("Contexto recibido:", res.data);
      setContext(res.data);
    });
  }, []);

  // Fetch columns when context is ready
  useEffect(() => {
    if (context?.boardId) {
      monday.api(`query { boards(ids: [${context.boardId}]) { columns { id title type } } }`)
        .then(res => {
          if (res.data?.boards?.[0]?.columns) {
            const cols = res.data.boards[0].columns.map(c => ({
              value: c.id,
              label: c.title
            }));
            setColumns(cols);
          }
        });
    }
  }, [context]);

  useEffect(() => {
    const fetchSavedSetup = async () => {
      if (!context?.account?.id) return;

      setIsFetchingSavedData(true);
      try {
        const response = await axios.get(`${API_URL}/setup/${context.account.id}`);
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
        }

        if (data?.hasCertificates) {
          setHasSavedCertificates(true);
          setCertificateExpirationDate(
            data?.certificates?.expiration_date
              ? new Date(data.certificates.expiration_date).toLocaleDateString("es-AR")
              : ""
          );
        }
      } catch (err) {
        console.error("No se pudieron recuperar datos guardados:", err);
      } finally {
        setIsFetchingSavedData(false);
      }
    };

    fetchSavedSetup();
  }, [context]);

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
        business_name: fiscal.razonSocial,
        cuit: fiscal.cuit,
        iva_condition: fiscal.condicionIva,
        default_point_of_sale: parseInt(fiscal.puntoVenta) || 0,
        domicilio: fiscal.domicilio,
        fecha_inicio: fiscal.fechaInicio
      };

      const response = await axios.post(`${API_URL}/companies`, payload);
      alert("¡Éxito! Datos fiscales guardados.");
      setHasSavedFiscalData(true);
      
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

    try {
      await axios.post(`${API_URL}/certificates`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Certificados subidos correctamente.");
        setHasSavedCertificates(true);
      monday.execute("notice", {
          message: "Certificados subidos y encriptados correctamente",
          type: "success",
          duration: 5000
      });
    } catch (err) {
      alert("Error al subir certificados.");
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

  const sectionStatus = {
    datos: fiscalStatus,
    certificados: certificateStatus,
  };

  const getStatusLabel = (status) => {
    if (status === "complete") return "Completo";
    return "Pendiente";
  };

  const renderVisualSelect = (fieldId, placeholderText) => (
    <select
      className="invoice-preview-select"
      value={mapping[fieldId] || ""}
      onChange={e => setMapping({...mapping, [fieldId]: e.target.value})}
      title={placeholderText}
    >
      <option value="">⚙️ Map: {placeholderText}</option>
      {columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
  );

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
              <button className="btn-primary" onClick={handleSaveFiscal} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Datos Fiscales"}
              </button>
            </div>

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
                {crtFile ? (
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
                {keyFile ? (
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
                <button className="btn-primary" onClick={handleUploadCertificates} disabled={isLoading || !crtFile || !keyFile}>
                    {isLoading ? "Subiendo..." : "Guardar Certificados"}
                </button>
            </div>

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
                        <div className="line"><span className="label">Fecha de Emisión:</span> Hoy</div>
                        <div className="line"><span className="label">CUIT:</span> {fiscal.cuit || "20-12345678-9"}</div>
                        <div className="line"><span className="label">Inicio Actividades:</span> {fiscal.fechaInicio || "-"}</div>
                    </div>
                </div>

                <div className="info-row">
                    <div style={{display: "flex", marginBottom: "4px"}}>
                        <div style={{width: "42%"}}><span className="label">CUIT:</span> {renderVisualSelect("receptor_cuit", "CUIT")}</div>
                        <div style={{flex: 1}}><span className="label">Razón Social:</span> {renderVisualSelect("receptor_razon_social", "Razón Social")}</div>
                    </div>
                    <div style={{display: "flex", marginBottom: "4px"}}>
                        <div style={{width: "42%"}}><span className="label">Condición IVA:</span> {renderVisualSelect("receptor_condicion_frente_iva", "Cond. IVA")}</div>
                        <div style={{flex: 1}}><span className="label">Domicilio:</span> {renderVisualSelect("receptor_domicilio", "Domicilio Cliente")}</div>
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
                                <td className="text-left">{renderVisualSelect("concepto", "Concepto/Detalle")}</td>
                                <td className="text-right">{renderVisualSelect("cantidad", "Cant.")}</td>
                                <td className="text-right">{renderVisualSelect("precio_unitario", "Precio")}</td>
                                <td className="text-right">{renderVisualSelect("subtotal", "Subtotal")}</td>
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
                                <td className="value">{renderVisualSelect("subtotal", "Total Final")}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

              </div>
            </div>

            <div className="form-actions" style={{marginTop: "20px"}}>
              <button className="btn-primary" onClick={() => alert("Mapeo visual guardado exitosamente!")}>
                Guardar Mapeo Visual
              </button>
            </div>
          </section>
        )}

        {/* ═══ SECCIÓN: EMITIR FACTURAS ═══ */}
        {activeSection === "invoices" && (
          <section className="section">
            <div className="section-header">
              <h1 className="section-title">Emitir Facturas</h1>
              <p className="section-subtitle">
                Lista de elementos pendientes listos para emitir facturas en AFIP.
              </p>
            </div>

            <div className="empty-state">
              <IconFile className="empty-state-icon" style={{width: 48, height: 48, color: '#b0b0b0', marginBottom: 16}} />
              <h3>Aún estamos preparando esto</h3>
              <p>Pronto podrás ver tu lista de facturas pendientes de emitir directamente aquí, utilizando el mapeo configurado previamente.</p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default App;
