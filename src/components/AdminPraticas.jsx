import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/*
 * Admin das Práticas de fechamento (só curadora). Edita o banco curado (nome,
 * tons, passos, âncora, ativa), a regra de correspondência (os `tons` de cada
 * prática) e a config (cooldown e chance de gerar). E é a fila de curadoria: as
 * práticas GERADAS chegam como rascunho/curadoria e você aprova, ajusta ou
 * descarta. Aprovar vira 'oficial' (reutilizável pra todas).
 */
const campo = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '9px var(--espaco-2)', background: 'var(--papel)' };
const rotulo = { display: 'block', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 4px' };

export default function AdminPraticas() {
  const [praticas, setPraticas] = useState([]);
  const carregar = useCallback(async () => {
    const { data } = await supabase.from('praticas').select('*').neq('status', 'descartado').order('ordem');
    setPraticas(data ?? []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function nova() {
    await supabase.from('praticas').insert({ nome: 'Nova prática', tons: [], passos: [], status: 'oficial', origem: 'curada', ativa: false, ordem: praticas.length + 1 });
    await carregar();
  }

  const fila = praticas.filter((p) => p.status === 'rascunho' || p.status === 'curadoria');
  const banco = praticas.filter((p) => p.status === 'oficial');

  return (
    <div style={{ marginTop: 'var(--espaco-3)' }}>
      <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
        As práticas de pousar o dia. Os `tons` de cada uma são a regra: agitado, bom, soltou, pequena. Servir do banco é livre; o que a Val gera chega aqui pra você aprovar.
      </p>
      <Config />

      {fila.length > 0 && (
        <div style={{ margin: 'var(--espaco-3) 0' }}>
          <p style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 var(--espaco-1)' }}>Na fila (geradas), pra você aprovar</p>
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            {fila.map((p) => <PraticaEditor key={p.id} pratica={p} onMudou={carregar} />)}
          </div>
        </div>
      )}

      <button className="botao-suave" onClick={nova} style={{ margin: 'var(--espaco-2) 0 var(--espaco-3)' }}>nova prática</button>
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {banco.map((p) => <PraticaEditor key={p.id} pratica={p} onMudou={carregar} />)}
      </div>
    </div>
  );
}

function Config() {
  const [cooldown, setCooldown] = useState('48');
  const [chance, setChance] = useState('0.25');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    supabase.from('configuracoes').select('chave, valor')
      .in('chave', ['pratica_cooldown_horas', 'pratica_gerar_chance'])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));
        setCooldown(m.pratica_cooldown_horas ?? '48');
        setChance(m.pratica_gerar_chance ?? '0.25');
      });
  }, []);

  async function salvar() {
    await supabase.from('configuracoes').update({ valor: String(parseInt(cooldown, 10) || 48) }).eq('chave', 'pratica_cooldown_horas');
    await supabase.from('configuracoes').update({ valor: String(parseFloat(chance) || 0) }).eq('chave', 'pratica_gerar_chance');
    setSalvo(true); setTimeout(() => setSalvo(false), 1800);
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--ambar)' }}>
      <div style={{ display: 'flex', gap: 'var(--espaco-2)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={rotulo}>cooldown do convite (horas)</label>
          <input type="number" value={cooldown} onChange={(e) => setCooldown(e.target.value)} style={campo} />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={rotulo}>chance de gerar nova (0 a 1)</label>
          <input type="number" step="0.05" min="0" max="1" value={chance} onChange={(e) => setChance(e.target.value)} style={campo} />
        </div>
        <button className="botao" onClick={salvar}>salvar</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>salvo.</span>}
      </div>
      <p style={{ margin: 'var(--espaco-1) 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
        cooldown alto = convite mais raro. chance 0 = nunca gera (só serve o banco); 0.25 = renova de vez em quando.
      </p>
    </div>
  );
}

function PraticaEditor({ pratica, onMudou }) {
  const [nome, setNome] = useState(pratica.nome ?? '');
  const [tons, setTons] = useState((pratica.tons ?? []).join(', '));
  const [passos, setPassos] = useState((pratica.passos ?? []).join('\n'));
  const [ancora, setAncora] = useState(pratica.ancora ?? '');
  const [ordem, setOrdem] = useState(pratica.ordem ?? 0);
  const [salvo, setSalvo] = useState(false);

  const pendente = pratica.status === 'rascunho' || pratica.status === 'curadoria';

  function montar(extra) {
    return {
      nome,
      tons: tons.split(',').map((s) => s.trim()).filter(Boolean),
      passos: passos.split('\n').map((s) => s.trim()).filter(Boolean),
      ancora: ancora || null,
      ordem: Number(ordem) || 0,
      ...extra,
    };
  }
  async function salvar() {
    await supabase.from('praticas').update(montar({})).eq('id', pratica.id);
    setSalvo(true); setTimeout(() => setSalvo(false), 1500); onMudou();
  }
  async function aprovar() {
    // Lapida e promove: vira oficial, reutilizável pra todas. Origem passa a curada.
    await supabase.from('praticas').update(montar({ status: 'oficial', origem: 'curada', ativa: true })).eq('id', pratica.id);
    onMudou();
  }
  async function alternarAtiva() {
    await supabase.from('praticas').update({ ativa: !pratica.ativa }).eq('id', pratica.id);
    onMudou();
  }
  async function descartar() {
    if (!window.confirm(`Descartar "${nome}"?`)) return;
    await supabase.from('praticas').update({ status: 'descartado' }).eq('id', pratica.id);
    onMudou();
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${pendente ? 'var(--ambar)' : (pratica.ativa ? 'var(--verde-petroleo)' : 'var(--linha)')}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-2)' }}>
        <strong style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{nome || 'prática'}</strong>
        <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
          {pratica.origem === 'gerada' ? 'gerada' : 'curada'}{pendente ? ` · na fila${pratica.util_count ? ` · ${pratica.util_count} úteis` : ''}` : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        <div><label style={rotulo}>nome</label><input value={nome} onChange={(e) => setNome(e.target.value)} style={campo} /></div>
        <div style={{ display: 'flex', gap: 'var(--espaco-2)', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 220px' }}><label style={rotulo}>tons (vírgula): agitado, bom, soltou, pequena</label><input value={tons} onChange={(e) => setTons(e.target.value)} style={campo} /></div>
          <div style={{ flex: '0 1 90px' }}><label style={rotulo}>ordem</label><input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} style={campo} /></div>
        </div>
        <div><label style={rotulo}>passos (um por linha, na voz da Val)</label><textarea value={passos} onChange={(e) => setPassos(e.target.value)} rows={5} style={{ ...campo, resize: 'vertical' }} /></div>
        <div><label style={rotulo}>âncora (constatação de verdade, nunca decreto)</label><textarea value={ancora} onChange={(e) => setAncora(e.target.value)} rows={2} style={{ ...campo, resize: 'vertical' }} /></div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        {pendente ? (
          <>
            <button className="botao" onClick={aprovar}>aprovar</button>
            <button className="botao-suave" onClick={salvar}>salvar rascunho</button>
            <button onClick={descartar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', marginLeft: 'auto' }}>descartar</button>
          </>
        ) : (
          <>
            <button className="botao" onClick={salvar}>salvar</button>
            <button className="botao-suave" onClick={alternarAtiva}>{pratica.ativa ? 'ativa' : 'inativa'}</button>
            <button onClick={descartar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', marginLeft: 'auto' }}>descartar</button>
          </>
        )}
        {salvo && <span style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>salvo.</span>}
      </div>
    </div>
  );
}
