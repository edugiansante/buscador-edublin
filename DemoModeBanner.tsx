import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Info, 
  Settings, 
  Play, 
  Users, 
  Database, 
  ExternalLink,
  X,
  CheckCircle
} from "lucide-react";

interface DemoModeBannerProps {
  onConfigureSupabase: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function DemoModeBanner({ 
  onConfigureSupabase, 
  onDismiss, 
  showDismiss = true 
}: DemoModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('demo_banner_dismissed', 'true');
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Play className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Modo Demonstração</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        DEMO
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Explore todas as funcionalidades com dados de exemplo
                    </p>
                  </div>
                </div>
                
                {showDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900 text-sm">Busca Funcional</div>
                    <div className="text-xs text-green-700">Teste o sistema de busca</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900 text-sm">Perfis de Exemplo</div>
                    <div className="text-xs text-green-700">Veja resultados realistas</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Database className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900 text-sm">Dados Simulados</div>
                    <div className="text-xs text-green-700">Sem necessidade de conta</div>
                  </div>
                </div>
              </div>

              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>Como funciona:</strong> Todos os dados são simulados e não são salvos. 
                  Para usar com dados reais, configure sua instância do Supabase.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={onConfigureSupabase}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Supabase
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open('https://github.com/your-repo/edublin-demo', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no GitHub
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-gray-600"
                >
                  Continuar Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}