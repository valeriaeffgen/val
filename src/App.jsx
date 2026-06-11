import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Limiar from './sections/Limiar';
import BoasVindas from './sections/BoasVindas';
import Chegada from './components/Chegada';
import Pausa from './components/Pausa';
import CapturaSaida from './components/CapturaSaida';
import Videos from './sections/Videos';
import Mural from './sections/Mural';
import Caixa from './sections/Caixa';
import Entrada from './sections/Entrada';
import Politica from './sections/Politica';
import GratidaoWidget from './components/GratidaoWidget';
import { SECOES } from './sections';
import { db } from './lib/db';
import { registrarConsentimento } from './lib/consent';
import { supabase, hasSupabase } from './lib/supabase';
import { PAUSA_PERGUNTAS } from './data/seed';

// Caixa de entrada da Valéria: acessível por /?caixa (sem login anônimo).
const MODO_CAIXA = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('caixa');

// Gratidão é transversal e CONVITE, nunca cobrança. Vive numa bolha discreta no
// canto, presente o tempo todo (presença passiva, não cobrança). Os gatilhos
// (chegar pesada, reclamar) só pedem que a faixa abra, sem modal no meio da tela.

// A primeira visita (boas-vindas) acontece uma vez. Marcamos quando ela já foi
// vista (concluída ou adiada) para não reaparecer a cada entrada.
const BOAS_VINDAS_KEY = 'val.boasvindas';
function boasVindasVistas() {
  try { return localStorage.getItem(BOAS_VINDAS_KEY) === '1'; } catch { return false; }
}
function marcarBoasVindas() {
  try { localStorage.setItem(BOAS_VINDAS_KEY, '1'); } catch { /* ignore */ }
}

// Sorteia n itens de um array (para os elevadores na chegada).
function pick(arr, n) {
  const copia = [...(arr || [])];
  const fora = [];
  while (copia.length && fora.length < n) fora.push(copia.splice(Math.floor(Math.random() * copia.length), 1)[0]);
  return fora;
}

// Monta o painel de chegada adaptado ao estado (do protótipo da Valéria).
function montarResposta(vibe, elevadores, palavras) {
  const palavra = palavras.length ? palavras[Math.floor(Math.random() * palavras.length)].text : null;
  if (vibe === 'pesada') {
    return {
      frase: 'Você chegou. Isso já é movimento.',
      sub: 'Nada pra resolver agora. Só subir um degrau.',
      elevadores: pick(elevadores, 2),
      palavra,
      oferecerGratidao: true, // chegar pesada: oferecer reler a gratidão (alívio)
      acoes: [
        { label: 'Pausa de 1 minuto', tipo: 'pausa' },
        { label: 'Ver o que já é', tipo: 'secao', secao: 'meu-centro' },
        { label: 'Conversar com a Val', tipo: 'chat', msg: 'Cheguei pesada hoje.' },
      ],
    };
  }
  if (vibe === 'agitada') {
    return {
      frase: 'Nada precisa ser resolvido neste minuto.',
      sub: 'A pressa é a falta vestida de urgência.',
      elevadores: [],
      acoes: [
        { label: 'Pausa de 1 minuto', tipo: 'pausa' },
        { label: 'Esvaziar a mente', tipo: 'secao', secao: 'soltar' },
        { label: 'Reduzir para uma coisa só', tipo: 'chat', msg: 'Estou agitada, querendo fazer tudo ao mesmo tempo. Me ajuda a reduzir para uma coisa só.' },
      ],
    };
  }
  if (vibe === 'neutra') {
    return {
      frase: 'Neutro é solo fértil.',
      sub: 'Daqui, qualquer beleza notada já eleva.',
      elevadores: pick(elevadores, 1),
      acoes: [
        { label: 'Registrar uma beleza', tipo: 'diario', cat: 'beleza' },
        { label: 'Conversar com a Val', tipo: 'chat', msg: 'Cheguei neutra hoje. Quero subir um pouco.' },
      ],
    };
  }
  return {
    frase: 'Que bom te ver assim.',
    sub: 'Ancora a fórmula: o que te trouxe até aqui?',
    elevadores: [],
    ancorar: true,
    acoes: [
      { label: 'Registrar gratidão', tipo: 'diario', cat: 'beleza' },
    ],
  };
}

export default function App() {
  const [entrou, setEntrou] = useState(false);
  const [vibe, setVibe] = useState(null);
  const [resposta, setResposta] = useState(null);
  const [secaoId, setSecaoId] = useState(null);
  const [sessaoId, setSessaoId] = useState(null);
  const [saindo, setSaindo] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [pausaQ, setPausaQ] = useState(PAUSA_PERGUNTAS[0]);
  const [mensagemInicial, setMensagemInicial] = useState(null);
  const [diarioCat, setDiarioCat] = useState(null);
  // A bolha de gratidão fica sempre presente; isto só conta os pedidos de
  // abertura vindos dos gatilhos (chegar pesada, reclamar).
  const [aberturaGrat, setAberturaGrat] = useState(0);

  function pedirGratidao() {
    setAberturaGrat((n) => n + 1);
  }

  // Autenticação por e-mail: a sessão decide se mostramos a Entrada ou o app.
  const [authCarregando, setAuthCarregando] = useState(hasSupabase);
  const [sessao, setSessao] = useState(null);

  // Primeira visita: null = ainda decidindo, true = acolher, false = seguir.
  const [acolhimento, setAcolhimento] = useState(null);

  function concluirAcolhimento() {
    marcarBoasVindas();
    setAcolhimento(false);
  }

  // Decide (uma vez) se esta é uma primeira visita: já vista antes? perfil vazio?
  // Só roda quando dá pra ler o perfil (sessão pronta, quando há backend).
  useEffect(() => {
    if (MODO_CAIXA || acolhimento !== null) return;
    if (hasSupabase && (authCarregando || !sessao)) return;
    if (boasVindasVistas()) { setAcolhimento(false); return; }
    db.perfil().then((p) => {
      const temAlgo = ['valores', 'conquistas', 'foco', 'elevadores'].some((c) => (p?.[c]?.length ?? 0) > 0);
      if (temAlgo) { marcarBoasVindas(); setAcolhimento(false); }
      else setAcolhimento(true);
    }).catch(() => setAcolhimento(false));
  }, [acolhimento, authCarregando, sessao]);

  useEffect(() => {
    if (!hasSupabase || MODO_CAIXA) { setAuthCarregando(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setAuthCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Com sessão viva, grava a prova do consentimento (LGPD), uma vez por versão.
  useEffect(() => {
    if (sessao) registrarConsentimento();
  }, [sessao]);

  async function aoChegar(vibeId) {
    setEntrou(true);
    setVibe(vibeId);
    setSecaoId(null);
    setMensagemInicial(null);
    setDiarioCat(null);
    const sessao = await db.registrarSessao({ entrada: vibeId }).catch(() => null);
    setSessaoId(sessao?.id ?? null);
    const perfil = await db.perfil().catch(() => ({ elevadores: [] }));
    const palavras = await db.listar('palavras').catch(() => []);
    setResposta(montarResposta(vibeId, perfil?.elevadores ?? [], palavras));
    // Gatilho: chegar pesada é um momento de gratidão. Convite, nunca cobrança.
    if (vibeId === 'pesada') pedirGratidao();
  }

  function aoPular() {
    setEntrou(true);
    setVibe(null);
    setResposta(null);
    setSecaoId('conversar');
  }

  function abrirPausa(pergunta) {
    setPausaQ(pergunta || PAUSA_PERGUNTAS[Math.floor(Math.random() * PAUSA_PERGUNTAS.length)]);
    setPausa(true);
  }

  // Navegação pedida por uma seção (ex.: os caminhos do Como lidar).
  function navegar({ secao, mensagem = null, cat = null }) {
    setResposta(null);
    setMensagemInicial(mensagem);
    setDiarioCat(cat);
    setSecaoId(secao);
  }

  function onAcao(a) {
    if (a.tipo === 'pausa') return abrirPausa();
    if (a.tipo === 'diario') return navegar({ secao: 'diario', cat: a.cat });
    if (a.tipo === 'chat') return navegar({ secao: 'conversar', mensagem: a.msg });
    navegar({ secao: a.secao });
  }

  async function ancorar(texto) {
    const perfil = await db.perfil().catch(() => ({ elevadores: [] }));
    const lista = perfil?.elevadores ?? [];
    if (!lista.some((e) => e.toLowerCase() === texto.toLowerCase())) {
      await db.salvarPerfil({ elevadores: [...lista, texto] }).catch(() => {});
    }
    setResposta(null);
    setSecaoId('conversar');
  }

  async function aoSair(saidaId) {
    if (sessaoId) await db.atualizar('sessoes', sessaoId, { saida: saidaId }).catch(() => {});
  }

  function encerrarVisita() {
    setSaindo(false);
    setEntrou(false);
    setVibe(null);
    setResposta(null);
    setSecaoId(null);
    setSessaoId(null);
    setMensagemInicial(null);
    setDiarioCat(null);
  }

  if (MODO_CAIXA) {
    return <Caixa />;
  }

  // Porta de entrada por e-mail (quando há backend). Sem backend, segue local.
  if (hasSupabase) {
    if (authCarregando) {
      return <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--tinta-suave)' }}>um instante…</p></section>;
    }
    if (!sessao) {
      return <Entrada />;
    }
  }

  if (!entrou) {
    // Primeira impressão da Val: o acolhimento de boas-vindas vem antes da
    // chegada. Enquanto decidimos, um instante de respiro (evita piscar).
    if (acolhimento === null) {
      return <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--tinta-suave)' }}>um instante…</p></section>;
    }
    if (acolhimento) {
      return <BoasVindas onConcluir={concluirAcolhimento} />;
    }
    return <Limiar onChegar={aoChegar} onPular={aoPular} />;
  }

  if (saindo) {
    return <CapturaSaida entrada={vibe} onRegistrar={aoSair} onFechar={encerrarVisita} />;
  }

  const secao = SECOES.find((s) => s.id === secaoId);

  const irVideos = () => { setResposta(null); setSecaoId('videos'); };
  const irPolitica = () => { setResposta(null); setSecaoId('politica'); };

  return (
    <div className="val-app" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Nav
        atual={secaoId}
        onIr={(id) => { setResposta(null); if (id) setSecaoId(id); else { setEntrou(false); setVibe(null); } }}
        estado={vibe}
        onVideos={irVideos}
        onPolitica={irPolitica}
        onEncerrar={() => setSaindo(true)}
      />

      {pausa && <Pausa pergunta={pausaQ} onFechar={() => setPausa(false)} />}

      <main style={{ flex: 1, width: '100%' }}>
        {resposta ? (
          <Chegada resposta={resposta} onAcao={onAcao} onAncorar={ancorar} onNavegar={navegar} />
        ) : secaoId === 'videos' ? (
          <Videos />
        ) : secaoId === 'mural' ? (
          <Mural onNavegar={navegar} />
        ) : secaoId === 'politica' ? (
          <Politica onVoltar={() => setSecaoId('meu-centro')} />
        ) : secao ? (
          <secao.Componente
            chegada={vibe ? { id: vibe } : null}
            mensagemInicial={mensagemInicial}
            onMensagemConsumida={() => setMensagemInicial(null)}
            catInicial={diarioCat}
            onNavegar={navegar}
            onPausa={abrirPausa}
            onGratidao={() => pedirGratidao()}
            sessao={sessao}
          />
        ) : null}
      </main>

      {/* Rodapé discreto (parte 5): menos peso que as ações principais.
          No celular ele se esconde, e os mesmos itens vivem na folha "Mais". */}
      <footer className="val-footer">
        <button onClick={irVideos}>Vídeos</button>
        <button onClick={irPolitica}>Privacidade</button>
        <button onClick={() => setSaindo(true)}>Encerrar visita</button>
      </footer>

      <GratidaoWidget pedidoAbertura={aberturaGrat} />
    </div>
  );
}
