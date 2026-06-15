import { formatarDia } from '../lib/datas';
import { useColecao } from '../lib/useColecao';
import { TIPOS_PROSPERIDADE } from '../data/seed';
import Secao from '../components/Secao';

/*
 * Prosperidade — em reestruturação (seções 6 e 7).
 * Reconhecer a abundância REAL que já é da mulher e agir com clareza. NUNCA lei
 * da atração, manifestação, nem "eu sou próspera". Ancorada no concreto.
 *
 * Nova arquitetura (ESQUELETO por ora): em cima o ritual diário "Hoje"; abaixo
 * as Jornadas. O conteúdo do ritual e das jornadas entra no próximo passo.
 *
 * PRESERVAÇÃO: a estrutura antiga (Consciência avulsa e "Dois minutos") saiu,
 * mas NADA do que as mulheres registraram foi apagado. O acervo continua lendo
 * a mesma tabela `prosperidade` e segue acessível embaixo, com tudo que já existe.
 */
export default function Prosperidade() {
  return (
    <Secao titulo="Prosperidade" abertura="reconhecer o que já é seu, e agir com clareza">
      <Hoje />
      <Jornadas />
      <Acervo />
    </Secao>
  );
}

// --- Ritual diário "Hoje" (esqueleto; conteúdo no próximo passo) --------------
// Card escuro: é o ritual central da tela (seção 5).
function Hoje() {
  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Hoje</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
        O ritual de cada dia chega aqui em breve.
      </p>
    </div>
  );
}

// --- Jornadas (esqueleto; conteúdo no próximo passo) --------------------------
function Jornadas() {
  return (
    <div style={{ marginBottom: 'var(--espaco-5)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Jornadas</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Percursos pra reconhecer e ampliar o que já é seu. Em breve.
      </p>
    </div>
  );
}

// --- O acervo da Prosperidade (PRESERVADO) ------------------------------------
// Lê a mesma tabela `prosperidade`; tudo que já foi registrado segue aqui, sob a
// RLS dela. Inclui os registros antigos (consciência, exercícios), agrupados por
// tipo, com rótulo amigável quando houver e o próprio tipo como reserva.
function Acervo() {
  const itens = useColecao('prosperidade');
  if (!itens.length) return null;

  const porTipo = {};
  itens.forEach((e) => { (porTipo[e.tipo] ||= []).push(e); });
  const tipos = [
    ...Object.keys(TIPOS_PROSPERIDADE).filter((t) => porTipo[t]),
    ...Object.keys(porTipo).filter((t) => !TIPOS_PROSPERIDADE[t]),
  ];

  return (
    <div>
      <h3 style={{ fontStyle: 'italic' }}>O seu acervo</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        O que você foi reconhecendo como seu, guardado pra reler. Cresce com você.
      </p>

      {tipos.map((t) => (
        <div key={t} style={{ marginBottom: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 var(--espaco-1)' }}>
            {TIPOS_PROSPERIDADE[t] ?? t}
          </p>
          <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
            {porTipo[t].map((e) => (
              <div key={e.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.texto}</p>
                {e.pergunta && (
                  <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>{e.pergunta}</p>
                )}
                <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{formatarDia(e.day)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
