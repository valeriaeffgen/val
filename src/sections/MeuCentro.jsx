import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { usePerfil } from '../lib/useColecao';
import { vincularEmail, sair } from '../lib/supabase';

/*
 * Meu Centro (seção 6) — valores, o que já é (conquistas), o que importa agora
 * (foco) e elevadores. Editável. É a base do contexto pessoal que alimenta toda
 * a camada generativa (regra 3 da seção 7).
 */
const CAMPOS = [
  { chave: 'valores', titulo: 'Meus valores', dica: 'de onde eu opero' },
  { chave: 'conquistas', titulo: 'O que já é', dica: 'a ansiedade apaga, eu lembro' },
  { chave: 'foco', titulo: 'O que importa agora', dica: 'um funil, não um acumulador' },
  { chave: 'elevadores', titulo: 'Meus elevadores', dica: 'o que comprovadamente me sobe' },
];

export default function MeuCentro({ sessao }) {
  const perfil = usePerfil();

  function adicionar(chave, valor) {
    const v = valor.trim();
    if (!v) return;
    db.salvarPerfil({ [chave]: [...(perfil[chave] ?? []), v] })
      .catch((err) => console.warn('Val: falha ao guardar no Meu Centro —', err?.message ?? err));
  }

  return (
    <Secao titulo="Meu Centro" abertura="O chão de onde você fala. Muda quando você muda.">
      {sessao && <Conta sessao={sessao} />}

      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {CAMPOS.map((campo) => (
          <div key={campo.chave} className="card">
            <h3 style={{ marginTop: 0 }}>{campo.titulo}</h3>
            <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>{campo.dica}</p>
            <ul style={{ paddingLeft: '1.1em', margin: '0 0 var(--espaco-2)' }}>
              {(perfil[campo.chave] ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.valor;
                adicionar(campo.chave, input.value);
                input.value = '';
              }}
              style={{ display: 'flex', gap: 'var(--espaco-1)' }}
            >
              <input
                name="valor"
                placeholder="Acrescentar…"
                style={{ flex: 1, border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
              />
              <button type="submit" className="botao-suave">Guardar</button>
            </form>
          </div>
        ))}
      </div>
    </Secao>
  );
}

// Sua conta: vincular e-mail (se ainda anônima) e sair.
function Conta({ sessao }) {
  const anonima = sessao.user?.is_anonymous;
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('inicio'); // inicio | enviado | erro

  async function vincular(e) {
    e.preventDefault();
    if (!email.trim()) return;
    const { error } = await vincularEmail(email);
    setEstado(error ? 'erro' : 'enviado');
  }

  if (!anonima) {
    return (
      <div className="card" style={{ marginBottom: 'var(--espaco-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--espaco-2)', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--tinta-suave)' }}>Conectada como {sessao.user?.email}</span>
        <button className="botao-suave" onClick={() => sair()}>sair</button>
      </div>
    );
  }

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Guarde a sua história</h3>
      {estado === 'enviado' ? (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
          Te enviei um link de confirmação. Abra o seu e-mail e toque nele, e tudo que você já registrou aqui passa a te seguir em qualquer aparelho.
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0 }}>
            Você está visitando sem conta. Deixe seu e-mail e a Val guarda tudo isto com você, sem perder nada, para te reencontrar onde você estiver.
          </p>
          <form onSubmit={vincular} style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu e-mail"
              style={{ flex: 1, border: '1px solid rgba(239,231,214,0.3)', background: 'rgba(0,0,0,0.12)', color: 'var(--sobre-escuro)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)' }}
            />
            <button type="submit" className="botao-suave" style={{ color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' }}>guardar</button>
          </form>
          {estado === 'erro' && <p style={{ color: 'var(--sobre-escuro-suave)', marginBottom: 0 }}>Não consegui agora. Confere o e-mail e tenta de novo.</p>}
        </>
      )}
    </div>
  );
}
