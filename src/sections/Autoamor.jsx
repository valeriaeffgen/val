import Secao, { EmConstrucao } from '../components/Secao';

/*
 * Autoamor (seção 6) — card escuro, é ritual (seção 5):
 * (1) ritual do gesto diário; (2) "a palavra de hoje" gerada de você;
 * (3) banco pessoal — você escreve no dia bom, colhe no dia difícil.
 */
export default function Autoamor() {
  return (
    <Secao titulo="Autoamor" abertura="Um gesto por você, hoje.">
      <div className="card-escuro">
        <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>A palavra de hoje</h3>
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
          Gerada de você — guardada quando tocar fundo, plantada no seu banco.
        </p>
      </div>
      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <EmConstrucao nota="O ritual do gesto diário e o banco pessoal (escrever no dia bom, colher no dia difícil) entram aqui." />
      </div>
    </Secao>
  );
}
