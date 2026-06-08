import Secao from '../components/Secao';
import { VIDEOS_DEMO } from '../data/seed';

/*
 * Vídeos (seção 6, rodapé). A Valéria grava; aqui ficam os cabeçalhos. Quando os
 * vídeos forem hospedados, cada card ganha o seu player.
 */
export default function Videos() {
  return (
    <Secao titulo="Vídeos" abertura="explicações e reflexões rápidas, na minha voz, pra ouvir quando quiser">
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {VIDEOS_DEMO.map((v) => (
          <div key={v.titulo} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--espaco-2)' }}>
              <h3 style={{ margin: 0 }}>{v.titulo}</h3>
              <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', whiteSpace: 'nowrap' }}>{v.dur}</span>
            </div>
            <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', margin: '4px 0 0' }}>{v.tipo}</p>
            <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)' }}>{v.desc}</p>
          </div>
        ))}
      </div>
    </Secao>
  );
}
