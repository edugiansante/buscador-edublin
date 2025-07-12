import { User } from './auth';

// Dados de exemplo para demonstração
export interface DemoSearchResult {
  id: string;
  nome: string;
  idade: number;
  cidadeOrigem: string;
  cidadeDestino: string;
  paisDestino: string;
  escola: string;
  mesAno: string;
  ciaAerea?: string;
  whatsappOptIn: boolean;
  verificado: boolean;
  premium: boolean;
  foto?: string;
  bio?: string;
  interesses: string[];
  matchScore: number;
}

// Cidades brasileiras populares para intercâmbio
const cidadesBrasileiras = [
  'São Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Porto Alegre, RS',
  'Curitiba, PR',
  'Salvador, BA',
  'Brasília, DF',
  'Recife, PE',
  'Fortaleza, CE',
  'Campinas, SP',
  'Florianópolis, SC',
  'Goiânia, GO',
  'João Pessoa, PB',
  'Vitória, ES',
  'Manaus, AM'
];

// Destinos populares para intercâmbio
const destinosPopulares = [
  { pais: 'Canadá', cidades: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
  { pais: 'Estados Unidos', cidades: ['Nova York', 'Los Angeles', 'Boston', 'Chicago', 'Miami'] },
  { pais: 'Reino Unido', cidades: ['Londres', 'Manchester', 'Liverpool', 'Edinburgh', 'Brighton'] },
  { pais: 'Austrália', cidades: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { pais: 'Irlanda', cidades: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'] },
  { pais: 'França', cidades: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'] },
  { pais: 'Alemanha', cidades: ['Berlim', 'Munique', 'Hamburgo', 'Colônia', 'Frankfurt'] },
  { pais: 'Espanha', cidades: ['Madri', 'Barcelona', 'Valencia', 'Sevilha', 'Bilbao'] }
];

// Escolas/instituições populares
const escolasPopulares = [
  'University of Toronto',
  'UCLA - University of California',
  'London School of Economics',
  'University of Sydney',
  'Trinity College Dublin',
  'Sorbonne University',
  'Technical University of Munich',
  'Universidad Complutense Madrid',
  'McGill University',
  'King\'s College London',
  'RMIT University',
  'University College Dublin',
  'Sciences Po Paris',
  'Free University of Berlin',
  'Universidad de Barcelona'
];

// Companhias aéreas
const companhiasAereas = [
  'LATAM Airlines',
  'GOL Linhas Aéreas',
  'Azul Linhas Aéreas',
  'TAP Air Portugal',
  'Air France',
  'Lufthansa',
  'British Airways',
  'Air Canada',
  'United Airlines',
  'Emirates'
];

// Interesses comuns
const interessesComuns = [
  'Fotografia', 'Culinária', 'Música', 'Cinema', 'Literatura', 'Arte',
  'Viagens', 'Esportes', 'Tecnologia', 'Moda', 'Games', 'Dança',
  'Teatro', 'Natureza', 'Aventura', 'Idiomas', 'História', 'Ciência',
  'Voluntariado', 'Empreendedorismo', 'Yoga', 'Meditação', 'Podcast',
  'Blog', 'Vlog', 'Redes Sociais', 'Marketing', 'Design'
];

// Bios de exemplo
const biosExemplo = [
  'Estudante de marketing apaixonada por fotografia e viagens. Sempre em busca de novas culturas!',
  'Futuro engenheiro que adora tecnologia e games. Vamos explorar a cidade juntos?',
  'Amante da culinária e da música. Que tal descobrirmos os melhores restaurantes locais?',
  'Artista em formação com paixão por museus e galerias. Adoro fazer novos amigos!',
  'Esportista e aventureiro. Sempre disposto a explorar trilhas e atividades ao ar livre.',
  'Bookworm e cinéfila. Vamos trocar dicas de livros e filmes locais?',
  'Empreendedor em formação interessado em networking e novas oportunidades.',
  'Estudante de idiomas que adora conversar e praticar. Coffee chat anyone?',
  'Designer criativo sempre em busca de inspiração arquitetônica e artística.',
  'Voluntário ativo procurando formas de contribuir com a comunidade local.'
];

// Função para gerar dados realistas
const gerarDadosAleatorios = () => {
  const destinoAleatorio = destinosPopulares[Math.floor(Math.random() * destinosPopulares.length)];
  const cidadeDestino = destinoAleatorio.cidades[Math.floor(Math.random() * destinoAleatorio.cidades.length)];
  
  return {
    cidadeOrigem: cidadesBrasileiras[Math.floor(Math.random() * cidadesBrasileiras.length)],
    paisDestino: destinoAleatorio.pais,
    cidadeDestino,
    escola: escolasPopulares[Math.floor(Math.random() * escolasPopulares.length)],
    ciaAerea: Math.random() > 0.3 ? companhiasAereas[Math.floor(Math.random() * companhiasAereas.length)] : undefined
  };
};

// Gerar perfis de exemplo
export const generateDemoProfiles = (count: number = 12): DemoSearchResult[] => {
  const nomes = [
    'Ana Silva', 'Bruno Santos', 'Carla Oliveira', 'Diego Costa', 'Elena Rodrigues',
    'Felipe Lima', 'Gabriela Ferreira', 'Henrique Alves', 'Isabela Martins', 'João Pereira',
    'Karina Souza', 'Lucas Barbosa', 'Mariana Gomes', 'Nicolas Ribeiro', 'Olivia Campos',
    'Pedro Nascimento', 'Rafaela Torres', 'Samuel Cardoso', 'Tatiana Rocha', 'Victor Moreira'
  ];

  const profiles: DemoSearchResult[] = [];

  for (let i = 0; i < count; i++) {
    const dados = gerarDadosAleatorios();
    const interessesUsuario = interessesComuns
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 6) + 3);

    profiles.push({
      id: `demo-${i + 1}`,
      nome: nomes[i % nomes.length],
      idade: Math.floor(Math.random() * 10) + 18, // 18-27 anos
      cidadeOrigem: dados.cidadeOrigem,
      cidadeDestino: dados.cidadeDestino,
      paisDestino: dados.paisDestino,
      escola: dados.escola,
      mesAno: `${Math.random() > 0.5 ? '2026' : '2025'}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
      ciaAerea: dados.ciaAerea,
      whatsappOptIn: Math.random() > 0.2, // 80% chance
      verificado: Math.random() > 0.3, // 70% chance
      premium: Math.random() > 0.8, // 20% chance
      bio: biosExemplo[Math.floor(Math.random() * biosExemplo.length)],
      interesses: interessesUsuario,
      matchScore: Math.floor(Math.random() * 40) + 60 // 60-100% match
    });
  }

  return profiles.sort((a, b) => b.matchScore - a.matchScore);
};

// Filtrar perfis baseado nos critérios de busca
export const filterDemoProfiles = (
  profiles: DemoSearchResult[],
  searchCriteria: {
    cidadeOrigem: string;
    paisDestino: string;
    cidadeDestino: string;
    escola?: string;
    ciaAerea?: string;
    mesAno: string;
  }
): DemoSearchResult[] => {
  return profiles.filter(profile => {
    // Match por destino (obrigatório)
    const destinoMatch = 
      profile.paisDestino.toLowerCase().includes(searchCriteria.paisDestino.toLowerCase()) ||
      profile.cidadeDestino.toLowerCase().includes(searchCriteria.cidadeDestino.toLowerCase());

    if (!destinoMatch) return false;

    // Boost score based on matches
    let matchBoost = 0;

    // Cidade de origem similar
    if (profile.cidadeOrigem.toLowerCase().includes(searchCriteria.cidadeOrigem.toLowerCase())) {
      matchBoost += 15;
    }

    // Escola similar
    if (searchCriteria.escola && profile.escola.toLowerCase().includes(searchCriteria.escola.toLowerCase())) {
      matchBoost += 20;
    }

    // Companhia aérea similar
    if (searchCriteria.ciaAerea && profile.ciaAerea?.toLowerCase().includes(searchCriteria.ciaAerea.toLowerCase())) {
      matchBoost += 10;
    }

    // Período similar (mesmo ano ou mês próximo)
    const [searchYear, searchMonth] = searchCriteria.mesAno.split('-');
    const [profileYear, profileMonth] = profile.mesAno.split('-');
    
    if (searchYear === profileYear) {
      matchBoost += 15;
      if (Math.abs(parseInt(searchMonth) - parseInt(profileMonth)) <= 2) {
        matchBoost += 10;
      }
    }

    // Update match score
    profile.matchScore = Math.min(100, profile.matchScore + matchBoost);

    return true;
  }).sort((a, b) => b.matchScore - a.matchScore);
};

// Criar usuário demo padrão
export const createDemoUser = (customData?: Partial<User>): User => {
  const now = new Date().toISOString();
  
  return {
    id: 'demo-user-default',
    email: 'demo@edublin.com.br',
    nome: 'Usuário Demo',
    idade: 22,
    telefone: '+55 11 99999-9999',
    cidade_origem: 'São Paulo, SP',
    whatsapp: null,
    whatsapp_opt_in: false,
    foto_url: null,
    interesses: ['Viagens', 'Idiomas', 'Tecnologia', 'Fotografia'],
    verificado: true,
    premium: false,
    relatos: 0,
    created_at: now,
    updated_at: now,
    ...customData
  } as User;
};

// Criar usuário demo personalizado baseado em dados de signup
export const createCustomDemoUser = (signupData: {
  email: string;
  nome: string;
  idade?: number;
  telefone?: string;
}): User => {
  const now = new Date().toISOString();
  const randomInterests = interessesComuns
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 5) + 3);
  
  return {
    id: `demo-user-${Date.now()}`,
    email: signupData.email,
    nome: signupData.nome,
    idade: signupData.idade || null,
    telefone: signupData.telefone || null,
    cidade_origem: cidadesBrasileiras[Math.floor(Math.random() * cidadesBrasileiras.length)],
    whatsapp: null,
    whatsapp_opt_in: false,
    foto_url: null,
    interesses: randomInterests,
    verificado: true, // Demo users are auto-verified
    premium: Math.random() > 0.8, // 20% chance of premium
    relatos: 0,
    created_at: now,
    updated_at: now
  } as User;
};

// Estatísticas da demo
export const getDemoStats = () => {
  return {
    totalUsers: 1250,
    activeSearches: 89,
    successfulMatches: 340,
    countriesAvailable: 25,
    citiesAvailable: 150,
    universitiesPartners: 500
  };
};

// Mensagens de sucesso para demo
export const getDemoSuccessMessages = () => {
  return [
    '🎉 Encontramos 12 intercambistas compatíveis!',
    '✨ Ótimos resultados! Veja os perfis mais compatíveis.',
    '🔥 Matches perfeitos encontrados para sua viagem!',
    '🎯 Resultados personalizados baseados no seu perfil.',
    '🌟 Conecte-se com outros intercambistas agora!'
  ];
};

// Tips para usuários demo
export const getDemoTips = () => {
  return [
    {
      title: '💡 Dica da Demo',
      message: 'Todos os perfis são simulados, mas o sistema de busca é totalmente funcional!'
    },
    {
      title: '🚀 Quer usar dados reais?',
      message: 'Configure sua instância do Supabase para começar a usar com dados reais.'
    },
    {
      title: '📱 WhatsApp Demo',
      message: 'Os links do WhatsApp na demo redirecionam para uma conversa com o suporte.'
    },
    {
      title: '🔐 Segurança',
      message: 'Na versão real, todos os contatos são verificados e seguros.'
    },
    {
      title: '🎭 Persistência Demo',
      message: 'Suas credenciais ficam salvas no navegador até você limpar o cache.'
    }
  ];
};

// Credenciais demo padrão
export const getDemoCredentials = () => {
  return {
    email: 'demo@edublin.com.br',
    password: 'demo123',
    nome: 'Usuário Demo'
  };
};

// Verificar se é usuário demo
export const isDemoUser = (userId: string): boolean => {
  return userId.startsWith('demo-user') || userId === 'demo-user-default';
};

// Gerar dados demo para diferentes cenários
export const getDemoUserVariations = () => {
  return [
    {
      email: 'ana.silva@email.com',
      nome: 'Ana Silva',
      idade: 23,
      telefone: '+55 11 98765-4321',
      cidade_origem: 'São Paulo, SP',
      interesses: ['Fotografia', 'Culinária', 'Viagens', 'Arte']
    },
    {
      email: 'bruno.santos@email.com',
      nome: 'Bruno Santos',
      idade: 25,
      telefone: '+55 21 99876-5432',
      cidade_origem: 'Rio de Janeiro, RJ',
      interesses: ['Tecnologia', 'Games', 'Música', 'Esportes']
    },
    {
      email: 'carla.oliveira@email.com',
      nome: 'Carla Oliveira',
      idade: 21,
      telefone: '+55 31 97654-3210',
      cidade_origem: 'Belo Horizonte, MG',
      interesses: ['Literatura', 'Cinema', 'Teatro', 'Idiomas']
    }
  ];
};

export default {
  generateDemoProfiles,
  filterDemoProfiles,
  createDemoUser,
  createCustomDemoUser,
  getDemoStats,
  getDemoSuccessMessages,
  getDemoTips,
  getDemoCredentials,
  isDemoUser,
  getDemoUserVariations
};