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

  const logada = sessao && !sessao.user?.is_anonymous;

  const carregarCartas = useCallback(async () => {
    const { data } = await supabase.from('cartas').select('*').order('created_at', { ascending: true });
    setCartas(data ?? []);
  }, []);

  const verificarCuradora = useCallback(async () => {
    const { data } = await supabase.from('curadoras').select('user_id').maybeSingle();
    const ehCuradora = Boolean(data);
    setCuradora(ehCuradora);
    if (ehCuradora) await carregarCartas();
  }, [carregarCartas]);

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

  return (
    <div style={{ maxWidth: 'var(--largura-leitura)', margin: '0 auto', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--espaco-2)' }}>
        <h1 style={{ marginBottom: 0 }}>A caixa das cartas</h1>
        <button className="botao-suave" onClick={() => supabase.auth.signOut()}>sair</button>
      </div>
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
