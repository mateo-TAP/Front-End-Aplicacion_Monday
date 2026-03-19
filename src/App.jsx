import React, { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import axios from "axios";
import "monday-ui-react-core/tokens";
import "monday-ui-react-core/dist/main.css";
import "./App.css";

const monday = mondaySdk();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const INVOICE_FIELDS = [
  { id: "receptor_cuit", label: "CUIT del Cliente" },
  { id: "receptor_razon_social", label: "Razón Social Cliente" },
  { id: "receptor_domicilio", label: "Domicilio del Cliente" },
  { id: "concepto", label: "Concepto / Descripción" },
  { id: "cantidad", label: "Cantidad" },
  { id: "precio_unitario", label: "Precio Unitario" },
  { id: "subtotal", label: "Total Factura" }
];

const App = () => {
  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState("fiscal");
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [fiscal, setFiscal] = useState({
    businessName: "",
    cuit: "",
    ivaCondition: "Responsable Inscripto",
    pos: "1",
    domicilio: "",
    fechaInicio: ""
  });

  const [files, setFiles] = useState({ crt: null, key: null });

  useEffect(() => {
    monday.listen("context", (res) => {
      setContext(res.data);
    });
  }, []);

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

  const handleFiscalChange = (field, value) => {
    setFiscal(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFiscal = async () => {
    if (!context?.account) return;
    setLoading(true);
    try {
      const payload = {
        monday_account_id: context.account.id.toString(),
        business_name: fiscal.businessName,
        cuit: fiscal.cuit,
        iva_condition: fiscal.ivaCondition,
        default_point_of_sale: parseInt(fiscal.pos),
        domicilio: fiscal.domicilio,
        fecha_inicio: fiscal.fechaInicio
      };
      await axios.post(`${BACKEND_URL}/companies`, payload);
      alert("¡Éxito! Datos fiscales guardados.");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificates = async () => {
    if (!files.crt || !files.key || !context) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("crt", files.crt);
    formData.append("key", files.key);
    formData.append("monday_account_id", context.account.id.toString());
    try {
      await axios.post(`${BACKEND_URL}/certificates`, formData);
      alert("Certificados subidos correctamente.");
    } catch (err) {
      alert("Error al subir certificados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Facturación AFIP</h2>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === "fiscal" ? "active" : ""}`} onClick={() => setActiveTab("fiscal")}>
             Configuración Fiscal
          </div>
          <div className={`nav-item ${activeTab === "certs" ? "active" : ""}`} onClick={() => setActiveTab("certs")}>
             Certificados AFIP
          </div>
          <div className={`nav-item ${activeTab === "mapping" ? "active" : ""}`} onClick={() => setActiveTab("mapping")}>
             Mapeo de Columnas
          </div>
          <div className={`nav-item ${activeTab === "invoices" ? "active" : ""}`} onClick={() => setActiveTab("invoices")}>
             Emitir Facturas
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === "fiscal" && (
          <div className="section">
            <h1>Datos de la Empresa</h1>
            <div className="form-grid">
              <div className="field-group">
                <label>Razón Social</label>
                <input type="text" value={fiscal.businessName} onChange={e => handleFiscalChange("businessName", e.target.value)} />
              </div>
              <div className="field-group">
                <label>CUIT</label>
                <input type="text" value={fiscal.cuit} onChange={e => handleFiscalChange("cuit", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Condición IVA</label>
                <select value={fiscal.ivaCondition} onChange={e => handleFiscalChange("ivaCondition", e.target.value)}>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributista">Monotributista</option>
                </select>
              </div>
              <div className="field-group">
                <label>Domicilio</label>
                <input type="text" value={fiscal.domicilio} onChange={e => handleFiscalChange("domicilio", e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleSaveFiscal}>{loading ? "Cargando..." : "Guardar Datos"}</button>
          </div>
        )}

        {activeTab === "certs" && (
          <div className="section">
            <h1>Certificados AFIP</h1>
            <div className="upload-container">
              <div className="upload-card">
                <label>Certificado (.crt)</label>
                <input type="file" accept=".crt" onChange={e => setFiles(f => ({ ...f, crt: e.target.files[0] }))} />
              </div>
              <div className="upload-card">
                <label>Clave Privada (.key)</label>
                <input type="file" accept=".key" onChange={e => setFiles(f => ({ ...f, key: e.target.files[0] }))} />
              </div>
              <button className="btn-primary" onClick={handleUploadCertificates} disabled={!files.crt || !files.key}>
                {loading ? "Subiendo..." : "Subir Certificados"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "mapping" && (
          <div className="section">
            <h1>Mapeo de Columnas</h1>
            <p className="subtitle">Asocia las columnas de tu tablero con los campos de la factura.</p>
            <div className="mapping-list">
              {INVOICE_FIELDS.map(field => (
                <div key={field.id} className="mapping-row">
                  <span className="mapping-label">{field.label}</span>
                  <select 
                    className="mapping-select"
                    value={mapping[field.id] || ""} 
                    onChange={e => setMapping({...mapping, [field.id]: e.target.value})}
                  >
                    <option value="">Seleccionar columna...</option>
                    {columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => alert("Mapeo guardado localmente")}>Guardar Mapeo</button>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="section">
            <h1>Emitir Facturas</h1>
            <div className="empty-state">
              <p>Próximamente: Lista de elementos facturables basados en tu mapeo.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
