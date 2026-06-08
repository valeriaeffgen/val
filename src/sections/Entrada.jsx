import { useState } from 'react';
import { entrarComEmail } from '../lib/supabase';

/*
 * Entrada (seção 9) — login/cadastro por link mágico, sem senha.
 * Caloroso, não cobrança: a porta é o e-mail só para a Val guardar a história
 * da mulher e a reencontrar em qualquer dia, em qualquer aparelho.
 */
export default function Entrada() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    const v = email.trim();
    if (!v || enviando) return;
    setEnviando(true);
    setErro(null);
    const { error } = await entrarComEmail(v);
    setEnviando(false);
    if (error) setErro('Não consegui enviar agora. Confere o e-mail e tenta de novo.');
    else setEnviado(true);
  }

  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ maxWidth: '44ch', width: '100%', textAlign: 'center' }}>
        <p className="assinatura" style={{ fontSize: '3.4rem', margin: 0 }}>
          Val<span className="ponto">.</span>
        </p>

        {enviado ? (
          <div style={{ marginTop: 'var(--espaco-3)' }}>
            <h1 style={{ fontStyle: 'italic' }}>Te enviei um link.</h1>
            <p style={{ color: 'var(--tinta-suave)' }}>
              Abra o seu e-mail e toque no link para entrar. Pode fechar esta aba.
            </p>
            <button className="botao-suave" onClick={() => setEnviado(false)} style={{ marginTop: 'var(--espaco-2)' }}>
              usar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ fontStyle: 'italic', marginTop: 'var(--espaco-3)' }}>Que bom que você veio.</h1>
            <p style={{ color: 'var(--tinta-suave)', marginBottom: 'var(--espaco-3)' }}>
              Deixe seu e-mail para a Val guardar a sua história e te encontrar em qualquer dia, em qualquer aparelho. Sem senha, ela te manda um link.
            </p>
            <form onSubmit={entrar} style={{ display: 'flex', gap: 'var(--espaco-1)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu e-mail"
                autoFocus
                style={{ border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '12px var(--espaco-2)', background: 'var(--papel-branco)', minWidth: 240 }}
              />
              <button type="submit" className="botao" disabled={enviando || !email.trim()}>
                {enviando ? 'enviando…' : 'entrar'}
              </button>
            </form>
            {erro && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-2)' }}>{erro}</p>}
          </>
        )}
      </div>
    </section>
  );
}
