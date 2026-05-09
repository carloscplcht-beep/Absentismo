import type { ReactNode } from "react";
import { Activity, BarChart3, BriefcaseMedical, ClipboardList, FileText, Layers3, LineChart, Sparkles, Table2 } from "lucide-react";
import type { ParsedWorkbook } from "../types/data";
import { GAICR_LOGO, SESCAM_LOGO } from "../utils/brandAssets";
import { FileUploader } from "./FileUploader";

export const tabs = [
  { id: "resumen", label: "Resumen ejecutivo", icon: Activity },
  { id: "inteligencia", label: "Inteligencia gestora", icon: Sparkles },
  { id: "absentismo", label: "Análisis de absentismo", icon: LineChart },
  { id: "cobertura", label: "Cobertura y sustitución", icon: BriefcaseMedical },
  { id: "costes", label: "Costes", icon: BarChart3 },
  { id: "categorias", label: "Categorías profesionales", icon: Layers3 },
  { id: "ambitos", label: "Ámbitos / unidades", icon: ClipboardList },
  { id: "detalle", label: "Detalle de registros", icon: Table2 },
  { id: "informe", label: "Informe", icon: FileText }
] as const;

type DashboardLayoutProps = {
  parsed: ParsedWorkbook | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFile: (file: File) => void;
  loading: boolean;
  children: ReactNode;
  filterSummary: string;
};

export function DashboardLayout({ parsed, activeTab, onTabChange, onFile, loading, children, filterSummary }: DashboardLayoutProps) {
  return (
    <div className="app-shell">
      <header className="executive-header">
        <div className="brand-strip">
          <img src={SESCAM_LOGO} alt="SESCAM" />
          <img src={GAICR_LOGO} alt="Gerencia Atención Integrada Ciudad Real" />
        </div>
        <div className="executive-header__main">
          <div>
            <h1>Cuadro de mando de absentismo y cobertura de ausencias</h1>
            <p>Análisis ejecutivo de ausencias, sustituciones y coste</p>
          </div>
          <FileUploader onFile={onFile} loading={loading} compact={Boolean(parsed)} />
        </div>
        <div className="metadata-grid">
          <div>
            <span>Periodo contemplado</span>
            <strong>{parsed?.metadata.periodo || "Pendiente de carga"}</strong>
          </div>
          <div>
            <span>Gerencia</span>
            <strong>{parsed?.metadata.gerencia || "Pendiente de carga"}</strong>
          </div>
          <div>
            <span>Fecha/hora de datos</span>
            <strong>{parsed?.metadata.detectedAt || (parsed ? new Date(parsed.metadata.loadedAt).toLocaleString("es-ES") : "Pendiente")}</strong>
          </div>
          <div>
            <span>Última nómina cerrada</span>
            <strong>{parsed?.metadata.ultimaNominaCerrada || "No detectada"}</strong>
          </div>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="Navegación principal">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} type="button" className={activeTab === tab.id ? "is-active" : ""} onClick={() => onTabChange(tab.id)}>
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="filter-summary">{filterSummary}</div>
      {children}
    </div>
  );
}
