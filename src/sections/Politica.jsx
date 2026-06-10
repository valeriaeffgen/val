import Secao from '../components/Secao';
import { POLITICA, POLITICA_DATA } from '../data/politica';

/*
 * Política de Privacidade — texto em linguagem humana, na voz editorial da Val
 * (não juridiquês). Acessível antes de entrar (na Entrada) e dentro do app
 * (rodapé e Meu Centro). O conteúdo vive em data/politica.js.
 */
export default function Politica({ onVoltar }) {
  return (
    <Secao titulo="Privacidade" abertura="O que a Val guarda, pra quê, e o que é seu pra sempre.">
      {onVoltar && (
        <button className="botao-suave" onClick={onVoltar} style={{ marginBottom: 'var(--espaco-3)' }}>
          voltar
        </button>
      )}

      <div className="card" style={{ display: 'grid', gap: 'var(--espaco-3)' }}>
        {POLITICA.map((sec) => (
          <section key={sec.titulo}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--espaco-1)' }}>{sec.titulo}</h3>
            {(sec.paragrafos ?? []).map((p, i) => (
              <p key={i} style={{ color: 'var(--tinta)', margin: '0 0 var(--espaco-1)' }}>{p}</p>
            ))}
            {sec.itens && (
              <ul style={{ paddingLeft: '1.1em', margin: '4px 0 0', color: 'var(--tinta)' }}>
                {sec.itens.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>
          Em vigor desde {POLITICA_DATA}.
        </p>
      </div>
    </Secao>
  );
}
