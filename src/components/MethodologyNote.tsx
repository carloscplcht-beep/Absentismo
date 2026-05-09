export function MethodologyNote({ notes }: { notes: string[] }) {
  return (
    <section className="analysis-panel methodology-note">
      <h3>Nota metodologica</h3>
      <ul>
        {notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </section>
  );
}
