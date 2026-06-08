import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { useColecao } from '../lib/useColecao';

/*
 * Cartas (seção 8) — a parte humana. A mulher escreve; quem responde é a
 * Valéria, nunca a IA. Toque humano ocasional e precioso, não suporte que
 * sufoca: não precisa responder rápido nem estar sempre aberto.
 *
 * Grava em `cartas` sob a RLS dela. A resposta aparece aqui quando a Valéria
 * escrever (pela caixa de entrada, em /?caixa).
 */
function formatDia(day) {
  if (!day) return '';
  const hoje = new Date().toISOString().slice(0, 10);
  if (day === hoje) return 'hoje';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export default function Cartas() {
  const cartas = useColecao('cartas');
  const [texto, setTexto] = useState('');
  const [enviada, setEnviada] = useState(false);

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    db.adicionar('cartas', { texto: t, status: 'enviada' }).catch(() => {});
    setTexto('');
    setEnviada(true);
  }

  return (
    <Secao titulo="Cartas" abertura="me escreva como quem escreve a uma amiga, eu respondo, de pessoa pra pessoa">
      <div className="card" style={{ background: 'var(--ambar-suave)', borderColor: 'rgba(201,162,75,0.35)', color: 'var(--tinta-suave)', marginBottom: 'var(--espaco-3)' }}>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Aqui não tem robô fingindo ser gente. Você escreve, e quem responde sou eu, no meu tempo, com cuidado. É a parte mais humana do santuário, e a que mais me importa.
        </p>
      </div>

      <div className="card" style={{ borderTop: '3px solid var(--ambar)', marginBottom: 'var(--espaco-4)' }}>
        {!enviada ? (
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              placeholder={'Querida Valéria,\n\nhoje eu queria te contar que...'}
              style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)', lineHeight: 1.6 }}
            />
            <div>
              <button className="botao" onClick={enviar} disabled={!texto.trim()}>Enviar carta</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--espaco-2) 0' }}>
            <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', margin: 0 }}>Sua carta chegou até mim.</p>
            <p style={{ color: 'var(--tinta-suave)', marginTop: 6 }}>Vou responder com calma. Volte para ler quando eu escrever.</p>
            <button className="botao-suave" onClick={() => setEnviada(false)} style={{ marginTop: 'var(--espaco-2)' }}>escrever outra</button>
          </div>
        )}
      </div>

      {cartas.length > 0 && (
        <section style={{ marginBottom: 'var(--espaco-4)' }}>
          <h3 style={{ fontStyle: 'italic' }}>Nossas cartas</h3>
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            {cartas.map((c) => (
              <div key={c.id} className="card">
                <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--corpo-pequeno)', color: 'var(--tinta-suave)', marginBottom: 6 }}>
                  você · {formatDia(c.day)}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{c.texto}</div>

                <div style={{ marginTop: 'var(--espaco-2)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)' }}>
                  {c.resposta ? (
                    <>
                      <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--corpo-pequeno)', color: 'var(--ambar)', marginBottom: 6 }}>
                        Valéria respondeu
                      </div>
                      <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--verde-petroleo)', whiteSpace: 'pre-wrap' }}>
                        {c.resposta}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--corpo-pequeno)', color: 'var(--ambar)' }}>
                      aguardando a resposta da Valéria...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exemplo de como será uma troca (do protótipo) */}
      <section>
        <h3 style={{ fontSize: '1rem', color: 'var(--tinta-suave)', fontStyle: 'italic' }}>exemplo de como será uma troca</h3>
        <div className="card" style={{ border: '1px dashed var(--linha)', opacity: 0.95 }}>
          <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--corpo-pequeno)', color: 'var(--tinta-suave)', marginBottom: 5 }}>ela escreveu</div>
          <div style={{ lineHeight: 1.55, marginBottom: 'var(--espaco-2)' }}>
            "Sinto que faço tanto e nunca é suficiente. Estou exausta de provar meu valor o tempo todo."
          </div>
          <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--corpo-pequeno)', color: 'var(--ambar)', marginBottom: 5 }}>Valéria respondeu</div>
          <div style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--verde-petroleo)' }}>
            "Repara numa coisa: você não está cansada de fazer. Está cansada de provar. São coisas diferentes. Quem precisa provar acha que o valor está do lado de fora, à espera de aprovação. Mas o seu já está aqui, comigo lendo, inteiro, antes de qualquer entrega..."
          </div>
        </div>
      </section>
    </Secao>
  );
}
