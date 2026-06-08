import { useState, useRef, useEffect } from 'react';
import Secao from '../components/Secao';
import { conversarComVal } from '../lib/val';
import { hasSupabase } from '../lib/supabase';

/*
 * Conversar — chat com a Val (seção 6), ciente do estado de chegada e do
 * contexto pessoal (puxado no backend, sob RLS). A Val ouve, lúcida e calorosa,
 * com uma pergunta de cada vez.
 *
 * As mensagens vivem no estado da visita (não persistem ainda) — uma tabela de
 * conversas pode entrar depois, se fizer sentido para a Trajetória.
 */
export default function Conversar({ chegada, mensagemInicial, onMensagemConsumida }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState(null);
  const fim = useRef(null);
  const inicialEnviada = useRef(false);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, pensando]);

  // Mensagem semeada por uma ação de chegada (ex.: "Cheguei pesada hoje.").
  useEffect(() => {
    if (mensagemInicial && !inicialEnviada.current) {
      inicialEnviada.current = true;
      enviarTexto(mensagemInicial);
      onMensagemConsumida?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagemInicial]);

  function enviar(e) {
    e.preventDefault();
    enviarTexto(texto);
  }

  async function enviarTexto(bruto) {
    const t = (bruto ?? '').trim();
    if (!t || pensando) return;

    const novas = [...mensagens, { role: 'user', text: t }];
    setMensagens(novas);
    setTexto('');
    setErro(null);
    setPensando(true);

    try {
      const resposta = await conversarComVal(novas, chegada);
      setMensagens([...novas, { role: 'assistant', text: resposta }]);
    } catch (err) {
      // Sem inventar conteúdo: uma frase sóbria, na voz da Val, e fica.
      setErro(
        err?.message === 'sem-backend'
          ? 'A conversa com a Val ainda não está ligada aqui. Quando o backend estiver configurado, eu te ouço.'
          : 'Não consegui responder agora. Respira — daqui a pouco eu volto.'
      );
    } finally {
      setPensando(false);
    }
  }

  return (
    <Secao titulo="Conversar" abertura="Estou aqui. Pode falar do jeito que vier.">
      {!hasSupabase && (
        <div className="card" style={{ color: 'var(--tinta-suave)', marginBottom: 'var(--espaco-2)' }}>
          <p style={{ margin: 0 }}>
            A conversa com a Val precisa do backend configurado para responder.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-3)' }}>
        {mensagens.map((m, i) => (
          <Balao key={i} role={m.role} text={m.text} />
        ))}
        {pensando && (
          <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
            A Val está aqui…
          </p>
        )}
        {erro && (
          <p style={{ color: 'var(--tinta-suave)' }}>{erro}</p>
        )}
        <div ref={fim} />
      </div>

      <form onSubmit={enviar} style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) enviar(e);
          }}
          rows={3}
          placeholder="Escreve aqui."
          style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel-branco)' }}
        />
        <div>
          <button type="submit" className="botao" disabled={pensando || !texto.trim()}>
            Enviar
          </button>
        </div>
      </form>
    </Secao>
  );
}

// A mulher fala em card de papel; a Val responde em itálico editorial, na voz dela.
function Balao({ role, text }) {
  if (role === 'assistant') {
    return (
      <p
        style={{
          fontFamily: 'var(--fonte-titulo)',
          fontStyle: 'italic',
          fontSize: 'var(--titulo-sm)',
          color: 'var(--verde-petroleo)',
          margin: 0,
          maxWidth: '52ch',
        }}
      >
        {text}
      </p>
    );
  }
  return (
    <div
      className="card"
      style={{ padding: '12px var(--espaco-2)', justifySelf: 'end', maxWidth: '46ch', background: 'var(--papel)' }}
    >
      {text}
    </div>
  );
}
