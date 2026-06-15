import { useState } from 'react';
import { definirSenha } from '../lib/supabase';

/*
 * Definir senha (seção 9), na voz da Val. Dois momentos:
 *  - 'recuperar': ela chegou pelo link de "esqueci minha senha". Cria a nova.
 *  - 'ponte': conta antiga (criada por link mágico) que acabou de entrar. A Val
 *    convida a criar uma senha pra das próximas vezes ser direto. Pode pular.
 */
const MIN_SENHA = 6;

export default function DefinirSenha({ modo = 'recuperar', onConcluir, onPular }) {
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const ponte = modo === 'ponte';

  async function salvar(e) {
    e.preventDefault();
    if (senha.length < MIN_SENHA) { setErro(`A senha precisa de pelo menos ${MIN_SENHA} caracteres.`); return; }
    setSalvando(true); setErro(null);
    const { error } = await definirSenha(senha);
    setSalvando(false);
    if (error) setErro('Não consegui guardar agora. Tenta de novo daqui a pouco.');
    else onConcluir?.();
  }

  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ maxWidth: '48ch', width: '100%' }}>
        <p className="assinatura" style={{ fontSize: '3rem', margin: 0, textAlign: 'center' }}>
          Val<span className="ponto">.</span>
        </p>

        <h1 style={{ fontStyle: 'italic', margin: 'var(--espaco-4) 0 var(--espaco-2)' }}>
          {ponte ? 'Agora a Val tem senha.' : 'Crie uma senha nova.'}
        </h1>
        <p style={{ color: 'var(--tinta)', lineHeight: 1.75, marginTop: 0 }}>
          {ponte
            ? 'Você entrou pelo seu link, tudo certo. Crie uma senha agora pra das próximas vezes entrar direto. Se preferir, deixa pra depois, fica a seu critério.'
            : 'Escolha uma senha que seja sua. A sua história continua aqui, inteira, esperando você.'}
        </p>

        <form onSubmit={salvar} style={{ display: 'grid', gap: 'var(--espaco-2)', marginTop: 'var(--espaco-3)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type={verSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="sua nova senha"
              autoComplete="new-password"
              autoFocus
              style={{ border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '12px var(--espaco-2)', background: 'var(--papel-branco)', width: '100%', boxSizing: 'border-box', paddingRight: 76 }}
            />
            <button type="button" onClick={() => setVerSenha((v) => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
              {verSenha ? 'ocultar' : 'mostrar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="botao" disabled={salvando || !senha}>
              {salvando ? 'guardando…' : 'guardar a senha'}
            </button>
            {ponte && (
              <button type="button" onClick={() => onPular?.()} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
                agora não
              </button>
            )}
          </div>
        </form>

        {erro && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-2)' }}>{erro}</p>}
      </div>
    </section>
  );
}
