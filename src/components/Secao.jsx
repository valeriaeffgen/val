/*
 * Layout editorial de uma seção (princípio 6: abrir com cena/gesto, não com tese).
 * Mantém o respiro e a largura de leitura consistentes em todo o app.
 */
export default function Secao({ titulo, abertura, children }) {
  return (
    <section style={{ maxWidth: 'var(--largura-leitura)', margin: '0 auto', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <h1>{titulo}</h1>
      {abertura && (
        <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)' }}>
          {abertura}
        </p>
      )}
      <div style={{ marginTop: 'var(--espaco-3)' }}>{children}</div>
    </section>
  );
}

/*
 * Marca uma seção ainda em construção, sem tom de erro nem de promessa.
 * A própria nota respeita a voz: serena, não promocional.
 */
export function EmConstrucao({ nota }) {
  return (
    <div className="card" style={{ color: 'var(--tinta-suave)' }}>
      <p style={{ margin: 0 }}>{nota}</p>
    </div>
  );
}
