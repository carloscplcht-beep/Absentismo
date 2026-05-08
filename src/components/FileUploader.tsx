import { useRef } from "react";
import { FileUp, RefreshCw } from "lucide-react";

type FileUploaderProps = {
  onFile: (file: File) => void;
  loading?: boolean;
  compact?: boolean;
};

export function FileUploader({ onFile, loading = false, compact = false }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`file-uploader ${compact ? "file-uploader--compact" : ""}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
      <button className={compact ? "secondary-button" : "primary-button"} type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? <RefreshCw className="spin" size={18} /> : <FileUp size={18} />}
        {loading ? "Procesando..." : compact ? "Cargar nuevo archivo" : "Cargar archivo Excel"}
      </button>
      {!compact ? <span>.xls y .xlsx · lectura local con SheetJS</span> : null}
    </div>
  );
}
