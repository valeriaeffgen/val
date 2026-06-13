import { useState } from 'react';
import { iniciarAssinatura } from '../lib/assinatura';

/*
 * A tela serena de plano (FASE 2/3) — aparece quando a geração é bloqueada por
 * crédito (códigos -1 / -2 do backend). Fiel ao CLAUDE.md: sem drama, sem
 * contador. O santuário continua aberto: ela fecha e segue lendo e guardando.
 *
 * FASE 3: para cobrar, o Asaas precisa de nome, CPF e telefone (cria o cliente).
 * Coletamos com leveza, e então mandamos pra página de pagamento do Asaas.
 * Cartão = assinatura mensal; Pix = avulso. R$48 / 300 créditos.
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

const campo = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' };

export default function Plano({ motivo, onFechar }) {
  const t = TEXTOS[motivo] ?? TEXTOS.precisa_plano;
  const [metodo, setMetodo] = useState(null); // null | 'cartao' | 'pix'
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState(null);

  const podeIr = nome.trim() && cpf.replace(/\D/g, '').length >= 11;

  async function pagar() {
    if (!podeIr || indo) return;
    setErro(null);
    setIndo(true);
    try {
      const url = await iniciarAssinatura(metodo, { nome, cpf, telefone });
      if (url) window.location.href = url;
      else { setErro('sem url'); setIndo(false); }
    } catch (e) {
      setErro(e?.message || 'falha');
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
        style={{ maxWidth: '42ch', width: '100%', borderTop: '3px solid var(--ambar)', maxHeight: '88vh', overflow: 'auto' }}
      >
        <h2 style={{ fontStyle: 'italic', marginTop: 0 }}>{t.titulo}</h2>
        <p style={{ color: 'var(--tinta)' }}>{t.corpo}</p>

        {indo ? (
          <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
            Te levando pro pagamento, com calma…
          </p>
        ) : !metodo ? (
          // Escolha do método
          <>
            <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
              <button className="botao" onClick={() => setMetodo('cartao')}>Assinar com cartão</button>
              <button className="botao-suave" onClick={() => setMetodo('pix')}>Pagar com Pix</button>
            </div>
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>
              No cartão, renova sozinho todo mês, e você cancela quando quiser, em um toque. No Pix, é um mês por vez.
            </p>
            <div style={{ marginTop: 'var(--espaco-2)' }}>
              <button onClick={onFechar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                voltar pro meu espaço
              </button>
            </div>
          </>
        ) : (
          // Dados para o pagamento
          <form onSubmit={(e) => { e.preventDefault(); pagar(); }} style={{ display: 'grid', gap: 'var(--espaco-2)', marginTop: 'var(--espaco-2)' }}>
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 0 }}>
              Só o necessário pra emitir o {metodo === 'pix' ? 'Pix' : 'pagamento'}, com segurança.
            </p>
            <input style={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" autoFocus />
            <input style={campo} value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF" inputMode="numeric" />
            <input style={campo} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone (com DDD)" inputMode="tel" />
            <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" className="botao" disabled={!podeIr}>
                {metodo === 'pix' ? 'Gerar o Pix' : 'Continuar pro cartão'}
              </button>
              <button type="button" onClick={() => { setMetodo(null); setErro(null); }} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                voltar
              </button>
            </div>
          </form>
        )}

        {erro && (
          <>
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 4px' }}>
              Não consegui abrir o pagamento agora. Tenta de novo daqui a pouco.
            </p>
            {/* Diagnóstico de sandbox (remover antes do lançamento): */}
            <p style={{ color: 'var(--tinta-suave)', fontSize: '12px', opacity: 0.7, margin: 0, wordBreak: 'break-word', fontFamily: 'monospace' }}>
              {String(erro)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
