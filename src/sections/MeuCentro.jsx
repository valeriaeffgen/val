import Secao from '../components/Secao';
import { db } from '../lib/db';
import { usePerfil } from '../lib/useColecao';

/*
 * Meu Centro (seção 6) — valores, o que já é (conquistas), o que importa agora
 * (foco) e elevadores. Editável. É a base do contexto pessoal que alimenta toda
 * a camada generativa (regra 3 da seção 7).
 */
const CAMPOS = [
  { chave: 'valores', titulo: 'Valores', dica: 'O que te orienta.' },
  { chave: 'conquistas', titulo: 'O que já é', dica: 'O que você já construiu.' },
  { chave: 'foco', titulo: 'O que importa agora', dica: 'Sem cobrança — só direção.' },
  { chave: 'elevadores', titulo: 'Elevadores', dica: 'O que costuma te erguer.' },
];

export default function MeuCentro() {
  const perfil = usePerfil();

  function adicionar(chave, valor) {
    const v = valor.trim();
    if (!v) return;
    db.salvarPerfil({ [chave]: [...(perfil[chave] ?? []), v] })
      .catch((err) => console.warn('Val: falha ao guardar no Meu Centro —', err?.message ?? err));
  }

  return (
    <Secao titulo="Meu Centro" abertura="O chão de onde você fala. Muda quando você muda.">
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
