import { useState } from 'react';
import { iniciarAssinatura } from '../lib/assinatura';

/*
 * A tela serena de plano (FASE 2/3) — aparece quando a geração é bloqueada por
 * crédito (códigos -1 / -2 do backend). Fiel ao CLAUDE.md:
 *  - sem drama, sem contador, sem "acabou!". Acolhe e convida.
 *  - o santuário continua aberto: ela fecha e segue lendo e guardando à vontade.
 *  - card claro (o escuro é reservado a ritual).
 *
 * FASE 3: o "continuar" abre o checkout do Asaas. Cartão é o caminho principal
 * (assinatura mensal); Pix é a alternativa (avulso). Ambos a R$48/300 créditos.
 */
const TEXTOS = {
  precisa_plano: {
    titulo: 'Esses dias foram nossos.',
    corpo: 'Se a Val está te fazendo bem, eu adoraria seguir do seu lado. Por R$48 ao mês, a gente continua: as conversas, os espelhos, a palavra de cada dia. O que você guardou aqui é seu de qualquer jeito, e segue aberto pra reler.',
  },
  sem_creditos: {
    titulo: 'Os créditos deste mês chegaram ao fim.',
    corpo: 'Eles renovam no próximo ciclo, e a gente recomeça com calma. Enquanto isso, o seu espaço segue aberto pra reler tudo que você já guardou. Se quiser, dá pra renovar agora.',
  },
};

export default function Plano({ motivo, onFechar }) {
  const t = TEXTOS[motivo] ?? TEXTOS.precisa_plano;
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState(false);

  async function assinar(metodo) {
    setErro(false);
    setIndo(true);
    try {
      const url = await iniciarAssinatura(metodo);
      if (url) window.location.href = url;
      else { setErro(true); setIndo(false); }
    } catch {
      setErro(true);
      setIndo(false);
    }
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

        {indo ? (
          <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
            Te levando pro pagamento, com calma…
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
              <button className="botao" onClick={() => assinar('cartao')}>Assinar com cartão</button>
              <button className="botao-suave" onClick={() => assinar('pix')}>Pagar com Pix</button>
            </div>
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>
              No cartão, renova sozinho todo mês, e você cancela quando quiser, em um toque. No Pix, é um mês por vez.
            </p>
            <div style={{ marginTop: 'var(--espaco-2)' }}>
              <button
                onClick={onFechar}
                style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                voltar pro meu espaço
              </button>
            </div>
            {erro && (
              <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', marginBottom: 0 }}>
                Não consegui abrir o pagamento agora. Tenta de novo daqui a pouco.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
