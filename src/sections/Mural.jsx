import Secao from '../components/Secao';
import { useColecao } from '../lib/useColecao';
import { formatarDia } from '../lib/datas';

/*
 * O mural da gratidão (seção 6, comportamento transversal) — não é seção de
 * navegação, é uma visão de releitura. Reúne só os registros de gratidão (Diário,
 * cat 'gratidao'), do mais recente ao mais antigo, sob a RLS dela. A alma de
 * guardar para devolver com sentido: aqui ela relê a abundância acumulada.
 */

export default function Mural({ onNavegar }) {
  const diario = useColecao('diario');
  // useColecao já vem do mais recente ao mais antigo.
  const motivos = diario.filter((d) => d.cat === 'gratidao');

  return (
    <Secao titulo="Sua gratidão" abertura="tudo pelo que você já agradeceu, junto, pra reler quando precisar">
      {motivos.length === 0 ? (
        <div className="card" style={{ color: 'var(--tinta-suave)' }}>
          <p style={{ margin: 0 }}>
            Ainda não tem motivos guardados aqui. Quando você agradecer, por menor que seja, eles se juntam neste lugar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
          {motivos.map((m) => (
            <div key={m.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
              <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', lineHeight: 1.4 }}>
                {m.text}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{formatarDia(m.day)}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--espaco-4)' }}>
        <button className="botao-suave" onClick={() => onNavegar?.({ secao: 'diario' })}>voltar ao Diário</button>
      </div>
    </Secao>
  );
}
