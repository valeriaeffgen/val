/*
 * Registro das seções, na ordem da navegação (seção 6):
 * do socorro imediato ao panorama.
 * Limiar (chegada) fica fora daqui — é o ritual de entrada, antes da navegação.
 */
import Conversar from './Conversar';
import ComoLidar from './ComoLidar';
import Soltar from './Soltar';
import OlharPraDentro from './OlharPraDentro';
import Autoamor from './Autoamor';
import Prosperidade from './Prosperidade';
import Diario from './Diario';
import FechamentoDia from './FechamentoDia';
import Cartas from './Cartas';
import Trajetoria from './Trajetoria';
import MeuCentro from './MeuCentro';

export const SECOES = [
  { id: 'conversar', rotulo: 'Conversar', Componente: Conversar },
  { id: 'como-lidar', rotulo: 'Como lidar', Componente: ComoLidar },
  { id: 'soltar', rotulo: 'Soltar', Componente: Soltar },
  { id: 'olhar-pra-dentro', rotulo: 'Olhar pra dentro', Componente: OlharPraDentro },
  { id: 'autoamor', rotulo: 'Autoamor', Componente: Autoamor },
  { id: 'prosperidade', rotulo: 'Prosperidade', Componente: Prosperidade },
  { id: 'diario', rotulo: 'Diário', Componente: Diario },
  { id: 'fechar-dia', rotulo: 'Fechar o dia', Componente: FechamentoDia },
  { id: 'cartas', rotulo: 'Cartas', Componente: Cartas },
  { id: 'trajetoria', rotulo: 'Trajetória', Componente: Trajetoria },
  { id: 'meu-centro', rotulo: 'Meu Centro', Componente: MeuCentro },
];
