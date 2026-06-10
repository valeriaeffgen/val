import { useState } from 'react';
import { entrarComEmail } from '../lib/supabase';
import { consentido, marcarConsentimento } from '../lib/consent';
import Politica from './Politica';

/*
 * Entrada (seção 9) — login/cadastro por link mágico, sem senha.
 * Caloroso, não cobrança: a porta é o e-mail só para a Val guardar a história
 * da mulher e a reencontrar em qualquer dia, em qualquer aparelho.
 *
 * Consentimento (LGPD): no primeiro acesso, um "sim" claro à Política de
 * Privacidade antes de seguir. Leve, mas inequívoco. Quem já consentiu neste
 * aparelho não marca de novo, só vê o lembrete com o link.
 */
export default function Entrada() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aceito, setAceito] = useState(consentido());
  const [verPolitica, setVerPolitica] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    const v = email.trim();
    if (!v || enviando) return;
    if (!aceito) { setErro('Pra guardar a sua história com cuidado, a Val precisa do seu sim à Política de Privacidade.'); return; }
    setEnviando(true);
    setErro(null);
    marcarConsentimento(); // o "sim" deste aparelho; a prova no banco é gravada após o login
    const { error } = await entrarComEmail(v);
    setEnviando(false);
    if (error) setErro('Não consegui enviar agora. Confere o e-mail e tenta de novo.');
    else setEnviado(true);
  }

  if (verPolitica) {
    return (
      <section style={{ minHeight: '100%', padding: 'var(--espaco-4) var(--espaco-3)', maxWidth: 720, margin: '0 auto' }}>
        <Politica onVoltar={() => setVerPolitica(false)} />
      </section>
    );
  }

  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ maxWidth: '46ch', width: '100%', textAlign: 'center' }}>
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
            <form onSubmit={entrar} style={{ display: 'grid', gap: 'var(--espaco-2)', justifyItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--espaco-1)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu e-mail"
                  autoFocus
                  style={{ border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '12px var(--espaco-2)', background: 'var(--papel-branco)', minWidth: 240 }}
                />
                <button type="submit" className="botao" disabled={enviando || !email.trim() || !aceito}>
                  {enviando ? 'enviando…' : 'entrar'}
                </button>
              </div>

              <label style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'flex-start', textAlign: 'left', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', maxWidth: '40ch', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={(e) => setAceito(e.target.checked)}
                  style={{ marginTop: 3, accentColor: 'var(--verde-petroleo)' }}
                />
                <span>
                  Li e concordo com a{' '}
                  <button type="button" onClick={() => setVerPolitica(true)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--verde-petroleo)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', font: 'inherit' }}>
                    Política de Privacidade
                  </button>
                  , e entendo que a minha história é minha, pra exportar ou apagar quando eu quiser.
                </span>
              </label>
            </form>
            {erro && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-2)' }}>{erro}</p>}
          </>
        )}
      </div>
    </section>
  );
}
