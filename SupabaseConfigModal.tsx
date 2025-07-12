import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { AlertTriangle, Database, ExternalLink, CheckCircle, Eye, EyeOff } from "lucide-react";

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose, onConfigured }: SupabaseConfigModalProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Basic URL validation
    try {
      new URL(supabaseUrl);
    } catch {
      setError('URL do Supabase inválida');
      return;
    }

    // Basic key validation (should start with 'eyJ')
    if (!supabaseKey.startsWith('eyJ')) {
      setError('Chave do Supabase parece estar incorreta (deve começar com "eyJ")');
      return;
    }

    setTesting(true);
    setError(null);

    try {
      // Save to localStorage
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_anon_key', supabaseKey);

      // Force page reload to reinitialize Supabase
      setTimeout(() => {
        window.location.reload();
      }, 500);

      onConfigured();
    } catch (error) {
      console.error('Error saving Supabase config:', error);
      setError('Erro ao salvar configuração');
    } finally {
      setTesting(false);
    }
  };

  const handleSkip = () => {
    // Save a flag to skip this modal in the future
    localStorage.setItem('supabase_config_skipped', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Configurar Supabase</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure suas credenciais do Supabase para habilitar todas as funcionalidades
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Credenciais não encontradas</AlertTitle>
            <AlertDescription>
              Para usar todas as funcionalidades (autenticação, salvamento de dados), 
              você precisa configurar um projeto Supabase.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">URL do Projeto Supabase</Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://xxxxxxxxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-key">Chave Anônima (anon key)</Label>
              <div className="relative">
                <Input
                  id="supabase-key"
                  type={showKey ? "text" : "password"}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Como obter suas credenciais:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Acesse{' '}
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  supabase.com/dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Crie um novo projeto ou selecione um existente</li>
              <li>Vá em <strong>Settings</strong> &gt; <strong>API</strong></li>
              <li>Copie a <strong>URL</strong> e a <strong>anon/public key</strong></li>
              <li>Cole as credenciais nos campos acima</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">💡 Importante:</h5>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>Suas credenciais ficam armazenadas apenas no seu navegador</li>
              <li>Você ainda precisará executar o SQL de configuração no Supabase</li>
              <li>Este é um projeto de demonstração - use projetos de teste</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={testing || !supabaseUrl || !supabaseKey}
              className="flex-1"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar e Recarregar
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSkip}
              disabled={testing}
            >
              Pular por agora
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Você pode configurar isso mais tarde acessando as configurações
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}