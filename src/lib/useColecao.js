import { useEffect, useState } from 'react';
import { storage } from './storage';

/*
 * Hooks finos sobre o storage. Reagem ao evento 'val:storage' emitido a cada
 * gravação, então a UI se atualiza sem um framework de estado. Quando o backend
 * virar Supabase, troca-se a fonte aqui dentro sem mexer nas seções.
 */

export function useColecao(nome) {
  const [itens, setItens] = useState(() => storage.listar(nome));
  useEffect(() => {
    const atualizar = () => setItens(storage.listar(nome));
    window.addEventListener('val:storage', atualizar);
    return () => window.removeEventListener('val:storage', atualizar);
  }, [nome]);
  return itens;
}

export function usePerfil() {
  const [perfil, setPerfil] = useState(() => storage.perfil());
  useEffect(() => {
    const atualizar = () => setPerfil(storage.perfil());
    window.addEventListener('val:storage', atualizar);
    return () => window.removeEventListener('val:storage', atualizar);
  }, []);
  return perfil;
}
