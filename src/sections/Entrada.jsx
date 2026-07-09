import { useState } from 'react';
import {
  entrarComSenha, cadastrarComSenha, redefinirSenhaEmail, reenviarConfirmacao,
  entrarComEmail, entrarComGoogle, GOOGLE_HABILITADO,
} from '../lib/supabase';
import { consentido, marcarConsentimento } from '../lib/consent';
import Politica from './Politica';

/*
 * Entrada (seção 9) — agora com SENHA como porta principal, na voz da Val.
 * Caloroso, nunca formulário frio.
 *
 *  - entrar  : e-mail + senha (a porta de todo dia).
 *  - criar   : e-mail + senha, com confirmação de e-mail (protege o canal).
 *  - esqueci : link de redefinição por e-mail (a rede de segurança).
 *  - ponte   : link mágico, para as contas antigas (criadas por link) entrarem
 *              e definirem uma senha no próximo acesso.
 *
 * Consentimento (LGPD): o "sim" à Política vem ao criar conta (ou ao usar a
 * ponte), antes de seguir. Leve, mas inequívoco.
 */
const MIN_SENHA = 6;

export default function Entrada() {
  const [modo, setModo] = useState('entrar'); // entrar | criar | esqueci | ponte
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null); // null | confirmar | recuperar | magico
  const [naoConfirmado, setNaoConfirmado] = useState(false);
  const [aceito, setAceito] = useState(consentido());
  const [verPolitica, setVerPolitica] = useState(false);

  const precisaConsentir = modo === 'criar' || modo === 'ponte';

  function trocarModo(m) {
    setModo(m); setErro(null); setEnviado(null); setNaoConfirmado(false); setSenha('');
  }

  async function enviar(e) {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || enviando) return;
    if (precisaConsentir && !aceito) {
      setErro('Pra guardar a sua história com cuidado, a Val precisa do seu sim à Política de Privacidade.');
      return;
    }
    if ((modo === 'entrar' || modo === 'criar') && senha.length < MIN_SENHA) {
      setErro(`A senha precisa de pelo menos ${MIN_SENHA} caracteres.`);
      return;
    }
    setEnviando(true); setErro(null); setNaoConfirmado(false);

    try {
      if (modo === 'entrar') {
        const { error } = await entrarComSenha(mail, senha);
        if (error) tratarErroEntrar(error);
        // sucesso: a sessão muda e o App segue sozinho.
      } else if (modo === 'criar') {
        marcarConsentimento();
        const { data, error } = await cadastrarComSenha(mail, senha);
        // E-mail já cadastrado: o Supabase não dá erro (não revela existência),
        // mas devolve o usuário com `identities` vazio. É como detectamos, pra
        // não mostrar "confirme seu e-mail" sem nada ter sido enviado.
        const jaExiste = data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
        if (error) {
          setErro(/registered|already/i.test(error.message ?? '')
            ? 'Esse e-mail já tem conta. Tente entrar, ou redefina a senha.'
            : 'Não consegui criar agora. Confere o e-mail e tenta de novo.');
        } else if (jaExiste) {
          setErro('Esse e-mail já tem conta. Toque em "já tenho conta, entrar", ou em "esqueci minha senha".');
        } else if (!data?.session) {
          setEnviado('confirmar'); // confirmação ligada
        }
        // se já veio sessão (confirmação desligada), o App segue sozinho.
      } else if (modo === 'esqueci') {
        const { error } = await redefinirSenhaEmail(mail);
        setEnviado(error ? null : 'recuperar');
        if (error) setErro('Não consegui enviar agora. Confere o e-mail e tenta de novo.');
      } else if (modo === 'ponte') {
        marcarConsentimento();
        const { error } = await entrarComEmail(mail);
        setEnviado(error ? null : 'magico');
        if (error) setErro(/rate|seconds|too many|limit/i.test(error.message ?? '')
          ? 'Você pediu o link faz pouco tempo. Espera um minutinho e tenta de novo.'
          : 'Não consegui enviar agora. Confere o e-mail e tenta de novo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  function tratarErroEntrar(error) {
    const m = error.message ?? '';
    if (/not confirmed/i.test(m)) {
      setNaoConfirmado(true);
      setErro('Falta confirmar o seu e-mail. Veja a caixa de entrada, ou peça um novo link abaixo.');
    } else if (/invalid login|credentials/i.test(m)) {
      setErro('E-mail ou senha não conferem. Tente de novo, ou redefina a senha.');
    } else {
      setErro('Não consegui entrar agora. Tenta de novo daqui a pouco.');
    }
  }

  async function reenviar() {
    setEnviando(true);
    const { error } = await reenviarConfirmacao(email.trim());
    setEnviando(false);
    setErro(error ? 'Não consegui reenviar agora. Tenta daqui a pouco.' : null);
    if (!error) setEnviado('confirmar');
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
      <div style={{ maxWidth: '54ch', width: '100%', textAlign: 'left' }}>
        <p className="assinatura" style={{ fontSize: '3.4rem', margin: 0, textAlign: 'center' }}>
          Val<span className="ponto">.</span>
        </p>

        {enviado ? (
          <MensagemEnviado tipo={enviado} email={email} onVoltar={() => trocarModo('entrar')} />
        ) : (
          <>
            <Intro modo={modo} />

            <form onSubmit={enviar} style={{ display: 'grid', gap: 'var(--espaco-2)', justifyItems: 'stretch' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu e-mail"
                autoComplete="email"
                autoFocus
                style={campo}
              />

              {(modo === 'entrar' || modo === 'criar') && (
                <div style={{ position: 'relative' }}>
                  <input
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder={modo === 'criar' ? 'crie uma senha' : 'sua senha'}
                    autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                    style={{ ...campo, width: '100%', boxSizing: 'border-box', paddingRight: 76 }}
                  />
                  <button type="button" onClick={() => setVerSenha((v) => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
                    {verSenha ? 'ocultar' : 'mostrar'}
                  </button>
                </div>
              )}

              <button type="submit" className="botao" disabled={enviando || !email.trim() || (precisaConsentir && !aceito)}>
                {enviando ? 'um instante…' : rotuloAcao(modo)}
              </button>

              {precisaConsentir && (
                <label style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'flex-start', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--verde-petroleo)' }} />
                  <span>
                    Li e concordo com a{' '}
                    <button type="button" onClick={() => setVerPolitica(true)} style={linkInline}>Política de Privacidade</button>
                    , e entendo que a minha história é minha, pra exportar ou apagar quando eu quiser.
                  </span>
                </label>
              )}
            </form>

            {erro && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-2)' }}>{erro}</p>}
            {naoConfirmado && (
              <button onClick={reenviar} className="botao-suave" style={{ marginTop: 'var(--espaco-1)' }}>reenviar a confirmação</button>
            )}

            {GOOGLE_HABILITADO && (modo === 'entrar' || modo === 'criar') && (
              <button onClick={() => entrarComGoogle()} className="botao-suave" style={{ marginTop: 'var(--espaco-2)' }}>
                entrar com o Google
              </button>
            )}

            <Rodape modo={modo} trocarModo={trocarModo} />
          </>
        )}
      </div>
    </section>
  );
}

const campo = { border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '12px var(--espaco-2)', background: 'var(--papel-branco)', width: '100%', boxSizing: 'border-box' };
const linkInline = { background: 'none', border: 'none', padding: 0, color: 'var(--verde-petroleo)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', font: 'inherit' };
const linkSuave = { background: 'none', border: 'none', padding: 0, color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', fontSize: 'var(--corpo-pequeno)' };

const rotuloAcao = (modo) => ({ entrar: 'entrar', criar: 'criar a minha conta', esqueci: 'enviar o link', ponte: 'enviar o link mágico' }[modo]);

// A abertura, na voz da Val, muda conforme o momento.
function Intro({ modo }) {
  if (modo === 'criar') {
    return (
      <>
        <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-4) 0 var(--espaco-3)' }}>Vamos guardar a sua história.</h1>
        <p style={{ margin: '0 0 var(--espaco-4)', lineHeight: 1.75, color: 'var(--tinta)' }}>
          Crie a sua conta com calma. A Val manda um e-mail pra confirmar que é você, e a partir daí a sua história te segue em qualquer aparelho, sem perder nada.
        </p>
      </>
    );
  }
  if (modo === 'esqueci') {
    return (
      <>
        <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-4) 0 var(--espaco-3)' }}>Acontece, sem problema.</h1>
        <p style={{ margin: '0 0 var(--espaco-4)', lineHeight: 1.75, color: 'var(--tinta)' }}>
          Diz o seu e-mail e a Val te manda um link pra criar uma senha nova. A sua história continua intacta, esperando você.
        </p>
      </>
    );
  }
  if (modo === 'ponte') {
    return (
      <>
        <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-4) 0 var(--espaco-3)' }}>Você já é de casa.</h1>
        <p style={{ margin: '0 0 var(--espaco-4)', lineHeight: 1.75, color: 'var(--tinta)' }}>
          Se você entrava pelo link de antes, é por aqui. A Val te manda o link, você entra, e aí cria uma senha pra das próximas vezes ser mais simples.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-4) 0 var(--espaco-3)' }}>Que bom te ver de novo.</h1>
      <p style={{ margin: '0 0 var(--espaco-4)', lineHeight: 1.75, color: 'var(--tinta)' }}>
        Entre com o seu e-mail e a sua senha, e a Val te reencontra de onde você parou.
      </p>
    </>
  );
}

// Os caminhos entre os modos, discretos, no fim.
function Rodape({ modo, trocarModo }) {
  return (
    <div style={{ marginTop: 'var(--espaco-4)', display: 'flex', gap: 'var(--espaco-2)', flexWrap: 'wrap' }}>
      {modo !== 'entrar' && <button onClick={() => trocarModo('entrar')} style={linkSuave}>já tenho conta, entrar</button>}
      {modo !== 'criar' && <button onClick={() => trocarModo('criar')} style={linkSuave}>criar uma conta</button>}
      {modo !== 'esqueci' && <button onClick={() => trocarModo('esqueci')} style={linkSuave}>esqueci minha senha</button>}
      {modo !== 'ponte' && <button onClick={() => trocarModo('ponte')} style={linkSuave}>entrei pelo link antes</button>}
    </div>
  );
}

function MensagemEnviado({ tipo, email, onVoltar }) {
  const copy = {
    confirmar: { t: 'Confira o seu e-mail.', p: `Se este e-mail ainda não tinha conta, te mandei um link pra ${email}, é só tocar pra confirmar e entrar. Se você já tinha conta, pode entrar direto, ou pedir uma senha nova em "esqueci minha senha".` },
    recuperar: { t: 'Te enviei um link.', p: `Abra o e-mail em ${email} e toque no link pra criar uma senha nova.` },
    magico: { t: 'Te enviei um link.', p: `Abra o e-mail em ${email} e toque no link pra entrar. Depois você cria a sua senha.` },
  }[tipo] ?? { t: 'Pronto.', p: 'Confira o seu e-mail.' };

  return (
    <div style={{ marginTop: 'var(--espaco-4)' }}>
      <h1 style={{ fontStyle: 'italic', marginTop: 0 }}>{copy.t}</h1>
      <p style={{ color: 'var(--tinta-suave)', lineHeight: 1.7 }}>{copy.p} Pode fechar esta aba.</p>
      <button className="botao-suave" onClick={onVoltar} style={{ marginTop: 'var(--espaco-2)' }}>voltar</button>
    </div>
  );
}
