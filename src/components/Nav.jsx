import { SECOES } from '../sections';

/*
 * Navegação — a assinatura "Val." e as seções na ordem da seção 6.
 * Vídeos e "encerrar visita" ficam no rodapé (seção 6).
 */
export default function Nav({ atual, onIr }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(246, 241, 231, 0.82)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--linha)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--espaco-2) var(--espaco-3)', display: 'flex', alignItems: 'center', gap: 'var(--espaco-3)' }}>
        <button
          onClick={() => onIr(null)}
          aria-label="Voltar à chegada"
          className="assinatura"
          style={{ background: 'none', border: 'none', fontSize: '1.6rem', padding: 0 }}
        >
          Val<span className="ponto">.</span>
        </button>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', overflowX: 'auto' }}>
          {SECOES.map((s) => (
            <button
              key={s.id}
              onClick={() => onIr(s.id)}
              style={{
                background: atual === s.id ? 'var(--verde-suave)' : 'transparent',
                border: 'none',
                borderRadius: '999px',
                padding: '8px 14px',
                color: atual === s.id ? 'var(--verde-petroleo)' : 'var(--tinta-suave)',
                fontWeight: atual === s.id ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {s.rotulo}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
