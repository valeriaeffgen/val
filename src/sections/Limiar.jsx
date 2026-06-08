import { useState } from 'react';
import { ESTADOS_CHEGADA } from '../data/seed';
import { db } from '../lib/db';

/*
 * Limiar (chegada) — o ritual de entrada (seção 6).
 * "Como você chega?" → pesada / agitada / neutra / elevada.
 * Aparecer já é a vitória (princípio 1): nenhum estado é penalizado.
 *
 * Pesada recebe uma palavra do banco dela (seção 6): num dia difícil, a Val
 * devolve algo que a própria mulher escreveu num dia de clareza.
 */
export default function Limiar({ onChegada }) {
  const [acolhimento, setAcolhimento] = useState(null); // { estado, palavra }

  async function escolher(estado) {
    if (estado.id === 'pesada') {
      const palavras = await db.listar('palavras').catch(() => []);
      const colhida = palavras.length
        ? palavras[Math.floor(Math.random() * palavras.length)].text
        : null;
      setAcolhimento({ estado, palavra: colhida });
    } else {
      onChegada(estado);
    }
  }

  if (acolhimento) {
    return (
      <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
        <div style={{ textAlign: 'center', maxWidth: '46ch' }}>
          <div className="card-escuro">
            {acolhimento.palavra ? (
              <>
                <p style={{ color: 'var(--sobre-escuro-suave)', margin: '0 0 var(--espaco-2)', fontSize: 'var(--corpo-pequeno)' }}>
                  De um dia em que você se viu com clareza:
                </p>
                <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', margin: 0, lineHeight: 1.35 }}>
                  {acolhimento.palavra}
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--sobre-escuro)' }}>
                Dia pesado também é dia. Você chegou — fica o tempo que precisar.
              </p>
            )}
          </div>
          <button className="botao-suave" onClick={() => onChegada(acolhimento.estado)} style={{ marginTop: 'var(--espaco-3)' }}>
            seguir
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ textAlign: 'center', maxWidth: '46ch' }}>
        <p className="assinatura" style={{ fontSize: '3rem', marginBottom: 'var(--espaco-3)' }}>
          Val<span className="ponto">.</span>
        </p>
        <h1 style={{ fontStyle: 'italic' }}>Como você chega?</h1>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--espaco-3)' }}>
          {ESTADOS_CHEGADA.map((estado) => (
            <button key={estado.id} className="botao-suave" onClick={() => escolher(estado)}>
              {estado.rotulo}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-3)', fontSize: 'var(--corpo-pequeno)' }}>
          Não tem chegada errada. Você chegou — isso já basta.
        </p>
      </div>
    </section>
  );
}
