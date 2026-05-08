import { AlertTriangle } from "lucide-react";

export function ErrorPanel({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <section className="error-panel">
      <AlertTriangle size={20} />
      <div>
        <strong>Avisos de validación</strong>
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
