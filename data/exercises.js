/* ==========================================================================
   FitAdapt — Biblioteca de exercícios (Passo 3)
   Campos:
     id, nome
     grupo      -> grupo muscular primário (base para o algoritmo e substituição)
     sec        -> grupos secundários
     mov        -> padrão de movimento (equilíbrio empurrar/puxar na ficha)
     tipo       -> composto | isolado | cardio
     equip      -> equipamentos NECESSÁRIOS (todos precisam estar disponíveis)
     nivel      -> 1 fácil · 2 médio · 3 avançado
     ico        -> emoji placeholder (foto real entra no Passo 4)
     repsFixo   -> quando o exercício usa tempo/valor próprio (prancha, cardio)
     instr      -> passo a passo de execução
   ========================================================================== */

/* Meta dos grupos musculares — cor do "card foto" e rótulo */
const GROUPS = {
  peito:      { label: 'Peito',       cor: '#ff7a45' },
  costas:     { label: 'Costas',      cor: '#6c8cff' },
  ombro:      { label: 'Ombro',       cor: '#f2c14e' },
  biceps:     { label: 'Bíceps',      cor: '#22d39a' },
  triceps:    { label: 'Tríceps',     cor: '#14b8a6' },
  quadriceps: { label: 'Quadríceps',  cor: '#ff5470' },
  posterior:  { label: 'Posteriores', cor: '#9b6cff' },
  gluteos:    { label: 'Glúteos',     cor: '#ff8fb0' },
  adutores:   { label: 'Adutores',    cor: '#4cc9f0' },
  panturrilha:{ label: 'Panturrilha', cor: '#7ee081' },
  core:       { label: 'Core',        cor: '#ffcf5c' },
  cardio:     { label: 'Cardio',      cor: '#ff6b6b' },
};

const EXERCISES = [
  /* ------------------------------- PEITO ------------------------------- */
  { id:'supino_reto_barra', nome:'Supino reto com barra', grupo:'peito', sec:['triceps','ombro'], mov:'empurrar_horizontal', tipo:'composto', equip:['barra','banco'], nivel:2, ico:'🏋️',
    instr:['Deite no banco com os pés firmes no chão.','Pegada um pouco mais aberta que os ombros.','Desça a barra até o peito e empurre até estender os braços.'] },
  { id:'supino_reto_halter', nome:'Supino reto com halteres', grupo:'peito', sec:['triceps','ombro'], mov:'empurrar_horizontal', tipo:'composto', equip:['halteres','banco'], nivel:2, ico:'💪',
    instr:['Deite com um halter em cada mão sobre o peito.','Desça controlando até a linha do peito.','Empurre unindo levemente os halteres no topo.'] },
  { id:'supino_inclinado_halter', nome:'Supino inclinado com halteres', grupo:'peito', sec:['ombro','triceps'], mov:'empurrar_horizontal', tipo:'composto', equip:['halteres','banco'], nivel:2, ico:'📐',
    instr:['Ajuste o banco em ~30-45°.','Desça os halteres na linha da parte alta do peito.','Empurre sem travar os cotovelos.'] },
  { id:'flexao', nome:'Flexão de braço', grupo:'peito', sec:['triceps','ombro','core'], mov:'empurrar_horizontal', tipo:'composto', equip:['peso_corporal'], nivel:1, ico:'🙌',
    instr:['Mãos na largura dos ombros, corpo reto.','Desça até o peito quase tocar o chão.','Empurre mantendo o abdômen contraído.'] },
  { id:'crucifixo_halter', nome:'Crucifixo com halteres', grupo:'peito', sec:[], mov:'empurrar_horizontal', tipo:'isolado', equip:['halteres','banco'], nivel:2, ico:'🕊️',
    instr:['Deite com halteres acima do peito, cotovelos levemente flexionados.','Abra os braços em arco até sentir o peito alongar.','Volte contraindo o peito.'] },
  { id:'crossover_polia', nome:'Crossover na polia', grupo:'peito', sec:[], mov:'empurrar_horizontal', tipo:'isolado', equip:['polia'], nivel:2, ico:'🪝',
    instr:['Fique no centro com um cabo em cada mão.','Traga as mãos à frente cruzando levemente.','Volte controlando a carga.'] },
  { id:'supino_maquina', nome:'Supino na máquina', grupo:'peito', sec:['triceps'], mov:'empurrar_horizontal', tipo:'composto', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Ajuste o banco na altura do peito.','Empurre até estender os braços.','Volte controlando sem soltar a carga.'] },

  /* ------------------------------- COSTAS ------------------------------ */
  { id:'barra_fixa', nome:'Barra fixa', grupo:'costas', sec:['biceps'], mov:'puxar_vertical', tipo:'composto', equip:['barra_fixa'], nivel:3, ico:'🚧',
    instr:['Pegada pronada na largura dos ombros.','Puxe até o queixo passar da barra.','Desça controlando até estender.'] },
  { id:'puxada_polia', nome:'Puxada na polia alta', grupo:'costas', sec:['biceps'], mov:'puxar_vertical', tipo:'composto', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Segure a barra mais aberto que os ombros.','Puxe até a parte alta do peito.','Volte controlando, sem balançar o tronco.'] },
  { id:'remada_curvada_barra', nome:'Remada curvada com barra', grupo:'costas', sec:['biceps','posterior'], mov:'puxar_horizontal', tipo:'composto', equip:['barra'], nivel:2, ico:'➖',
    instr:['Tronco inclinado ~45°, coluna neutra.','Puxe a barra em direção ao umbigo.','Desça controlando.'] },
  { id:'remada_halter_unilateral', nome:'Remada unilateral com halter', grupo:'costas', sec:['biceps'], mov:'puxar_horizontal', tipo:'composto', equip:['halteres','banco'], nivel:2, ico:'💪',
    instr:['Apoie joelho e mão no banco.','Puxe o halter até a lateral do tronco.','Desça alongando a lat.'] },
  { id:'remada_maquina', nome:'Remada na máquina', grupo:'costas', sec:['biceps'], mov:'puxar_horizontal', tipo:'composto', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Peito apoiado no encosto.','Puxe as alças em direção ao tronco.','Volte controlando.'] },
  { id:'remada_cabo', nome:'Remada baixa no cabo', grupo:'costas', sec:['biceps'], mov:'puxar_horizontal', tipo:'composto', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Sentado, coluna ereta.','Puxe o triângulo até o abdômen.','Volte alongando sem curvar as costas.'] },
  { id:'pulldown_elastico', nome:'Puxada com elástico', grupo:'costas', sec:['biceps'], mov:'puxar_vertical', tipo:'composto', equip:['elastico'], nivel:1, ico:'➰',
    instr:['Prenda o elástico em ponto alto.','Puxe para baixo até a altura do peito.','Volte controlando a tensão.'] },

  /* ------------------------------- OMBRO ------------------------------- */
  { id:'desenvolvimento_halter', nome:'Desenvolvimento com halteres', grupo:'ombro', sec:['triceps'], mov:'empurrar_vertical', tipo:'composto', equip:['halteres'], nivel:2, ico:'💪',
    instr:['Sentado ou em pé, halteres na altura das orelhas.','Empurre para cima até quase estender.','Desça controlando.'] },
  { id:'desenvolvimento_barra', nome:'Desenvolvimento com barra', grupo:'ombro', sec:['triceps'], mov:'empurrar_vertical', tipo:'composto', equip:['barra'], nivel:2, ico:'➖',
    instr:['Barra na altura do queixo.','Empurre acima da cabeça.','Desça controlando até o queixo.'] },
  { id:'desenvolvimento_maquina', nome:'Desenvolvimento na máquina', grupo:'ombro', sec:['triceps'], mov:'empurrar_vertical', tipo:'composto', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Ajuste o banco, alças na altura dos ombros.','Empurre para cima.','Volte controlando.'] },
  { id:'elevacao_lateral_halter', nome:'Elevação lateral com halteres', grupo:'ombro', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['halteres'], nivel:1, ico:'🦅',
    instr:['Halteres ao lado do corpo.','Eleve os braços até a altura dos ombros.','Desça devagar.'] },
  { id:'elevacao_lateral_cabo', nome:'Elevação lateral no cabo', grupo:'ombro', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['polia'], nivel:2, ico:'🪝',
    instr:['Cabo na polia baixa, pega cruzada.','Eleve o braço até a lateral.','Volte controlando.'] },
  { id:'elevacao_lateral_elastico', nome:'Elevação lateral com elástico', grupo:'ombro', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['elastico'], nivel:1, ico:'➰',
    instr:['Pise no elástico, pegada nas laterais.','Eleve os braços até os ombros.','Desça devagar.'] },

  /* ------------------------------- BÍCEPS ------------------------------ */
  { id:'rosca_direta_barra', nome:'Rosca direta com barra', grupo:'biceps', sec:[], mov:'puxar_horizontal', tipo:'isolado', equip:['barra'], nivel:1, ico:'➖',
    instr:['Em pé, pegada supinada.','Flexione os cotovelos subindo a barra.','Desça controlando sem balançar.'] },
  { id:'rosca_alternada_halter', nome:'Rosca alternada com halteres', grupo:'biceps', sec:[], mov:'puxar_horizontal', tipo:'isolado', equip:['halteres'], nivel:1, ico:'💪',
    instr:['Halteres ao lado do corpo.','Suba um braço de cada vez girando o punho.','Desça controlando.'] },
  { id:'rosca_cabo', nome:'Rosca no cabo', grupo:'biceps', sec:[], mov:'puxar_horizontal', tipo:'isolado', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Barra na polia baixa.','Flexione os cotovelos.','Volte controlando a tensão.'] },
  { id:'rosca_elastico', nome:'Rosca com elástico', grupo:'biceps', sec:[], mov:'puxar_horizontal', tipo:'isolado', equip:['elastico'], nivel:1, ico:'➰',
    instr:['Pise no elástico, pegada supinada.','Flexione os cotovelos.','Desça controlando.'] },
  { id:'rosca_scott_maquina', nome:'Rosca Scott na máquina', grupo:'biceps', sec:[], mov:'puxar_horizontal', tipo:'isolado', equip:['maquinas'], nivel:2, ico:'⚙️',
    instr:['Apoie os braços no suporte.','Flexione até o topo.','Desça controlando sem estender totalmente.'] },

  /* ------------------------------ TRÍCEPS ------------------------------ */
  { id:'triceps_corda_polia', nome:'Tríceps corda na polia', grupo:'triceps', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Corda na polia alta, cotovelos fixos.','Estenda para baixo abrindo a corda.','Volte controlando.'] },
  { id:'triceps_testa_halter', nome:'Tríceps testa com halteres', grupo:'triceps', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['halteres','banco'], nivel:2, ico:'💪',
    instr:['Deitado, halteres acima da testa.','Flexione os cotovelos descendo os halteres.','Estenda de volta.'] },
  { id:'mergulho_banco', nome:'Mergulho no banco', grupo:'triceps', sec:['peito'], mov:'empurrar_vertical', tipo:'composto', equip:['banco'], nivel:1, ico:'🛋️',
    instr:['Mãos no banco atrás do corpo.','Desça flexionando os cotovelos.','Empurre de volta.'] },
  { id:'triceps_frances_halter', nome:'Tríceps francês com halter', grupo:'triceps', sec:[], mov:'empurrar_vertical', tipo:'isolado', equip:['halteres'], nivel:2, ico:'🇫🇷',
    instr:['Halter atrás da cabeça, cotovelos apontando para cima.','Estenda os braços.','Desça controlando.'] },
  { id:'flexao_diamante', nome:'Flexão diamante', grupo:'triceps', sec:['peito'], mov:'empurrar_horizontal', tipo:'composto', equip:['peso_corporal'], nivel:2, ico:'💎',
    instr:['Mãos juntas formando um losango.','Desça o peito até as mãos.','Empurre focando no tríceps.'] },

  /* ---------------------------- QUADRÍCEPS ----------------------------- */
  { id:'agachamento_livre_barra', nome:'Agachamento livre com barra', grupo:'quadriceps', sec:['gluteos','posterior'], mov:'agachar', tipo:'composto', equip:['barra'], nivel:3, ico:'🏋️',
    instr:['Barra apoiada no trapézio.','Agache mantendo a coluna neutra até ~90°.','Suba empurrando o chão.'] },
  { id:'agachamento_halter', nome:'Agachamento com halteres', grupo:'quadriceps', sec:['gluteos'], mov:'agachar', tipo:'composto', equip:['halteres'], nivel:2, ico:'💪',
    instr:['Halteres ao lado do corpo.','Agache mantendo o peito erguido.','Suba controlando.'] },
  { id:'leg_press', nome:'Leg press', grupo:'quadriceps', sec:['gluteos'], mov:'agachar', tipo:'composto', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Pés na plataforma na largura dos ombros.','Flexione os joelhos até ~90°.','Empurre sem travar os joelhos.'] },
  { id:'cadeira_extensora', nome:'Cadeira extensora', grupo:'quadriceps', sec:[], mov:'agachar', tipo:'isolado', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Ajuste o apoio nos tornozelos.','Estenda as pernas.','Desça controlando.'] },
  { id:'agachamento_peso_corporal', nome:'Agachamento livre', grupo:'quadriceps', sec:['gluteos'], mov:'agachar', tipo:'composto', equip:['peso_corporal'], nivel:1, ico:'🧍',
    instr:['Pés na largura dos ombros.','Agache até ~90° mantendo os calcanhares no chão.','Suba contraindo as pernas.'] },
  { id:'afundo_halter', nome:'Afundo com halteres', grupo:'quadriceps', sec:['gluteos'], mov:'agachar', tipo:'composto', equip:['halteres'], nivel:2, ico:'🚶',
    instr:['Passo à frente com halteres nas mãos.','Desça até o joelho de trás quase tocar o chão.','Volte e alterne.'] },

  /* --------------------------- POSTERIORES ----------------------------- */
  { id:'stiff_barra', nome:'Stiff com barra', grupo:'posterior', sec:['gluteos'], mov:'dobrar_quadril', tipo:'composto', equip:['barra'], nivel:2, ico:'➖',
    instr:['Barra à frente das coxas, joelhos levemente flexionados.','Desça empurrando o quadril para trás.','Suba contraindo glúteos e posterior.'] },
  { id:'stiff_halter', nome:'Stiff com halteres', grupo:'posterior', sec:['gluteos'], mov:'dobrar_quadril', tipo:'composto', equip:['halteres'], nivel:2, ico:'💪',
    instr:['Halteres à frente das coxas.','Empurre o quadril para trás descendo os halteres.','Suba contraindo o posterior.'] },
  { id:'mesa_flexora', nome:'Mesa flexora', grupo:'posterior', sec:[], mov:'flexao_joelho', tipo:'isolado', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Deitado, tornozelos sob o apoio.','Flexione os joelhos trazendo o apoio.','Volte controlando.'] },
  { id:'levantamento_terra', nome:'Levantamento terra', grupo:'posterior', sec:['gluteos','costas'], mov:'dobrar_quadril', tipo:'composto', equip:['barra'], nivel:3, ico:'🏋️',
    instr:['Barra sobre o meio dos pés, coluna neutra.','Levante estendendo quadril e joelhos juntos.','Desça controlando encostando no chão.'] },
  { id:'good_morning_elastico', nome:'Good morning com elástico', grupo:'posterior', sec:['gluteos'], mov:'dobrar_quadril', tipo:'composto', equip:['elastico'], nivel:2, ico:'➰',
    instr:['Elástico sobre a nuca, pés sobre a faixa.','Incline o tronco à frente com quadril para trás.','Volte contraindo o posterior.'] },

  /* ----------------------------- GLÚTEOS ------------------------------- */
  { id:'elevacao_pelvica_barra', nome:'Elevação pélvica com barra', grupo:'gluteos', sec:['posterior'], mov:'dobrar_quadril', tipo:'composto', equip:['barra','banco'], nivel:2, ico:'🏋️',
    instr:['Costas apoiadas no banco, barra sobre o quadril.','Eleve o quadril até alinhar tronco e coxas.','Desça controlando.'] },
  { id:'elevacao_pelvica_peso_corporal', nome:'Elevação pélvica', grupo:'gluteos', sec:['posterior'], mov:'dobrar_quadril', tipo:'composto', equip:['peso_corporal'], nivel:1, ico:'🧍',
    instr:['Deitado, joelhos flexionados, pés no chão.','Eleve o quadril contraindo os glúteos.','Desça controlando.'] },
  { id:'gluteo_cabo', nome:'Glúteo no cabo (coice)', grupo:'gluteos', sec:[], mov:'dobrar_quadril', tipo:'isolado', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Tornozeleira no cabo baixo.','Estenda a perna para trás contraindo o glúteo.','Volte controlando.'] },
  { id:'agachamento_sumo_halter', nome:'Agachamento sumô com halter', grupo:'gluteos', sec:['adutores','quadriceps'], mov:'agachar', tipo:'composto', equip:['halteres'], nivel:2, ico:'💪',
    instr:['Pés bem afastados, pontas para fora, halter entre as pernas.','Agache mantendo o tronco ereto.','Suba contraindo glúteos e adutores.'] },

  /* ----------------------------- ADUTORES ------------------------------ */
  { id:'cadeira_adutora', nome:'Cadeira adutora', grupo:'adutores', sec:[], mov:'aducao', tipo:'isolado', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Sentado, joelhos apoiados nas almofadas abertas.','Feche as pernas contraindo a parte interna da coxa.','Volte controlando.'] },
  { id:'aducao_cabo', nome:'Adução no cabo', grupo:'adutores', sec:[], mov:'aducao', tipo:'isolado', equip:['polia'], nivel:1, ico:'🪝',
    instr:['Tornozeleira no cabo baixo, de lado para a polia.','Puxe a perna cruzando à frente da outra.','Volte controlando.'] },
  { id:'aducao_elastico', nome:'Adução com elástico', grupo:'adutores', sec:[], mov:'aducao', tipo:'isolado', equip:['elastico'], nivel:1, ico:'➰',
    instr:['Elástico preso ao lado, na altura do tornozelo.','Traga a perna para dentro contra a resistência.','Volte controlando.'] },
  { id:'agachamento_sumo', nome:'Agachamento sumô', grupo:'adutores', sec:['gluteos','quadriceps'], mov:'agachar', tipo:'composto', equip:['peso_corporal'], nivel:1, ico:'🧍',
    instr:['Pés bem afastados, pontas para fora.','Agache mantendo o tronco ereto.','Suba contraindo a parte interna das coxas.'] },
  { id:'afundo_lateral', nome:'Afundo lateral (cossack)', grupo:'adutores', sec:['gluteos','quadriceps'], mov:'agachar', tipo:'composto', equip:['peso_corporal'], nivel:2, ico:'🚶',
    instr:['Pés bem afastados.','Desloque o peso para um lado flexionando o joelho.','Volte ao centro e alterne.'] },

  /* --------------------------- PANTURRILHA ----------------------------- */
  { id:'panturrilha_maquina', nome:'Panturrilha na máquina', grupo:'panturrilha', sec:[], mov:'panturrilha', tipo:'isolado', equip:['maquinas'], nivel:1, ico:'⚙️',
    instr:['Ponta dos pés no apoio.','Suba na ponta dos pés ao máximo.','Desça alongando a panturrilha.'] },
  { id:'panturrilha_halter', nome:'Panturrilha com halteres', grupo:'panturrilha', sec:[], mov:'panturrilha', tipo:'isolado', equip:['halteres'], nivel:1, ico:'💪',
    instr:['Halteres nas mãos, ponta dos pés num degrau.','Suba na ponta dos pés.','Desça alongando.'] },
  { id:'panturrilha_peso_corporal', nome:'Panturrilha em pé', grupo:'panturrilha', sec:[], mov:'panturrilha', tipo:'isolado', equip:['peso_corporal'], nivel:1, ico:'🧍',
    instr:['Em pé, pés na largura do quadril.','Suba na ponta dos pés.','Desça controlando.'] },

  /* ------------------------------- CORE -------------------------------- */
  { id:'prancha', nome:'Prancha', grupo:'core', sec:[], mov:'core', tipo:'isolado', equip:['peso_corporal'], nivel:1, ico:'🧱', repsFixo:'30-45s',
    instr:['Apoie antebraços e pontas dos pés.','Mantenha o corpo reto e o abdômen contraído.','Segure pelo tempo indicado.'] },
  { id:'abdominal_supra', nome:'Abdominal supra', grupo:'core', sec:[], mov:'core', tipo:'isolado', equip:['peso_corporal'], nivel:1, ico:'🔺',
    instr:['Deitado, joelhos flexionados.','Eleve o tronco contraindo o abdômen.','Desça controlando.'] },
  { id:'elevacao_pernas', nome:'Elevação de pernas', grupo:'core', sec:[], mov:'core', tipo:'isolado', equip:['peso_corporal'], nivel:2, ico:'🦵',
    instr:['Deitado, pernas estendidas.','Eleve as pernas até 90°.','Desça sem encostar no chão.'] },
  { id:'prancha_lateral', nome:'Prancha lateral', grupo:'core', sec:[], mov:'core', tipo:'isolado', equip:['peso_corporal'], nivel:1, ico:'📏', repsFixo:'30s/lado',
    instr:['Apoie um antebraço, corpo de lado.','Eleve o quadril alinhando o corpo.','Segure e troque de lado.'] },
  { id:'abdominal_cabo', nome:'Abdominal no cabo', grupo:'core', sec:[], mov:'core', tipo:'isolado', equip:['polia'], nivel:2, ico:'🪝',
    instr:['Ajoelhado de frente para a polia alta, corda na nuca.','Flexione o tronco contraindo o abdômen.','Volte controlando.'] },

  /* ------------------------------ CARDIO ------------------------------- */
  { id:'esteira', nome:'Esteira', grupo:'cardio', sec:[], mov:'cardio', tipo:'cardio', equip:['cardio'], nivel:1, ico:'🏃', repsFixo:'10-15 min',
    instr:['Comece com caminhada leve para aquecer.','Mantenha o ritmo alvo do treino.','Reduza gradualmente ao final.'] },
  { id:'bike', nome:'Bicicleta ergométrica', grupo:'cardio', sec:[], mov:'cardio', tipo:'cardio', equip:['cardio'], nivel:1, ico:'🚴', repsFixo:'10-15 min',
    instr:['Ajuste o banco na altura do quadril.','Pedale mantendo o ritmo alvo.','Desacelere ao final.'] },
  { id:'polichinelo', nome:'Polichinelo', grupo:'cardio', sec:[], mov:'cardio', tipo:'cardio', equip:['peso_corporal'], nivel:1, ico:'🤸', repsFixo:'1 min',
    instr:['Em pé, pés juntos.','Salte abrindo pernas e braços.','Volte e repita em ritmo constante.'] },
];
