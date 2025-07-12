import { useState, useEffect } from "react";
import { ProfileCard, UserProfile } from "./ProfileCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { OnboardingData } from "./OnboardingFlow";
import { UserData } from "./AuthModal";
import { SearchService } from "../lib/search";
import { WhatsAppGroupService } from "../lib/whatsapp-groups";
import { generateDemoProfiles, filterDemoProfiles } from "../lib/demo-data";
import { supabaseConfig } from "../lib/supabase";
import type { UserWithCriteria } from "../lib/search";
import { 
  ArrowLeft, 
  Filter, 
  Users, 
  MapPin, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  MessageCircle, 
  Loader2, 
  Sparkles,
  X,
  HelpCircle,
  Phone,
  Mail
} from "lucide-react";

interface SearchResultsProps {
  searchData: OnboardingData;
  searchCriteriaId: string | null;
  currentUser: UserData | null;
  onBack: () => void;
  onAuthRequired: () => void;
}

interface FilterState {
  verificadoOnly: boolean;
  premiumOnly: boolean;
  ageRange: string;
  airline: string;
  interests: string[];
  sortBy: 'compatibility' | 'age' | 'name';
}

export function SearchResults({ searchData, searchCriteriaId, currentUser, onBack, onAuthRequired }: SearchResultsProps) {
  const [allMatches, setAllMatches] = useState<UserProfile[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupLink, setGroupLink] = useState<string | null>(null);
  const [contactRequests, setContactRequests] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    verificadoOnly: false,
    premiumOnly: false,
    ageRange: 'all',
    airline: 'all',
    interests: [],
    sortBy: 'compatibility'
  });

  const isDemoMode = !supabaseConfig.isConfigured;

  useEffect(() => {
    if (currentUser && searchCriteriaId && !isDemoMode) {
      loadMatches();
      loadContactRequests();
    } else {
      // For non-authenticated users or demo mode, show demo results
      loadDemoMatches();
    }
  }, [currentUser, searchCriteriaId, isDemoMode]);

  // Apply filters whenever filters or allMatches change
  useEffect(() => {
    applyFilters();
  }, [filters, allMatches]);

  const loadMatches = async () => {
    if (!currentUser || !searchCriteriaId) return;

    try {
      setLoading(true);
      setError(null);

      // Find matches using the saved search criteria
      const foundMatches = await SearchService.findMatches(searchCriteriaId, currentUser.id);
      
      // Transform to UserProfile format
      const userProfiles: UserProfile[] = foundMatches.map((match: UserWithCriteria) => ({
        id: match.id,
        nome: match.nome,
        idade: match.idade || 0,
        cidade: match.cidade_origem || '',
        destino: searchData.cidadeDestino,
        escola: match.search_criteria[0]?.escola || '',
        dataChegada: match.search_criteria[0]?.mes_ano || '',
        ciaAerea: match.search_criteria[0]?.cia_aerea || '',
        foto: match.foto_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
        compatibilidade: match.compatibilidade || 0,
        interesses: match.interesses || [],
        curso: match.search_criteria[0]?.curso || '',
        whatsapp: match.whatsapp,
        whatsappOptIn: match.whatsapp_opt_in,
        verificado: match.verificado,
        premium: match.premium,
        relatos: match.relatos
      }));

      setAllMatches(userProfiles);
      console.log(`Loaded ${userProfiles.length} matches from database`);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError('Erro ao carregar resultados. Tente novamente.');
      
      // Fallback to demo matches if real data fails
      loadDemoMatches();
    } finally {
      setLoading(false);
    }
  };

  const loadContactRequests = async () => {
    if (!currentUser) return;

    try {
      const requests = await SearchService.getContactRequests(currentUser.id);
      setContactRequests(requests.length);
    } catch (err) {
      console.error('Error loading contact requests:', err);
    }
  };

  const loadDemoMatches = () => {
    console.log('🎭 Loading demo matches...');
    
    // Generate demo profiles based on search criteria
    const demoProfiles = generateDemoProfiles(24); // More profiles for better filtering demo
    
    // Filter demo profiles based on search criteria
    const filtered = filterDemoProfiles(demoProfiles, {
      cidadeOrigem: searchData.cidadeOrigem,
      paisDestino: searchData.paisDestino,
      cidadeDestino: searchData.cidadeDestino,
      escola: searchData.escola,
      ciaAerea: searchData.ciaAerea,
      mesAno: searchData.mesAno
    });

    // Transform to UserProfile format
    const userProfiles: UserProfile[] = filtered.map((profile) => ({
      id: profile.id,
      nome: profile.nome,
      idade: profile.idade,
      cidade: profile.cidadeOrigem,
      destino: profile.cidadeDestino,
      escola: profile.escola,
      dataChegada: profile.mesAno,
      ciaAerea: profile.ciaAerea || '',
      foto: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1494790108755-2616b612b47c' : '1507003211169-0a1dd7228f2d'}?w=150&h=150&fit=crop&crop=face`,
      compatibilidade: profile.matchScore,
      interesses: profile.interesses,
      curso: '',
      whatsapp: profile.whatsappOptIn ? `+5511${Math.floor(Math.random() * 900000000 + 100000000)}` : undefined,
      whatsappOptIn: profile.whatsappOptIn,
      verificado: profile.verificado,
      premium: profile.premium,
      relatos: profile.relatos
    }));

    setAllMatches(userProfiles);
    setLoading(false);
    console.log(`✅ Loaded ${userProfiles.length} demo matches`);
  };

  const applyFilters = () => {
    let filtered = [...allMatches];

    // Apply verificado filter
    if (filters.verificadoOnly) {
      filtered = filtered.filter(profile => profile.verificado);
    }

    // Apply premium filter
    if (filters.premiumOnly) {
      filtered = filtered.filter(profile => profile.premium);
    }

    // Apply age range filter
    if (filters.ageRange !== 'all') {
      const [min, max] = filters.ageRange.split('-').map(Number);
      filtered = filtered.filter(profile => {
        if (max) {
          return profile.idade >= min && profile.idade <= max;
        } else {
          return profile.idade >= min;
        }
      });
    }

    // Apply airline filter
    if (filters.airline !== 'all') {
      filtered = filtered.filter(profile => 
        profile.ciaAerea && profile.ciaAerea.toLowerCase().includes(filters.airline.toLowerCase())
      );
    }

    // Apply interests filter
    if (filters.interests.length > 0) {
      filtered = filtered.filter(profile => 
        filters.interests.some(interest => 
          profile.interesses.some(profileInterest => 
            profileInterest.toLowerCase().includes(interest.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'age':
          return a.idade - b.idade;
        case 'name':
          return a.nome.localeCompare(b.nome);
        case 'compatibility':
        default:
          return b.compatibilidade - a.compatibilidade;
      }
    });

    setFilteredMatches(filtered);
  };

  const resetFilters = () => {
    setFilters({
      verificadoOnly: false,
      premiumOnly: false,
      ageRange: 'all',
      airline: 'all',
      interests: [],
      sortBy: 'compatibility'
    });
  };

  const handleGroupJoin = async () => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    try {
      setGroupLoading(true);
      
      if (isDemoMode) {
        // Demo mode - simulate group join
        setTimeout(() => {
          const demoGroupLink = `https://wa.me/5511999999999?text=${encodeURIComponent(
            `Olá! Entrei no grupo do Edublin para ${searchData.cidadeDestino} em ${formatDate(searchData.mesAno)}!`
          )}`;
          setGroupLink(demoGroupLink);
          window.open(demoGroupLink, '_blank');
          setGroupLoading(false);
        }, 1500);
        return;
      }
      
      const group = await WhatsAppGroupService.findOrCreateGroup(
        searchData.cidadeDestino,
        searchData.mesAno,
        currentUser.id
      );

      setGroupLink(group.invite_link);
      
      // Open WhatsApp group
      window.open(group.invite_link, '_blank');
      
      // Update member count
      await WhatsAppGroupService.updateMemberCount(group.id, true);
    } catch (err: any) {
      console.error('Error joining group:', err);
      setError('Erro ao acessar grupo. Tente novamente.');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Dúvida sobre resultados de busca - Edublin');
    const body = encodeURIComponent(
      `Olá equipe Edublin,

Estou com uma dúvida sobre os resultados da minha busca.

Detalhes da busca:
- Destino: ${searchData.cidadeDestino}
- Data: ${formatDate(searchData.mesAno)}
- Origem: ${searchData.cidadeOrigem}
${searchData.escola ? `- Escola: ${searchData.escola}` : ''}

Aguardo retorno.

Obrigado!`
    );
    
    // Option 1: Email
    window.open(`mailto:contato@edublin.com.br?subject=${subject}&body=${body}`, '_blank');
    
    // Option 2: WhatsApp (you can uncomment this if preferred)
    // const whatsappMessage = encodeURIComponent(`Olá! Preciso de ajuda com os resultados da busca no Edublin. Destino: ${searchData.cidadeDestino}`);
    // window.open(`https://wa.me/5511999999999?text=${whatsappMessage}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getContactableProfiles = () => {
    return filteredMatches.filter(profile => 
      profile.verificado && 
      profile.whatsappOptIn && 
      profile.relatos < 3
    );
  };

  const contactableCount = getContactableProfiles().length;

  // Get unique airlines for filter
  const availableAirlines = Array.from(new Set(
    allMatches.map(profile => profile.ciaAerea).filter(Boolean)
  ));

  // Get common interests for filter
  const allInterests = Array.from(new Set(
    allMatches.flatMap(profile => profile.interesses)
  )).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-green-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Refazer Busca
            </Button>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-80">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-green-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Refazer Busca
          </Button>
        </div>

        {/* Results header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">
              {filteredMatches.length} Companheiros Encontrados
            </h1>
            {currentUser && searchCriteriaId && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Busca salva
              </Badge>
            )}
            {isDemoMode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <span className="text-xs">🎭</span>
                Demo
              </Badge>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">
            {currentUser 
              ? `${contactableCount} perfis com contato disponível • ${contactRequests} solicitações pendentes`
              : `Entre ou cadastre-se para ver informações completas e contatos`
            }
            {allMatches.length !== filteredMatches.length && (
              <span className="text-blue-600"> • {allMatches.length - filteredMatches.length} filtrados</span>
            )}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {searchData.cidadeOrigem && (
              <Badge variant="secondary" className="bg-green-100 text-green-900">
                <MapPin className="h-3 w-3 mr-1" />
                De: {searchData.cidadeOrigem}
              </Badge>
            )}
            {searchData.cidadeDestino && (
              <Badge variant="secondary" className="bg-green-100 text-green-900">
                <MapPin className="h-3 w-3 mr-1" />
                Para: {searchData.cidadeDestino}
              </Badge>
            )}
            {searchData.mesAno && (
              <Badge variant="secondary" className="bg-green-100 text-green-900">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(searchData.mesAno)}
              </Badge>
            )}
            {searchData.escola && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                <span className="h-3 w-3 mr-1">🎓</span>
                {searchData.escola}
              </Badge>
            )}
            {searchData.ciaAerea && searchData.ciaAerea !== "nao-sei" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-900">
                <span className="h-3 w-3 mr-1">✈️</span>
                {searchData.ciaAerea}
              </Badge>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        {!currentUser && (
          <Alert className="mb-6 border-green-300 bg-green-50">
            <Shield className="h-4 w-4 text-green-800" />
            <AlertDescription className="text-green-900">
              <strong>Entre ou cadastre-se</strong> para conectar-se com outros intercambistas via WhatsApp. 
              Isso garante maior segurança para todos os usuários.
            </AlertDescription>
          </Alert>
        )}

        {currentUser && !currentUser.verificado && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Verificação pendente:</strong> Verifique seu e-mail para liberar o contato com outros usuários.
            </AlertDescription>
          </Alert>
        )}

        {/* Data persistence notice for logged in users */}
        {currentUser && searchCriteriaId && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Busca salva com sucesso!</strong> Você receberá notificações quando novos matches forem encontrados.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters and matches section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentUser ? 'Seus matches' : 'Prévia dos resultados'}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {/* Filters Popover - FIX: Use div wrapper to avoid ref issues */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`border-green-300 text-green-800 hover:bg-green-50 ${
                      Object.values(filters).some(v => 
                        Array.isArray(v) ? v.length > 0 : v !== false && v !== 'all' && v !== 'compatibility'
                      ) ? 'bg-green-50 border-green-400' : ''
                    }`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {Object.values(filters).some(v => 
                      Array.isArray(v) ? v.length > 0 : v !== false && v !== 'all' && v !== 'compatibility'
                    ) && (
                      <Badge variant="secondary" className="ml-2 bg-green-600 text-white text-xs">
                        ativa
                      </Badge>
                    )}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros de Busca</h4>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Verification Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="verificado" 
                      checked={filters.verificadoOnly}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, verificadoOnly: !!checked }))
                      }
                    />
                    <label htmlFor="verificado" className="text-sm">
                      Apenas perfis verificados
                    </label>
                  </div>

                  {/* Premium Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="premium" 
                      checked={filters.premiumOnly}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, premiumOnly: !!checked }))
                      }
                    />
                    <label htmlFor="premium" className="text-sm">
                      Apenas usuários premium
                    </label>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faixa etária</label>
                    <Select 
                      value={filters.ageRange} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as idades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as idades</SelectItem>
                        <SelectItem value="18-22">18-22 anos</SelectItem>
                        <SelectItem value="23-27">23-27 anos</SelectItem>
                        <SelectItem value="28-32">28-32 anos</SelectItem>
                        <SelectItem value="33-40">33-40 anos</SelectItem>
                        <SelectItem value="40">40+ anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Airline Filter */}
                  {availableAirlines.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Companhia aérea</label>
                      <Select 
                        value={filters.airline} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, airline: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as companhias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as companhias</SelectItem>
                          {availableAirlines.map(airline => (
                            <SelectItem key={airline} value={airline}>
                              {airline}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value: 'compatibility' | 'age' | 'name') => 
                        setFilters(prev => ({ ...prev, sortBy: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compatibility">Compatibilidade</SelectItem>
                        <SelectItem value="age">Idade</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={resetFilters} variant="outline" className="flex-1">
                      Limpar
                    </Button>
                    <Button size="sm" onClick={() => setShowFilters(false)} className="flex-1">
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick filter for verified only */}
            <Button 
              variant={filters.verificadoOnly ? "default" : "outline"} 
              size="sm" 
              className={filters.verificadoOnly ? 
                "bg-green-600 hover:bg-green-700 text-white" : 
                "border-green-300 text-green-800 hover:bg-green-50"
              }
              onClick={() => setFilters(prev => ({ ...prev, verificadoOnly: !prev.verificadoOnly }))}
            >
              <Shield className="h-4 w-4 mr-2" />
              Apenas Verificados
            </Button>

            {/* Contact Support */}
            <Button 
              variant="outline" 
              size="sm" 
              className="border-blue-300 text-blue-800 hover:bg-blue-50"
              onClick={handleContactSupport}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Suporte
            </Button>
          </div>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredMatches.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              currentUser={currentUser}
              searchCriteriaId={searchCriteriaId}
              onAuthRequired={onAuthRequired}
              isPreview={!currentUser}
            />
          ))}
        </div>

        {filteredMatches.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {allMatches.length === 0 ? 'Nenhum match encontrado' : 'Nenhum resultado com esses filtros'}
              </h3>
              <p className="text-gray-600 mb-4">
                {allMatches.length === 0 
                  ? 'Não encontramos intercambistas com perfil similar. Tente ajustar seus critérios de busca.'
                  : 'Tente ajustar os filtros para ver mais resultados.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                {allMatches.length === 0 ? (
                  <Button onClick={onBack} variant="outline">
                    Refazer Busca
                  </Button>
                ) : (
                  <>
                    <Button onClick={resetFilters} variant="outline">
                      Limpar Filtros
                    </Button>
                    <Button onClick={onBack} variant="outline">
                      Refazer Busca
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Load more */}
        {filteredMatches.length > 0 && currentUser && (
          <div className="text-center mb-8">
            <Button variant="outline" size="lg" className="border-green-300 text-green-800 hover:bg-green-50">
              Carregar Mais Resultados
            </Button>
          </div>
        )}

        {/* WhatsApp Group CTA */}
        {searchData.mesAno && (
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Quer se conectar com mais gente ao mesmo tempo?
                </h3>
                <p className="text-green-100 text-lg mb-6">
                  Entre no grupo do WhatsApp de quem está chegando em <strong>{formatDate(searchData.mesAno)}</strong> em <strong>{searchData.cidadeDestino}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-green-700 hover:bg-gray-100 font-semibold px-8 py-3"
                    onClick={handleGroupJoin}
                    disabled={groupLoading}
                  >
                    {groupLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="h-5 w-5 mr-2" />
                    )}
                    Entrar no Grupo
                  </Button>
                  <p className="text-green-100 text-sm">
                    {currentUser ? '🔐 Acesso liberado' : '🔒 Login necessário'}
                    {isDemoMode && ' (Demo)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Support Section */}
        <Card className="bg-blue-50 border-blue-300 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <HelpCircle className="h-5 w-5" />
              Precisa de ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              Nossa equipe está aqui para ajudar! Entre em contato se tiver dúvidas sobre os resultados ou precisar de suporte.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleContactSupport}
                className="border-blue-300 text-blue-800 hover:bg-blue-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email: contato@edublin.com.br
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const whatsappMessage = encodeURIComponent(`Olá! Preciso de ajuda com os resultados da busca no Edublin.`);
                  window.open(`https://wa.me/5511999999999?text=${whatsappMessage}`, '_blank');
                }}
                className="border-green-300 text-green-800 hover:bg-green-100"
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp Suporte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card className="bg-green-50 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Shield className="h-5 w-5" />
              Dicas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-900">
              <div>
                <h4 className="font-medium mb-2">Ao conversar:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Mantenha o foco no intercâmbio</li>
                  <li>Não compartilhe dados pessoais sensíveis</li>
                  <li>Use apenas os canais oficiais inicialmente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Para encontros:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Sempre em locais públicos</li>
                  <li>Conte para alguém onde vai</li>
                  <li>Confie nos seus instintos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}