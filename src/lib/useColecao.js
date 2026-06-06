import { useEffect, useState } from 'react';
import { db } from './db';

/*
 * Hooks finos sobre a camada de dados (lib/db.js). Carregam ao montar e
 * recarregam ao ouvir 'val:data', emitido a cada escrita. Como db.js é async
 * (pode ser Supabase ou localStorage), estes hooks lidam com a Promise — as
 * seções continuam só lendo o array/objeto pronto.
 */

export function useColecao(nome) {
  const [itens, setItens] = useState([]);
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      db.listar(nome)
        .then((r) => { if (vivo) setItens(r); })
        .catch((e) => console.warn(`Val: falha ao ler "${nome}" —`, e?.message ?? e));
    carregar();
    window.addEventListener('val:data', carregar);
    return () => { vivo = false; window.removeEventListener('val:data', carregar); };
  }, [nome]);
  return itens;
}

export function usePerfil() {
  const [perfil, setPerfil] = useState({ valores: [], conquistas: [], foco: [], elevadores: [] });
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      db.perfil()
        .then((p) => { if (vivo) setPerfil(p); })
        .catch((e) => console.warn('Val: falha ao ler perfil —', e?.message ?? e));
    carregar();
    window.addEventListener('val:data', carregar);
    return () => { vivo = false; window.removeEventListener('val:data', carregar); };
  }, []);
  return perfil;
}
