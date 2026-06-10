import { useState, useEffect, useCallback } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

/*
 * Caixa de entrada da Valéria (seção 8) — o lado humano, só dela.
 * Acesso por /?caixa, protegido por login de e-mail (link mágico) e pela
 * tabela `curadoras` (RLS). Aqui a Valéria lê as cartas que chegam e responde,
 * no tempo dela. Não é suporte que sufoca: nada de pressa, nada de obrigação.
 */
export default function Caixa() {
  const [sessao, setSessao] = useState(null);
  const [curadora, setCuradora] = useState(null); // null = checando, true/false = sabido
  const [cartas, setCartas] = useState([]);
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState('cartas'); // cartas | curadoria
  const [curadoria, setCuradoria] = useState([]);

  const logada = sessao && !sessao.user?.is_anonymous;

  const carregarCartas = useCallback(async () => {
    const { data } = await supabase.from('cartas').select('*').order('created_at', { ascending: true });
    setCartas(data ?? []);
  }, []);

  const carregarCuradoria = useCallback(async () => {
    const { data } = await supabase
      .from('conteudo_gerado').select('*').eq('status', 'curadoria').order('util_count', { ascending: false });
    setCuradoria(data ?? []);
  }, []);

  const verificarCuradora = useCallback(async () => {
    const { data } = await supabase.from('curadoras').select('user_id').maybeSingle();
    const ehCuradora = Boolean(data);
    setCuradora(ehCuradora);
    if (ehCuradora) await Promise.all([carregarCartas(), carregarCuradoria()]);
  }, [carregarCartas, carregarCuradoria]);

  useEffect(() => {
    if (!hasSupabase) { setCarregando(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (logada) verificarCuradora();
  }, [logada, verificarCuradora]);

  async function entrar(e) {
    e.preventDefault();
    if (!email.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (!error) setEnviado(true);
  }

  async function responder(id, texto) {
    const t = texto.trim();
    if (!t) return;
    await supabase.from('cartas').update({
      resposta: t,
      status: 'respondida',
      respondida_em: new Date().toISOString(),
    }).eq('id', id);
    await carregarCartas();
  }

  async function aprovar(id, texto) {
    // Promove com cópia anônima no acervo de todas (desvinculada da autora).
    await supabase.rpc('promover_oficial', { conteudo: id, texto_final: texto });
    await carregarCuradoria();
  }
  async function descartar(id) {
    await supabase.from('conteudo_gerado').update({ status: 'descartado' }).eq('id', id);
    await carregarCuradoria();
  }

  // --- Telas ---
  if (!hasSupabase) return <Centro><p>A caixa precisa do Supabase configurado.</p></Centro>;
  if (carregando) return <Centro><p style={{ color: 'var(--tinta-suave)' }}>Abrindo a caixa…</p></Centro>;

  if (!logada) {
    return (
      <Centro>
        <p className="assinatura" style={{ fontSize: '2.4rem' }}>Val<span className="ponto">.</span></p>
        <h1 style={{ fontStyle: 'italic' }}>A caixa das cartas</h1>
        <p style={{ color: 'var(--tinta-suave)' }}>Só sua, Valéria. Entre com o seu e-mail.</p>
        {enviado ? (
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
            Te mandei um link de acesso. Abra o seu e-mail e clique para entrar.
          </p>
        ) : (
          <form onSubmit={entrar} style={{ display: 'flex', gap: 'var(--espaco-1)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu e-mail"
              style={{ border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel-branco)', minWidth: 220 }}
            />
            <button type="submit" className="botao">entrar</button>
          </form>
        )}
      </Centro>
    );
  }

  if (curadora === false) {
    return (
      <Centro>
        <h1 style={{ fontStyle: 'italic' }}>Esta caixa é só da Valéria.</h1>
        <p style={{ color: 'var(--tinta-suave)' }}>Você está logada como {sessao.user.email}, mas esta conta não tem acesso.</p>
        <button className="botao-suave" onClick={() => supabase.auth.signOut()}>sair</button>
      </Centro>
    );
  }

  if (curadora === null) return <Centro><p style={{ color: 'var(--tinta-suave)' }}>Conferindo o acesso…</p></Centro>;

  const aguardando = cartas.filter((c) => c.status !== 'respondida');
  const respondidas = cartas.filter((c) => c.status === 'respondida');

  const tab = (id, label, n) => (
    <button
      onClick={() => setAba(id)}
      style={{
        background: aba === id ? 'var(--verde-petroleo)' : 'transparent',
        color: aba === id ? 'var(--sobre-escuro)' : 'var(--verde-petroleo)',
        border: '1px solid var(--verde-petroleo)', borderRadius: 999, padding: '7px 16px',
        cursor: 'pointer', fontWeight: aba === id ? 600 : 400,
      }}
    >
      {label}{n > 0 ? ` · ${n}` : ''}
    </button>
  );

  return (
    <div style={{ maxWidth: 'var(--largura-leitura)', margin: '0 auto', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--espaco-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
          {tab('cartas', 'Cartas', aguardando.length)}
          {tab('curadoria', 'Curadoria', curadoria.length)}
        </div>
        <button className="botao-suave" onClick={() => supabase.auth.signOut()}>sair</button>
      </div>

      {aba === 'cartas' ? (
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
            {aguardando.length === 0
              ? 'Nenhuma carta esperando agora. Volte quando quiser.'
              : `${aguardando.length} ${aguardando.length === 1 ? 'carta te espera' : 'cartas te esperam'}. Sem pressa.`}
          </p>
          <div style={{ display: 'grid', gap: 'var(--espaco-3)', marginTop: 'var(--espaco-3)' }}>
            {aguardando.map((c) => <CartaAdmin key={c.id} carta={c} onResponder={responder} />)}
          </div>
          {respondidas.length > 0 && (
            <div style={{ marginTop: 'var(--espaco-5)' }}>
              <h3 style={{ fontStyle: 'italic' }}>Já respondidas</h3>
              <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
                {respondidas.map((c) => (
                  <div key={c.id} className="card">
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{c.texto}</div>
                    <div style={{ marginTop: 'var(--espaco-2)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--verde-petroleo)', whiteSpace: 'pre-wrap' }}>
                      {c.resposta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
            {curadoria.length === 0
              ? 'Nada na fila agora. O que as mulheres mais marcam como útil aparece aqui.'
              : 'O que as mulheres mais marcaram como útil. Aprove, ajuste, ou descarte.'}
          </p>
          <div style={{ display: 'grid', gap: 'var(--espaco-3)', marginTop: 'var(--espaco-3)' }}>
            {curadoria.map((item) => (
              <CuradoriaItem key={item.id} item={item} onAprovar={aprovar} onDescartar={descartar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Um item da fila: ferramenta editável + aprovar/descartar. Outros tipos: texto.
function CuradoriaItem({ item, onAprovar, onDescartar }) {
  const ehFerramenta = item.tipo === 'ferramenta';
  let parsed = null;
  if (ehFerramenta) { try { parsed = JSON.parse(item.texto); } catch { /* texto livre */ } }

  const [situacao, setSituacao] = useState(parsed?.situacao ?? '');
  const [diagnostico, setDiagnostico] = useState(parsed?.diagnostico ?? '');
  const [passos, setPassos] = useState((parsed?.passos ?? []).join('\n'));
  const [pergunta, setPergunta] = useState(parsed?.pergunta ?? '');
  const [textoLivre, setTextoLivre] = useState(item.texto);

  function aprovar() {
    let texto;
    if (parsed) {
      texto = JSON.stringify({
        ...parsed, situacao, diagnostico,
        passos: passos.split('\n').map((s) => s.trim()).filter(Boolean),
        pergunta,
      });
    } else {
      texto = textoLivre;
    }
    onAprovar(item.id, texto);
  }

  const campo = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-2)' }}>
        <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
          {item.tipo}{item.contexto?.consulta ? ` · "${item.contexto.consulta}"` : ''}
        </span>
        <span style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', whiteSpace: 'nowrap' }}>
          {item.util_count} útil
        </span>
      </div>

      {parsed ? (
        <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
          <input value={situacao} onChange={(e) => setSituacao(e.target.value)} style={campo} placeholder="situação" />
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={3} style={{ ...campo, resize: 'vertical' }} placeholder="diagnóstico" />
          <textarea value={passos} onChange={(e) => setPassos(e.target.value)} rows={4} style={{ ...campo, resize: 'vertical' }} placeholder="um micro-passo por linha" />
          <input value={pergunta} onChange={(e) => setPergunta(e.target.value)} style={campo} placeholder="a pergunta" />
        </div>
      ) : (
        <textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)} rows={5} style={{ ...campo, resize: 'vertical' }} />
      )}

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-2)' }}>
        <button className="botao" onClick={aprovar}>aprovar</button>
        <button className="botao-suave" onClick={() => onDescartar(item.id)}>descartar</button>
      </div>
    </div>
  );
}

function CartaAdmin({ carta, onResponder }) {
  const [texto, setTexto] = useState('');
  return (
    <div className="card" style={{ borderTop: '3px solid var(--ambar)' }}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 'var(--espaco-2)' }}>{carta.texto}</div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        placeholder="Sua resposta, de pessoa pra pessoa…"
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)', lineHeight: 1.6 }}
      />
      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <button className="botao" onClick={() => onResponder(carta.id, texto)} disabled={!texto.trim()}>responder</button>
      </div>
    </div>
  );
}

function Centro({ children }) {
  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)', textAlign: 'center' }}>
      <div style={{ maxWidth: '46ch' }}>{children}</div>
    </section>
  );
}
