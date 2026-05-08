import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { GAICR_LOGO, SESCAM_LOGO } from "../utils/brandAssets";

type EmptyStateProps = {
  onPick: () => void;
};

export function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-state__logos">
        <img src={SESCAM_LOGO} alt="SESCAM" />
        <img src={GAICR_LOGO} alt="Gerencia Atención Integrada Ciudad Real" />
      </div>
      <div className="empty-state__content">
        <FileSpreadsheet size={42} />
        <h2>Cargue el Excel para iniciar el análisis</h2>
        <p>
          El procesamiento se realiza localmente en el navegador. No hay backend, no se suben datos y los DNI quedan
          ocultos por defecto.
        </p>
        <button className="primary-button" type="button" onClick={onPick}>
          Seleccionar RH_Cobertura_Ausencias.xls
        </button>
        <div className="privacy-note">
          <ShieldCheck size={16} />
          <span>Este análisis se ejecuta localmente en el navegador. Los datos no se envían a ningún servidor.</span>
        </div>
      </div>
    </section>
  );
}
