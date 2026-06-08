import { useState } from 'react';

/*
 * Painel de chegada por estado (do protótipo). Depois do Limiar, a Val adapta a
 * resposta ao estado: pesada recebe colo, elevadores e uma palavra do banco;
 * agitada recebe chão; neutra um convite suave; elevada é convidada a ancorar a
 * fórmula. Conteúdo (frase, sub, elevadores, palavra, ações) vem pronto do App.
 */
export default function Chegada({ resposta, onAcao, onAncorar }) {
  const [elev, setElev] = useState('');
  if (!resposta) return null;

  return (
    <section style={{ maxWidth: 'var(--largura-leitura)', margin: '0 auto', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <h1 style={{ fontStyle: 'italic' }}>{resposta.frase}</h1>
      <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)' }}>
        {resposta.sub}
      </p>

      {/* Uma palavra do banco dela (pesada) */}
      {resposta.palavra && (
        <div className="card-escuro" style={{ marginTop: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--sobre-escuro-suave)', margin: '0 0 var(--espaco-1)', fontSize: 'var(--corpo-pequeno)' }}>
            De um dia em que você se viu com clareza:
          </p>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', margin: 0 }}>{resposta.palavra}</p>
        </div>
      )}

      {/* Elevadores dela (pesada: 2, neutra: 1) */}
      {resposta.elevadores?.length > 0 && (
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-1)' }}>
            O que costuma te erguer:
          </p>
          <ul style={{ paddingLeft: '1.1em', margin: 0 }}>
            {resposta.elevadores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Ancorar a fórmula (elevada) */}
      {resposta.ancorar && (
        <form
          onSubmit={(ev) => { ev.preventDefault(); if (elev.trim()) { onAncorar(elev.trim()); setElev(''); } }}
          className="card"
          style={{ display: 'grid', gap: 'var(--espaco-2)', marginTop: 'var(--espaco-3)' }}
        >
          <p style={{ margin: 0, color: 'var(--tinta-suave)' }}>O que te trouxe até aqui? Guarde como um elevador, pra repetir.</p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
            <input
              value={elev}
              onChange={(e) => setElev(e.target.value)}
              placeholder="O que me elevou hoje…"
              style={{ flex: 1, border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
            />
            <button type="submit" className="botao-suave">ancorar</button>
          </div>
        </form>
      )}

      {/* Ações adaptadas ao estado */}
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-4)' }}>
        {resposta.acoes.map((a, i) => (
          <button key={i} className={i === 0 ? 'botao' : 'botao-suave'} onClick={() => onAcao(a)}>
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}
