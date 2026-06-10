import { useState, useRef, useEffect } from 'react';
import { acolherComVal } from '../lib/val';
import { db } from '../lib/db';

/*
 * Boas-vindas — a primeira visita (seções 1, 2, 6, 7). A primeira impressão da
 * Val no mundo.
 *
 * Em vez de jogar a mulher num formulário (Meu Centro vazio) ou num app que não
 * a conhece, a Val se apresenta com calor e CONVERSA: convida, com leveza, a
 * contar duas ou três coisas de si. A partir da conversa, a própria Val planta
 * isso no Meu Centro (sob a RLS dela).
 *
 * Nunca um muro: tudo é opcional e adiável. "Agora não" e "deixar pra depois"
 * estão sempre à mão, e levam direto pro app (princípio: nada de cobrança).
 */

// A abertura da conversa é fixa, na voz da Val: instantânea, sem espera de API e
// sem risco de a primeira frase sair fora do tom. A partir da resposta dela, a
// função `acolher` assume.
const ABERTURA = 'Me conta uma coisa que você construiu ou viveu e que te dá orgulho, mesmo que pareça pequena pra você.';

const CAMPOS = ['valores', 'conquistas', 'foco', 'elevadores'];

export default function BoasVindas({ onConcluir }) {
  const [fase, setFase] = useState('intro'); // intro | conversa
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState(null);
  const [fechou, setFechou] = useState(false);
  const [guardou, setGuardou] = useState(false);
  const fim = useRef(null);
  const perfilRef = useRef({ valores: [], conquistas: [], foco: [], elevadores: [] });

  // Carrega o que já existir no perfil, para a Val só acrescentar (sem duplicar).
  useEffect(() => {
    db.perfil().then((p) => {
      for (const c of CAMPOS) perfilRef.current[c] = Array.isArray(p?.[c]) ? [...p[c]] : [];
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, pensando]);

  function comecar() {
    setFase('conversa');
    setMensagens([{ role: 'assistant', text: ABERTURA }]);
  }

  // Planta no Meu Centro só o que é novo, com as palavras dela, sem duplicar.
  async function plantar(planta) {
    if (!planta) return;
    const parcial = {};
    let mudou = false;
    for (const c of CAMPOS) {
      const novos = (Array.isArray(planta[c]) ? planta[c] : []).map((s) => String(s).trim()).filter(Boolean);
      const atual = perfilRef.current[c] || [];
      const uniao = [...atual];
      for (const n of novos) {
        if (!uniao.some((x) => x.toLowerCase() === n.toLowerCase())) uniao.push(n);
      }
      if (uniao.length !== atual.length) {
        parcial[c] = uniao;
        perfilRef.current[c] = uniao;
        mudou = true;
      }
    }
    if (mudou) {
      await db.salvarPerfil(parcial).catch(() => {});
      setGuardou(true);
    }
  }

  async function enviar(e) {
    e?.preventDefault?.();
    const t = texto.trim();
    if (!t || pensando) return;
    const novas = [...mensagens, { role: 'user', text: t }];
    setMensagens(novas);
    setTexto('');
    setErro(null);
    setPensando(true);
    try {
      const { texto: fala, planta } = await acolherComVal(novas);
      await plantar(planta);
      setMensagens([...novas, { role: 'assistant', text: fala }]);
      // Sinal de fim, robusto e independente do flag do modelo: enquanto a Val
      // faz uma pergunta, a conversa segue (input aberto). Quando ela para de
      // perguntar, chegou a um fim natural, fechamos (só resta Entrar).
      const temPergunta = /\?\s*["')]?\s*$/.test((fala || '').trim());
      setFechou(!temPergunta);
    } catch (err) {
      // Sem inventar: uma frase sóbria, e a porta de seguir pro app continua aberta.
      setErro('Não consegui responder agora. Podemos seguir, e a gente se conhece com calma depois.');
      setFechou(true);
    } finally {
      setPensando(false);
    }
  }

  // ---- Tela de apresentação ----
  if (fase === 'intro') {
    return (
      <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <p className="assinatura" style={{ fontSize: '3.4rem', margin: 0 }}>
            Val<span className="ponto">.</span>
          </p>
          <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-3) 0 var(--espaco-2)' }}>Oi. Eu sou a Val.</h1>
          <p style={{ color: 'var(--tinta-suave)', maxWidth: '48ch', margin: '0 auto var(--espaco-2)' }}>
            Estou sempre por aqui, do seu lado, para te apoiar nos momentos em que você quiser ajustar o tom do seu dia, respirar nos momentos de agitação, ou só voltar pra si.
          </p>
          <p style={{ color: 'var(--tinta-suave)', maxWidth: '48ch', margin: '0 auto var(--espaco-4)' }}>
            Antes da gente começar, eu queria te conhecer um pouquinho, rapidinho. Fica tranquila que não é preencher formulário, é só uma conversa para eu te conhecer melhor e te ajudar mais.
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="botao" onClick={comecar}>Vamos conversar</button>
            <button className="botao-suave" onClick={onConcluir}>Agora não, quero só entrar</button>
          </div>
        </div>
      </section>
    );
  }

  // ---- A conversa ----
  return (
    <section style={{ minHeight: '100%', maxWidth: 640, margin: '0 auto', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <p className="assinatura" style={{ fontSize: '2rem', margin: '0 0 var(--espaco-3)', textAlign: 'center' }}>
        Val<span className="ponto">.</span>
      </p>

      <div style={{ display: 'grid', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-3)' }}>
        {mensagens.map((m, i) => (
          <Balao key={i} role={m.role} text={m.text} />
        ))}
        {pensando && (
          <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
            A Val está aqui…
          </p>
        )}
        {erro && <p style={{ color: 'var(--tinta-suave)' }}>{erro}</p>}
        <div ref={fim} />
      </div>

      {/* Enquanto a conversa segue, o campo de resposta e o "deixar pra depois".
          Quando a Val se despede (sem mais perguntas), o campo se recolhe e só
          resta o convite de entrar. */}
      {fechou ? (
        <div style={{ textAlign: 'center' }}>
          <button className="botao" onClick={onConcluir}>Entrar</button>
        </div>
      ) : (
        <form onSubmit={enviar} style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) enviar(e); }}
            rows={3}
            placeholder="Pode escrever do jeito que vier."
            style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel-branco)' }}
          />
          <div style={{ display: 'flex', gap: 'var(--espaco-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="botao" disabled={pensando || !texto.trim()}>Enviar</button>
            <button
              type="button"
              onClick={onConcluir}
              style={{ background: 'transparent', border: 'none', color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              deixar isso pra depois
            </button>
          </div>
        </form>
      )}

      {guardou && (
        <p className="val-fade-in" style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', fontSize: 'var(--corpo-pequeno)', textAlign: 'center', marginTop: 'var(--espaco-3)' }}>
          Guardei um pouco de você no seu Meu Centro. Está lá quando quiser ver.
        </p>
      )}
    </section>
  );
}

// A mulher fala em card de papel; a Val responde em itálico editorial, na voz dela.
function Balao({ role, text }) {
  if (role === 'assistant') {
    return (
      <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0, maxWidth: '52ch' }}>
        {text}
      </p>
    );
  }
  return (
    <div className="card" style={{ padding: '12px var(--espaco-2)', justifySelf: 'end', maxWidth: '46ch', background: 'var(--papel)' }}>
      {text}
    </div>
  );
}
