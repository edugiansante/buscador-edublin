import { Button } from "./ui/button";
import { ArrowRight, Check, Users, Shield, MessageCircle, Globe, Clock, Star } from "lucide-react";

interface HowItWorksProps {
  onStartOnboarding: () => void;
  onBack: () => void;
}

export function HowItWorks({ onStartOnboarding, onBack }: HowItWorksProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 to-green-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-20 w-40 h-40 bg-white rounded-full blur-xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Como funciona o <span className="text-orange-300">Edublin Connect</span>
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Conectar intercambistas nunca foi tão fácil e seguro. Veja como em poucos passos você encontra seu companheiro de viagem.
            </p>
          </div>
        </div>
      </section>

      {/* Main Steps */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 mb-20">
              <div className="lg:w-1/2 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Conte sobre sua viagem</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Preencha um formulário simples com informações sobre seu intercâmbio: destino, data de chegada, escola e companhia aérea.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Processo rápido de 2 minutos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Informações 100% seguras</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Sem necessidade de cadastro inicial</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 order-1 lg:order-2">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-semibold">Suas informações</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origem:</span>
                        <span className="font-medium">São Paulo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destino:</span>
                        <span className="font-medium">Dublin, Irlanda</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chegada:</span>
                        <span className="font-medium">Agosto 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Escola:</span>
                        <span className="font-medium">EC Dublin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 mb-20">
              <div className="lg:w-1/2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-orange-400 fill-current" />
                          <span className="text-xs text-gray-600">95% match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Encontre seus matches</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Nossa inteligência artificial encontra outros intercambistas com perfil similar ao seu, considerando destino, datas e preferências.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Algoritmo de compatibilidade avançado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Perfis verificados e seguros</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Filtros por escola, data e interesses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Conecte-se com segurança</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Converse diretamente via WhatsApp e faça amizades antes mesmo de chegar ao seu destino. Tudo com máxima segurança e privacidade.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Contato direto via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Privacidade garantida</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Sistema de denúncias integrado</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 order-1 lg:order-2">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-semibold">WhatsApp Connect</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm bg-gray-100 rounded-lg p-2">
                            Oi! Vi que você também vai para Dublin em agosto. Que legal! 😊
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 justify-end">
                        <div className="flex-1">
                          <p className="text-sm bg-green-500 text-white rounded-lg p-2 text-right">
                            Oi! Sim! Você vai estudar na EC Dublin também?
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que usar o Edublin Connect?
            </h2>
            <p className="text-lg text-gray-600 mb-12">
              Mais de 2.800 intercambistas já fizeram amizades através da nossa plataforma
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Reduza a ansiedade</h3>
                <p className="text-sm text-gray-600">
                  Conheça pessoas antes de viajar e chegue ao destino com amigos esperando por você.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Economize tempo</h3>
                <p className="text-sm text-gray-600">
                  Encontre pessoas compatíveis rapidamente sem precisar procurar em grupos genéricos.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Máxima segurança</h3>
                <p className="text-sm text-gray-600">
                  Perfis verificados, sistema de denúncias e controle total sobre suas informações.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-700 to-green-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para encontrar seu companheiro de intercâmbio?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Junte-se a milhares de intercambistas que já fizeram amizades através da nossa plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                onClick={onStartOnboarding}
              >
                Começar Agora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-white hover:bg-white/10 px-8 py-4"
                onClick={onBack}
              >
                Voltar ao Início
              </Button>
            </div>
            
            <p className="text-green-100">
              ✨ Grátis para sempre • Sem cartão de crédito • 100% seguro
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}