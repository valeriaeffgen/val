import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { usePerfil } from '../lib/useColecao';
import { vincularEmail, sair, apagarMinhaConta, supabase, hasSupabase } from '../lib/supabase';
import { exportarRegistros } from '../lib/exportar';
import { lerAcesso } from '../lib/val';
import { cancelarAssinatura } from '../lib/assinatura';

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

export default function MeuCentro({ sessao, onNavegar }) {
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
      <PainelCuradora />

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

      <Assinatura />
      <Privacidade onNavegar={onNavegar} />
    </Secao>
  );
}

// Acesso ao admin (só curadora): a Caixa vive em /?caixa, com cartas, fila de
// curadoria e o cadastro das jornadas. Para as mulheres, nada disto aparece.
function PainelCuradora() {
  const [curadora, setCuradora] = useState(false);
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.from('curadoras').select('user_id').maybeSingle()
      .then(({ data }) => setCuradora(Boolean(data)))
      .catch(() => {});
  }, []);
  if (!curadora) return null;

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Área da Valéria</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        O lado de dentro do app: as cartas que chegaram, a fila de curadoria, e o cadastro das jornadas.
      </p>
      <button className="botao-suave" style={{ color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' }} onClick={() => window.location.assign('?caixa')}>
        abrir o admin
      </button>
    </div>
  );
}

// Sua assinatura (FASE 3): só aparece pra quem tem plano vigente. Cancelamento
// digno, um toque, confirmação calma, acesso até o fim do período pago.
function Assinatura() {
  const [acesso, setAcesso] = useState(null);
  const [fase, setFase] = useState('inicio'); // inicio | confirmando | cancelando | feito | erro

  useEffect(() => {
    lerAcesso().then(setAcesso).catch(() => {});
  }, []);

  // Só mostra para assinatura paga vigente (ativa ou já cancelada dentro do prazo).
  if (!acesso || !acesso.acessoPago) return null;
  const jaCancelada = acesso.status === 'cancelada';

  async function cancelar() {
    setFase('cancelando');
    try {
      await cancelarAssinatura();
      setFase('feito');
    } catch {
      setFase('erro');
    }
  }

  return (
    <div className="card" style={{ marginTop: 'var(--espaco-3)' }}>
      <h3 style={{ marginTop: 0 }}>Sua assinatura</h3>

      {fase === 'feito' || jaCancelada ? (
        <p style={{ color: 'var(--tinta-suave)', margin: 0 }}>
          A renovação está desligada. Você segue com a Val até o fim do período já pago, sem pressa.
        </p>
      ) : fase === 'confirmando' ? (
        <>
          <p style={{ color: 'var(--tinta)', marginTop: 0 }}>
            Posso desligar a renovação. Você continua com tudo até o fim do período que já pagou, e nada some.
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
            <button className="botao-suave" onClick={cancelar}>encerrar a renovação</button>
            <button className="botao-suave" onClick={() => setFase('inicio')}>deixa como está</button>
          </div>
        </>
      ) : fase === 'cancelando' ? (
        <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>
          Um instante…
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
            Você está com a Val, 300 créditos por mês. Pode encerrar quando quiser, sem labirinto.
          </p>
          <button
            onClick={() => setFase('confirmando')}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            encerrar a renovação
          </button>
          {fase === 'erro' && (
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', marginBottom: 0 }}>
              Não consegui agora. Tenta de novo daqui a pouco.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Sua privacidade (LGPD): exportar tudo, ler a política, e a porta de saída.
function Privacidade({ onNavegar }) {
  const [estado, setEstado] = useState('inicio'); // inicio | exportando | feito | erro

  async function exportar() {
    setEstado('exportando');
    try {
      await exportarRegistros();
      setEstado('feito');
    } catch {
      setEstado('erro');
    }
  }

  return (
    <div className="card" style={{ marginTop: 'var(--espaco-3)' }}>
      <h3 style={{ marginTop: 0 }}>Sua privacidade</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        A sua história é sua. Leve uma cópia, ou leve embora de vez, quando quiser.
      </p>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="botao-suave" onClick={exportar} disabled={estado === 'exportando'}>
          {estado === 'exportando' ? 'preparando…' : 'Exportar meus registros'}
        </button>
        {onNavegar && (
          <button className="botao-suave" onClick={() => onNavegar({ secao: 'politica' })}>
            Política de Privacidade
          </button>
        )}
      </div>
      {estado === 'feito' && (
        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>
          Pronto. Baixei um arquivo com tudo que é seu.
        </p>
      )}
      {estado === 'erro' && (
        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>
          Não consegui exportar agora. Tenta de novo daqui a pouco.
        </p>
      )}

      <ApagarHistoria jaExportou={estado === 'feito'} onExportar={exportar} />
    </div>
  );
}

// A porta de saída digna (LGPD: direito de eliminação). Sem drama nem chantagem:
// um lugar que respeita a escolha dela também respeita a de ir embora. Oferece
// exportar antes, uma vez, com leveza, e pede dupla confirmação calma.
function ApagarHistoria({ jaExportou, onExportar }) {
  const [fase, setFase] = useState('fechado'); // fechado | aberto | confirmando | apagando | erro

  async function apagar() {
    setFase('apagando');
    try {
      await apagarMinhaConta();
      // A sessão encerra; o App volta para a Entrada sozinho.
    } catch {
      setFase('erro');
    }
  }

  if (fase === 'fechado') {
    return (
      <p style={{ margin: 'var(--espaco-3) 0 0' }}>
        <button onClick={() => setFase('aberto')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          apagar a minha história
        </button>
      </p>
    );
  }

  return (
    <div style={{ marginTop: 'var(--espaco-3)', borderTop: '1px solid var(--linha)', paddingTop: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Levar a sua história embora</h3>
      <p style={{ color: 'var(--tinta)', marginTop: 0 }}>
        A sua história é sua, inclusive pra levar embora. Se você apagar, tudo o que guardou aqui some, de vez, e tudo bem.
      </p>

      {!jaExportou && (
        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
          Antes, se quiser, leve uma cópia.{' '}
          <button onClick={onExportar} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--verde-petroleo)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', font: 'inherit' }}>
            exportar agora
          </button>
        </p>
      )}

      {fase === 'aberto' && (
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
          <button className="botao-suave" onClick={() => setFase('confirmando')}>quero apagar a minha história</button>
          <button className="botao-suave" onClick={() => setFase('fechado')}>voltar</button>
        </div>
      )}

      {fase === 'confirmando' && (
        <>
          <p style={{ color: 'var(--tinta)', marginTop: 'var(--espaco-2)' }}>
            Então é isso. Quando você confirmar, eu apago tudo agora, e não dá pra desfazer.
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
            <button className="botao" onClick={apagar}>apagar, de vez</button>
            <button className="botao-suave" onClick={() => setFase('fechado')}>deixa pra lá</button>
          </div>
        </>
      )}

      {fase === 'apagando' && (
        <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', marginTop: 'var(--espaco-2)' }}>
          Apagando a sua história…
        </p>
      )}

      {fase === 'erro' && (
        <>
          <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-2)' }}>
            Não consegui apagar agora. Tenta de novo daqui a pouco, ou escreve pra gente pelo contato na Política.
          </p>
          <button className="botao-suave" onClick={() => setFase('confirmando')}>tentar de novo</button>
        </>
      )}
    </div>
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
