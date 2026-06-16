import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/*
 * Admin do Fechamento de Dia (só curadora). Edita o banco inteiro: as cinco
 * dimensões (nome, destino onde a resposta pousa, ativa) e suas perguntas, mais
 * a pergunta de soltar e quantas dimensões por noite. Escreve direto nas tabelas
 * fechamento_dimensoes / fechamento_perguntas / configuracoes (RLS de curadora).
 */
const campo = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '9px var(--espaco-2)', background: 'var(--papel)' };
const rotulo = { display: 'block', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 4px' };

export default function AdminFechamento() {
  const [dimensoes, setDimensoes] = useState([]);
  const [aberta, setAberta] = useState(null);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('fechamento_dimensoes').select('*').order('ordem');
    setDimensoes(data ?? []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function nova() {
    await supabase.from('fechamento_dimensoes').insert({
      slug: `dim-${Date.now()}`, nome: 'Nova dimensão', destino_colecao: 'diario', destino_cat: 'resumo', ordem: dimensoes.length + 1, ativa: false,
    });
    await carregar();
  }

  return (
    <div style={{ marginTop: 'var(--espaco-3)' }}>
      <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
        O banco do fim de dia: as dimensões, onde cada resposta pousa, e as perguntas. A cada noite a Val sorteia algumas dimensões e uma pergunta de cada.
      </p>
      <Config />
      <button className="botao-suave" onClick={nova} style={{ margin: 'var(--espaco-2) 0 var(--espaco-3)' }}>nova dimensão</button>
      <div style={{ display: 'grid', gap: 'var(--espaco-3)' }}>
        {dimensoes.map((d) => (
          <DimensaoEditor key={d.id} dim={d} aberta={aberta === d.id}
            onToggle={() => setAberta(aberta === d.id ? null : d.id)} onMudou={carregar} />
        ))}
      </div>
    </div>
  );
}

function Config() {
  const [soltar, setSoltar] = useState('');
  const [porNoite, setPorNoite] = useState('4');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    supabase.from('configuracoes').select('chave, valor')
      .in('chave', ['fechamento_soltar_pergunta', 'fechamento_dimensoes_por_noite'])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));
        setSoltar(m.fechamento_soltar_pergunta ?? '');
        setPorNoite(m.fechamento_dimensoes_por_noite ?? '4');
      });
  }, []);

  async function salvar() {
    await supabase.from('configuracoes').update({ valor: soltar }).eq('chave', 'fechamento_soltar_pergunta');
    await supabase.from('configuracoes').update({ valor: String(parseInt(porNoite, 10) || 4) }).eq('chave', 'fechamento_dimensoes_por_noite');
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--ambar)' }}>
      <label style={rotulo}>a pergunta de soltar (a que esvazia, fixa no fim)</label>
      <textarea value={soltar} onChange={(e) => setSoltar(e.target.value)} rows={2} style={{ ...campo, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 'var(--espaco-2)', alignItems: 'flex-end', marginTop: 'var(--espaco-2)', flexWrap: 'wrap' }}>
        <div style={{ width: 160 }}>
          <label style={rotulo}>dimensões por noite</label>
          <input type="number" value={porNoite} onChange={(e) => setPorNoite(e.target.value)} style={campo} />
        </div>
        <button className="botao" onClick={salvar}>salvar</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>salvo.</span>}
      </div>
    </div>
  );
}

function DimensaoEditor({ dim, aberta, onToggle, onMudou }) {
  const [f, setF] = useState(dim);
  const [salvo, setSalvo] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function salvar() {
    await supabase.from('fechamento_dimensoes').update({
      nome: f.nome, slug: f.slug, destino_colecao: f.destino_colecao, destino_cat: f.destino_cat, ordem: Number(f.ordem) || 0,
    }).eq('id', dim.id);
    setSalvo(true); setTimeout(() => setSalvo(false), 1500); onMudou();
  }
  async function alternar() {
    await supabase.from('fechamento_dimensoes').update({ ativa: !f.ativa }).eq('id', dim.id);
    setF({ ...f, ativa: !f.ativa }); onMudou();
  }
  async function apagar() {
    if (!window.confirm(`Apagar a dimensão "${f.nome}" e suas perguntas?`)) return;
    await supabase.from('fechamento_dimensoes').delete().eq('id', dim.id); onMudou();
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${f.ativa ? 'var(--ambar)' : 'var(--linha)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-2)' }}>
        <strong style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{f.nome}</strong>
        <button className="botao-suave" onClick={alternar}>{f.ativa ? 'ativa' : 'inativa'}</button>
      </div>
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        <div><label style={rotulo}>nome</label><input value={f.nome ?? ''} onChange={set('nome')} style={campo} /></div>
        <div style={{ display: 'flex', gap: 'var(--espaco-2)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={rotulo}>guardar em</label>
            <select value={f.destino_colecao} onChange={set('destino_colecao')} style={campo}>
              <option value="diario">Diário</option>
              <option value="prosperidade">Prosperidade (Hoje)</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={rotulo}>{f.destino_colecao === 'prosperidade' ? 'tipo (use "hoje")' : 'categoria do diário'}</label>
            <input value={f.destino_cat ?? ''} onChange={set('destino_cat')} style={campo} placeholder="ex.: gratidao, orgulho, riso, pessoas" />
          </div>
          <div style={{ flex: '0 1 90px' }}><label style={rotulo}>ordem</label><input type="number" value={f.ordem ?? ''} onChange={set('ordem')} style={campo} /></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="botao" onClick={salvar}>salvar</button>
        <button className="botao-suave" onClick={onToggle}>{aberta ? 'fechar perguntas' : 'editar perguntas'}</button>
        <button onClick={apagar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', marginLeft: 'auto' }}>apagar</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>salvo.</span>}
      </div>
      {aberta && <Perguntas dimensaoId={dim.id} />}
    </div>
  );
}

function Perguntas({ dimensaoId }) {
  const [perguntas, setPerguntas] = useState([]);
  const carregar = useCallback(async () => {
    const { data } = await supabase.from('fechamento_perguntas').select('*').eq('dimensao_id', dimensaoId).order('ordem');
    setPerguntas(data ?? []);
  }, [dimensaoId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function nova() {
    const ordem = (perguntas.at(-1)?.ordem ?? 0) + 1;
    await supabase.from('fechamento_perguntas').insert({ dimensao_id: dimensaoId, texto: 'nova pergunta', ordem });
    await carregar();
  }

  return (
    <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)' }}>
      <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-2)' }}>As perguntas desta dimensão. A cada noite, a Val sorteia uma delas.</p>
      <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
        {perguntas.map((p) => <PerguntaLinha key={p.id} pergunta={p} onMudou={carregar} />)}
      </div>
      <button className="botao-suave" onClick={nova} style={{ marginTop: 'var(--espaco-2)' }}>+ pergunta</button>
    </div>
  );
}

function PerguntaLinha({ pergunta, onMudou }) {
  const [texto, setTexto] = useState(pergunta.texto);
  const [ativa, setAtiva] = useState(pergunta.ativa);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    await supabase.from('fechamento_perguntas').update({ texto, ativa }).eq('id', pergunta.id);
    setSalvo(true); setTimeout(() => setSalvo(false), 1500); onMudou();
  }
  async function remover() {
    if (!window.confirm('Remover esta pergunta?')) return;
    await supabase.from('fechamento_perguntas').delete().eq('id', pergunta.id); onMudou();
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'flex-start' }}>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} style={{ ...campo, flex: 1, resize: 'vertical' }} />
      <div style={{ display: 'grid', gap: 4, paddingTop: 2 }}>
        <label style={{ fontSize: 'var(--corpo-pequeno)', color: 'var(--tinta-suave)', display: 'flex', gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} /> ativa
        </label>
        <button className="botao-suave" onClick={salvar} style={{ padding: '6px 12px' }}>salvar</button>
        <button onClick={remover} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: 'var(--corpo-pequeno)' }}>remover</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>salvo</span>}
      </div>
    </div>
  );
}
