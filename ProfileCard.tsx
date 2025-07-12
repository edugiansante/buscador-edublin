import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { UserData } from "./AuthModal";
import { SearchService } from "../lib/search";
import { supabaseConfig } from "../lib/supabase";
import { 
  Star, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Plane, 
  MessageCircle, 
  Shield, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  CheckCircle,
  Phone,
  Send
} from "lucide-react";

export interface UserProfile {
  id: string;
  nome: string;
  idade: number;
  cidade: string;
  destino: string;
  escola: string;
  dataChegada: string;
  ciaAerea: string;
  foto: string;
  compatibilidade: number;
  interesses: string[];
  curso: string;
  whatsapp?: string;
  whatsappOptIn: boolean;
  verificado: boolean;
  premium: boolean;
  relatos: number;
}

interface ProfileCardProps {
  profile: UserProfile;
  currentUser: UserData | null;
  searchCriteriaId: string | null;
  onAuthRequired: () => void;
  isPreview?: boolean;
}

export function ProfileCard({ profile, currentUser, searchCriteriaId, onAuthRequired, isPreview = false }: ProfileCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [requestingContact, setRequestingContact] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemoMode = !supabaseConfig.isConfigured;

  const canContact = currentUser && 
    currentUser.verificado && 
    profile.verificado && 
    profile.whatsappOptIn && 
    profile.relatos < 3 &&
    !isPreview &&
    searchCriteriaId;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-400";
    if (score >= 70) return "bg-yellow-400";
    return "bg-gray-400";
  };

  const handleContactRequest = async () => {
    if (!currentUser || !searchCriteriaId) {
      onAuthRequired();
      return;
    }

    if (!canContact) {
      return;
    }

    try {
      setRequestingContact(true);
      setError(null);

      if (isDemoMode) {
        // Demo mode - simulate contact request
        await new Promise(resolve => setTimeout(resolve, 1500));
        setContactRequested(true);
        console.log('Demo contact request sent successfully');
        return;
      }

      // Create contact request via Supabase
      await SearchService.requestContact(
        currentUser.id,
        profile.id,
        searchCriteriaId,
        `Olá ${profile.nome}! Vi seu perfil no Edublin Connect e também vou para ${profile.destino} em ${formatDate(profile.dataChegada)}. Que tal conversarmos sobre o intercâmbio?`
      );
      
      setContactRequested(true);
      console.log('Contact request sent successfully');
    } catch (err: any) {
      console.error('Error requesting contact:', err);
      setError('Erro ao solicitar contato. Tente novamente.');
    } finally {
      setRequestingContact(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!canContact) {
      // If we can't contact, redirect to request
      if (!contactRequested) {
        handleContactRequest();
        return;
      }
      return;
    }
    
    // Generate WhatsApp message
    const message = encodeURIComponent(
      `Oi ${profile.nome}! Vi seu perfil no Edublin Connect e vou para ${profile.destino} também em ${formatDate(profile.dataChegada)}. Que tal conversarmos sobre o intercâmbio?`
    );
    
    let whatsappUrl;
    
    if (isDemoMode || !profile.whatsapp) {
      // Demo mode or no WhatsApp - redirect to demo number
      whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    } else {
      // Real WhatsApp number
      whatsappUrl = `https://wa.me/${profile.whatsapp}?text=${message}`;
    }
    
    window.open(whatsappUrl, '_blank');
  };

  const handleDirectWhatsApp = () => {
    // Direct WhatsApp contact from details modal
    const message = encodeURIComponent(
      `Olá ${profile.nome}! Vi seu perfil no Edublin e gostaria de conversar sobre nosso intercâmbio para ${profile.destino}. Podemos trocar algumas informações?`
    );
    
    let whatsappUrl;
    
    if (isDemoMode || !profile.whatsapp) {
      // Demo mode - use demo number
      whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    } else {
      // Real WhatsApp number
      whatsappUrl = `https://wa.me/${profile.whatsapp}?text=${message}`;
    }
    
    window.open(whatsappUrl, '_blank');
  };

  const getContactButtonText = () => {
    if (contactRequested) {
      return profile.whatsapp || isDemoMode ? 'Conversar no WhatsApp' : 'Solicitação Enviada';
    }
    return 'Solicitar Contato';
  };

  const getContactButtonAction = () => {
    if (contactRequested && (profile.whatsapp || isDemoMode)) {
      return handleWhatsAppContact;
    }
    return handleContactRequest;
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${isPreview ? 'opacity-90' : ''}`}>
        <CardContent className="p-6">
          {/* Header with avatar and compatibility */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={isPreview ? undefined : profile.foto} alt={profile.nome} />
                <AvatarFallback>{getInitials(profile.nome)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{profile.nome}</h3>
                <p className="text-sm text-gray-500">{profile.idade} anos • {profile.cidade}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${getCompatibilityColor(profile.compatibilidade)}`}></div>
              <span className="text-sm font-medium text-gray-700">{profile.compatibilidade}%</span>
            </div>
          </div>

          {/* Verification badges */}
          <div className="flex gap-2 mb-4">
            {profile.verificado && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
            {profile.premium && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                <Star className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isPreview && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Prévia
              </Badge>
            )}
            {contactRequested && !isPreview && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Solicitado
              </Badge>
            )}
            {isDemoMode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                <span className="text-xs mr-1">🎭</span>
                Demo
              </Badge>
            )}
          </div>

          {/* Trip details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{profile.destino}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(profile.dataChegada)}</span>
            </div>
            {profile.escola && !isPreview && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4" />
                <span>{profile.escola}</span>
              </div>
            )}
            {profile.ciaAerea && profile.ciaAerea !== "nao-sei" && !isPreview && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Plane className="h-4 w-4" />
                <span>{profile.ciaAerea}</span>
              </div>
            )}
          </div>

          {/* Interests */}
          {profile.interesses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Interesses:</p>
              <div className="flex flex-wrap gap-1">
                {profile.interesses.slice(0, 3).map((interesse, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interesse}
                  </Badge>
                ))}
                {profile.interesses.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.interesses.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {isPreview ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onAuthRequired}
              >
                <Lock className="h-4 w-4 mr-2" />
                Entre para Ver Mais
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowDetails(true)}
                >
                  Ver Detalhes
                </Button>
                
                {canContact && (
                  <Button 
                    size="sm" 
                    className={`w-full ${contactRequested ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={getContactButtonAction()}
                    disabled={requestingContact || (contactRequested && !profile.whatsapp && !isDemoMode)}
                  >
                    {requestingContact ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : contactRequested ? (
                      (profile.whatsapp || isDemoMode) ? (
                        <MessageCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    {getContactButtonText()}
                  </Button>
                )}
                
                {!canContact && currentUser && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {!currentUser.verificado ? 'Verifique seu email para contatar' :
                     !profile.verificado ? 'Usuário não verificado' :
                     !profile.whatsappOptIn ? 'Usuário não disponível para contato' :
                     'Contato não disponível'}
                  </div>
                )}
                
                {!currentUser && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={onAuthRequired}
                  >
                    Entre para Conectar
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Error display */}
          {error && (
            <Alert className="mt-3 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Profile Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.foto} alt={profile.nome} />
                <AvatarFallback>{getInitials(profile.nome)}</AvatarFallback>
              </Avatar>
              <div>
                <span>{profile.nome}</span>
                <p className="text-sm text-gray-500 font-normal">
                  {profile.idade} anos • {profile.cidade}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Compatibility */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-800">Compatibilidade</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getCompatibilityColor(profile.compatibilidade)}`}></div>
                <span className="font-semibold text-green-900">{profile.compatibilidade}%</span>
              </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Detalhes da Viagem</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destino:</span>
                  <span>{profile.destino}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chegada:</span>
                  <span>{formatDate(profile.dataChegada)}</span>
                </div>
                {profile.escola && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Escola:</span>
                    <span>{profile.escola}</span>
                  </div>
                )}
                {profile.curso && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Curso:</span>
                    <span>{profile.curso}</span>
                  </div>
                )}
                {profile.ciaAerea && profile.ciaAerea !== "nao-sei" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Companhia:</span>
                    <span>{profile.ciaAerea}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interests */}
            {profile.interesses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Interesses</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interesses.map((interesse, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {interesse}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Actions */}
            <div className="space-y-2 pt-4 border-t">
              {canContact ? (
                <>
                  {/* Primary contact button */}
                  <Button 
                    className={`w-full ${contactRequested ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={getContactButtonAction()}
                    disabled={requestingContact || (contactRequested && !profile.whatsapp && !isDemoMode)}
                  >
                    {requestingContact ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : contactRequested ? (
                      (profile.whatsapp || isDemoMode) ? (
                        <MessageCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {getContactButtonText()}
                  </Button>

                  {/* Direct WhatsApp button (always available when contact is allowed) */}
                  <Button 
                    variant="outline"
                    className="w-full border-green-300 text-green-800 hover:bg-green-50"
                    onClick={handleDirectWhatsApp}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Enviar Mensagem WhatsApp
                    {isDemoMode && <span className="ml-1 text-xs">(Demo)</span>}
                  </Button>
                </>
              ) : !currentUser ? (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={onAuthRequired}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Entre para Conectar
                </Button>
              ) : (
                <div className="space-y-2">
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 text-sm">
                      <strong>Contato limitado:</strong>{' '}
                      {!currentUser.verificado ? 'Verifique seu email para liberar contatos.' :
                       !profile.verificado ? 'Este usuário ainda não foi verificado.' :
                       !profile.whatsappOptIn ? 'Este usuário não liberou contato direto.' :
                       'Este usuário atingiu o limite de contatos.'}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Still show WhatsApp button for demo or if they want to try */}
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={handleDirectWhatsApp}
                    disabled={!isDemoMode}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {isDemoMode ? 'Tentar WhatsApp (Demo)' : 'WhatsApp não disponível'}
                  </Button>
                </div>
              )}
              
              {contactRequested && !profile.whatsapp && !isDemoMode && (
                <p className="text-xs text-center text-gray-600">
                  Sua solicitação foi enviada. O usuário receberá uma notificação e poderá entrar em contato.
                </p>
              )}

              {isDemoMode && (
                <p className="text-xs text-center text-blue-600">
                  🎭 <strong>Modo Demo:</strong> Os contatos redirecionam para números de demonstração.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}