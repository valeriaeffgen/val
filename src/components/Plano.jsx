import { useState } from 'react';
import { POLITICA_CONTATO } from '../data/politica';

/*
 * A tela serena de plano (FASE 2) — aparece quando a geração é bloqueada por
 * crédito (códigos -1 / -2 do backend). Fiel ao CLAUDE.md:
 *  - sem drama, sem contador, sem "acabou!". Acolhe e convida.
 *  - o santuário continua aberto: ela fecha e segue lendo e guardando à vontade.
 *  - card claro (o escuro é reservado a ritual).
 *
 * `motivo`: 'precisa_plano' (degustação terminou) | 'sem_creditos' (mês acabou).
 * `onAssinar`: por ora mostra "em breve"; a FASE 3 liga o checkout do Asaas.
 */
const TEXTOS = {
  precisa_plano: {
    titulo: 'Esses dias foram nossos.',
    corpo: 'Se a Val está te fazendo bem, eu adoraria seguir do seu lado. Por R$48 ao mês, a gente continua: as conversas, os espelhos, a palavra de cada dia. O que você guardou aqui é seu de qualquer jeito, e segue aberto pra reler.',
    cta: 'Quero continuar',
  },
  sem_creditos: {
    titulo: 'Os créditos deste mês chegaram ao fim.',
    corpo: 'Eles renovam no próximo ciclo, e a gente recomeça com calma. Enquanto isso, o seu espaço segue aberto pra reler tudo que você já guardou.',
    cta: null,
  },
};

export default function Plano({ motivo, onFechar, onAssinar }) {
  const t = TEXTOS[motivo] ?? TEXTOS.precisa_plano;
  const [emBreve, setEmBreve] = useState(false);

  function assinar() {
    if (onAssinar) { onAssinar(); return; }
    setEmBreve(true);
  }

  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(29,58,50,0.28)', display: 'grid', placeItems: 'center', padding: 'var(--espaco-3)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card val-fade-in"
        style={{ maxWidth: '42ch', width: '100%', borderTop: '3px solid var(--ambar)' }}
      >
        <h2 style={{ fontStyle: 'italic', marginTop: 0 }}>{t.titulo}</h2>
        <p style={{ color: 'var(--tinta)' }}>{t.corpo}</p>

        {emBreve ? (
          <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
            Em breve você poderá assinar por aqui mesmo. Por ora, me escreve em {POLITICA_CONTATO} que eu te ajudo.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--espaco-2)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
            {t.cta && (
              <button className="botao" onClick={assinar}>{t.cta}</button>
            )}
            <button
              onClick={onFechar}
              style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              voltar pro meu espaço
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
