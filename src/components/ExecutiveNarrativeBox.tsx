import { Brain, ShieldCheck } from "lucide-react";

export function ExecutiveNarrativeBox({ narrative }: { narrative: string }) {
  return (
    <section className="intelligence-hero">
      <div className="intelligence-hero__icon"><Brain size={24} /></div>
      <div>
        <span>Resumen inteligente</span>
        <p>{narrative}</p>
        <div className="privacy-note">
          <ShieldCheck size={16} />
          <span>Los calculos se realizan localmente en el navegador. La aplicacion no envia los datos cargados a ningun servidor.</span>
        </div>
      </div>
    </section>
  );
}
