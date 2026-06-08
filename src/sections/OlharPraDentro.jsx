import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { useColecao } from '../lib/useColecao';
import { JORNADAS } from '../data/seed';
import { espelhoDaJornada } from '../lib/val';

/*
 * Olhar pra dentro (seção 6) — jornadas de autoconhecimento.
 * Perguntas, uma por vez, e ao fim a devolutiva ("seu espelho") gerada na voz
 * da Val a partir das respostas concretas dela, puxando pro autoamor (seção 7).
 * A jornada concluída é gravada em `jornadas`.
 */
export default function OlharPraDentro() {
  const [jornada, setJornada] = useState(null);
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState([]);
  const [texto, setTexto] = useState('');
  const [fase, setFase] = useState('lista'); // lista | perguntas | gerando | espelho | erro
  const [devolutiva, setDevolutiva] = useState('');
  const [erro, setErro] = useState('');

  const passados = useColecao('jornadas');

  function iniciar(j) {
    setJornada(j);
    setIdx(0);
    setRespostas([]);
    setTexto('');
    setDevolutiva('');
    setErro('');
    setFase('perguntas');
  }

  function voltarLista() {
    setFase('lista');
    setJornada(null);
    setIdx(0);
    setRespostas([]);
    setTexto('');
  }

  async function proxima(e) {
    e.preventDefault();
    const r = texto.trim();
    if (!r) return;
    const todas = [...respostas, r];
    setRespostas(todas);
    setTexto('');
    if (idx + 1 < jornada.perguntas.length) {
      setIdx(idx + 1);
    } else {
      await gerar(todas);
    }
  }

  async function gerar(todas) {
    setFase('gerando');
    try {
      const d = await espelhoDaJornada({
        jornadaId: jornada.id,
        titulo: jornada.titulo,
        perguntas: jornada.perguntas,
        respostas: todas,
      });
      setDevolutiva(d);
      setFase('espelho');
      db.adicionar('jornadas', { jornadaId: jornada.id, titulo: jornada.titulo, respostas: todas, devolutiva: d }).catch(() => {});
    } catch (err) {
      // Nada se perde: guarda as respostas mesmo sem o espelho.
      db.adicionar('jornadas', { jornadaId: jornada.id, titulo: jornada.titulo, respostas: todas, devolutiva: '' }).catch(() => {});
      setErro(
        err?.message === 'sem-backend'
          ? 'O espelho precisa do backend ligado para ser gerado. Suas respostas ficam guardadas com você.'
          : 'O espelho não veio agora. Respira, ele volta.'
      );
      setFase('erro');
    }
  }

  // --- Fases ---
  if (fase === 'perguntas') {
    const pergunta = jornada.perguntas[idx];
    const ultima = idx + 1 === jornada.perguntas.length;
    return (
      <Secao titulo={jornada.titulo} abertura="Sem pressa. Uma pergunta de cada vez.">
        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 0 }}>
          {idx + 1} de {jornada.perguntas.length}
        </p>
        <form onSubmit={proxima} className="card" style={{ display: 'grid', gap: 'var(--espaco-2)', marginTop: 'var(--espaco-2)' }}>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', margin: 0 }}>
            {pergunta}
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder="Pode escrever do jeito que vier."
            autoFocus
            style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)' }}
          />
          <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
            <button type="submit" className="botao" disabled={!texto.trim()}>
              {ultima ? 'ver meu espelho' : 'próxima'}
            </button>
            <button type="button" className="botao-suave" onClick={voltarLista}>sair</button>
          </div>
        </form>
      </Secao>
    );
  }

  if (fase === 'gerando') {
    return (
      <Secao titulo={jornada.titulo} abertura="">
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)' }}>
          A Val está olhando com você…
        </p>
      </Secao>
    );
  }

  if (fase === 'espelho') {
    return (
      <Secao titulo="Seu espelho" abertura="">
        <div className="card">
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', lineHeight: 1.5, margin: 0 }}>
            {devolutiva}
          </p>
        </div>
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <button className="botao-suave" onClick={voltarLista}>voltar</button>
        </div>
      </Secao>
    );
  }

  if (fase === 'erro') {
    return (
      <Secao titulo={jornada.titulo} abertura="">
        <div className="card" style={{ color: 'var(--tinta-suave)' }}>
          <p style={{ margin: 0 }}>{erro}</p>
        </div>
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <button className="botao-suave" onClick={voltarLista}>voltar</button>
        </div>
      </Secao>
    );
  }

  // --- Lista ---
  const espelhos = passados.filter((p) => p.devolutiva);
  return (
    <Secao titulo="Olhar pra dentro" abertura="Sem pressa. Algumas perguntas, e um espelho ao fim.">
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {JORNADAS.map((j) => (
          <button
            key={j.id}
            className="card"
            onClick={() => iniciar(j)}
            style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--papel-branco)' }}
          >
            <h3 style={{ margin: 0 }}>{j.titulo}</h3>
            <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
              {j.perguntas.length} perguntas, e o seu espelho ao fim.
            </p>
          </button>
        ))}
      </div>

      {espelhos.length > 0 && (
        <div style={{ marginTop: 'var(--espaco-4)' }}>
          <h3 style={{ fontStyle: 'italic' }}>Seus espelhos</h3>
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            {espelhos.map((p) => (
              <div key={p.id} className="card">
                <p style={{ margin: '0 0 6px', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{p.titulo}</p>
                <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{p.devolutiva}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Secao>
  );
}
