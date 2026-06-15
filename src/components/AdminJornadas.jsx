import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/*
 * Admin das Jornadas da Prosperidade (só curadora, dentro da Caixa da Valéria).
 *
 * Aqui a Valéria edita TUDO, sem tocar em código: título, o que é, o convite, o
 * nº de dias, o ritmo, ativa/inativa, a fronteira de voz, e o ARCO (a intenção
 * de cada dia). Escreve direto nas tabelas `prosperidade_jornadas` e
 * `prosperidade_jornada_arcos`, protegidas por RLS de curadora.
 */
const campo = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '9px var(--espaco-2)', background: 'var(--papel)' };
const rotulo = { display: 'block', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 4px' };

export default function AdminJornadas() {
  const [jornadas, setJornadas] = useState([]);
  const [arcoAberto, setArcoAberto] = useState(null);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('prosperidade_jornadas').select('*').order('ordem');
    setJornadas(data ?? []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function nova() {
    await supabase.from('prosperidade_jornadas').insert({
      slug: `jornada-${Date.now()}`, titulo: 'Nova jornada', dias: 7, ordem: jornadas.length + 1, ativa: false,
    });
    await carregar();
  }

  return (
    <div style={{ marginTop: 'var(--espaco-3)' }}>
      <p style={{ color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
        As jornadas e os arcos vivem aqui. Edite à vontade, nada está preso no código. Inativa não aparece pra elas.
      </p>
      <button className="botao-suave" onClick={nova} style={{ marginBottom: 'var(--espaco-3)' }}>nova jornada</button>
      <div style={{ display: 'grid', gap: 'var(--espaco-3)' }}>
        {jornadas.map((j) => (
          <JornadaEditor key={j.id} jornada={j} arcoAberto={arcoAberto === j.id}
            onToggleArco={() => setArcoAberto(arcoAberto === j.id ? null : j.id)} onMudou={carregar} />
        ))}
      </div>
    </div>
  );
}

function JornadaEditor({ jornada, arcoAberto, onToggleArco, onMudou }) {
  const [f, setF] = useState(jornada);
  const [salvo, setSalvo] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function salvar() {
    await supabase.from('prosperidade_jornadas').update({
      slug: f.slug, titulo: f.titulo, subtitulo: f.subtitulo, convite: f.convite,
      dias: Number(f.dias) || 1, intervalo_horas: Number(f.intervalo_horas) || 0,
      fronteira: f.fronteira || null, ordem: Number(f.ordem) || 0,
    }).eq('id', jornada.id);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
    onMudou();
  }
  async function alternarAtiva() {
    await supabase.from('prosperidade_jornadas').update({ ativa: !f.ativa }).eq('id', jornada.id);
    setF({ ...f, ativa: !f.ativa });
    onMudou();
  }
  async function apagar() {
    if (!window.confirm(`Apagar a jornada "${f.titulo}" e todo o seu arco? Isto não apaga percursos já feitos pelas mulheres.`)) return;
    await supabase.from('prosperidade_jornadas').delete().eq('id', jornada.id);
    onMudou();
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${f.ativa ? 'var(--ambar)' : 'var(--linha)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--espaco-2)', alignItems: 'center', marginBottom: 'var(--espaco-2)' }}>
        <strong style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{f.titulo}</strong>
        <button className="botao-suave" onClick={alternarAtiva}>{f.ativa ? 'ativa' : 'inativa'}</button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        <div><label style={rotulo}>título</label><input value={f.titulo ?? ''} onChange={set('titulo')} style={campo} /></div>
        <div><label style={rotulo}>o que é (uma linha)</label><input value={f.subtitulo ?? ''} onChange={set('subtitulo')} style={campo} /></div>
        <div><label style={rotulo}>convite (o contrato de entrada)</label><textarea value={f.convite ?? ''} onChange={set('convite')} rows={3} style={{ ...campo, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 'var(--espaco-2)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 90px' }}><label style={rotulo}>dias</label><input type="number" value={f.dias ?? ''} onChange={set('dias')} style={campo} /></div>
          <div style={{ flex: '1 1 90px' }}><label style={rotulo}>ritmo (horas)</label><input type="number" value={f.intervalo_horas ?? ''} onChange={set('intervalo_horas')} style={campo} /></div>
          <div style={{ flex: '1 1 90px' }}><label style={rotulo}>ordem</label><input type="number" value={f.ordem ?? ''} onChange={set('ordem')} style={campo} /></div>
          <div style={{ flex: '2 1 140px' }}><label style={rotulo}>slug</label><input value={f.slug ?? ''} onChange={set('slug')} style={campo} /></div>
        </div>
        <div>
          <label style={rotulo}>fronteira de voz (injetada na geração; ex.: limite do "não cobra")</label>
          <textarea value={f.fronteira ?? ''} onChange={set('fronteira')} rows={2} style={{ ...campo, resize: 'vertical' }} />
        </div>
        <p style={{ margin: 0, color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
          ritmo 0 = sem espera entre dias (útil pra testar a jornada inteira de uma vez).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="botao" onClick={salvar}>salvar</button>
        <button className="botao-suave" onClick={onToggleArco}>{arcoAberto ? 'fechar o arco' : 'editar o arco'}</button>
        <button onClick={apagar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', marginLeft: 'auto' }}>apagar</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>salvo.</span>}
      </div>

      {arcoAberto && <ArcoEditor jornadaId={jornada.id} />}
    </div>
  );
}

function ArcoEditor({ jornadaId }) {
  const [arcos, setArcos] = useState([]);
  const carregar = useCallback(async () => {
    const { data } = await supabase.from('prosperidade_jornada_arcos').select('*').eq('jornada_id', jornadaId).order('dia');
    setArcos(data ?? []);
  }, [jornadaId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function novoDia() {
    const dia = (arcos.at(-1)?.dia ?? 0) + 1;
    await supabase.from('prosperidade_jornada_arcos').insert({ jornada_id: jornadaId, dia, prompt: 'nova pergunta do dia' });
    await carregar();
  }

  return (
    <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)' }}>
      <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-2)' }}>
        A intenção de cada dia. O último, marcado como fechamento, é a devolutiva que lê a jornada inteira.
      </p>
      <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
        {arcos.map((a) => <ArcoLinha key={a.id} arco={a} onMudou={carregar} />)}
      </div>
      <button className="botao-suave" onClick={novoDia} style={{ marginTop: 'var(--espaco-2)' }}>+ dia</button>
    </div>
  );
}

function ArcoLinha({ arco, onMudou }) {
  const [prompt, setPrompt] = useState(arco.prompt);
  const [tarefa, setTarefa] = useState(arco.tarefa ?? '');
  const [fechamento, setFechamento] = useState(arco.fechamento);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    await supabase.from('prosperidade_jornada_arcos').update({ prompt, tarefa: tarefa || null, fechamento }).eq('id', arco.id);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
    onMudou();
  }
  async function remover() {
    if (!window.confirm(`Remover o dia ${arco.dia}?`)) return;
    await supabase.from('prosperidade_jornada_arcos').delete().eq('id', arco.id);
    onMudou();
  }

  return (
    <div className="card" style={{ padding: 'var(--espaco-2)', background: 'var(--papel)' }}>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ color: 'var(--verde-petroleo)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>dia {arco.dia}</strong>
        <label style={{ fontSize: 'var(--corpo-pequeno)', color: 'var(--tinta-suave)', display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <input type="checkbox" checked={fechamento} onChange={(e) => setFechamento(e.target.checked)} /> é o fechamento
        </label>
      </div>
      <label style={rotulo}>a pergunta (provoca)</label>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} style={{ ...campo, resize: 'vertical' }} />
      {!fechamento && (
        <div style={{ marginTop: 'var(--espaco-1)' }}>
          <label style={rotulo}>a tarefa (move): o micro-gesto até o dia seguinte, leve e factível, nunca estruturante</label>
          <textarea value={tarefa} onChange={(e) => setTarefa(e.target.value)} rows={2} style={{ ...campo, resize: 'vertical' }} placeholder="ex.: hoje, descanse 15 minutos sem ter terminado nada antes, só porque sim." />
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-1)', alignItems: 'center' }}>
        <button className="botao-suave" onClick={salvar} style={{ padding: '6px 14px' }}>salvar</button>
        <button onClick={remover} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: 'var(--corpo-pequeno)' }}>remover</button>
        {salvo && <span style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>salvo</span>}
      </div>
    </div>
  );
}
