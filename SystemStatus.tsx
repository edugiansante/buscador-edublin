import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { AuthService } from "../lib/auth";
import { supabaseConfig } from "../lib/supabase";
import { canCopyToClipboard, testClipboard } from "../lib/clipboard";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Database, 
  Clipboard,
  Wifi,
  Shield,
  Play
} from "lucide-react";

export function SystemStatus() {
  const [status, setStatus] = useState({
    supabase: 'checking' as 'checking' | 'connected' | 'demo' | 'error',
    auth: 'checking' as 'checking' | 'ready' | 'error',
    clipboard: 'checking' as 'checking' | 'available' | 'limited' | 'unavailable',
    database: 'checking' as 'checking' | 'setup' | 'needs-setup' | 'error'
  });
  
  const [details, setDetails] = useState<any>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    console.log('🔍 Checking system status...');
    
    // Check Supabase configuration
    try {
      const envInfo = AuthService.getEnvironmentInfo();
      if (envInfo.supabaseConfigured) {
        setStatus(prev => ({ ...prev, supabase: 'connected' }));
        
        // Check database if Supabase is configured
        try {
          const dbStatus = await AuthService.getDatabaseStatus();
          setStatus(prev => ({ 
            ...prev, 
            database: dbStatus.isSetup ? 'setup' : 'needs-setup' 
          }));
          setDetails(prev => ({ ...prev, database: dbStatus }));
        } catch (error) {
          setStatus(prev => ({ ...prev, database: 'error' }));
          setDetails(prev => ({ ...prev, database: { error: error instanceof Error ? error.message : 'Unknown error' } }));
        }
      } else {
        setStatus(prev => ({ ...prev, supabase: 'demo', database: 'demo' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, supabase: 'error' }));
      setDetails(prev => ({ ...prev, supabase: { error: error instanceof Error ? error.message : 'Unknown error' } }));
    }

    // Check auth readiness
    try {
      const authReady = AuthService.isDemoMode() || supabaseConfig.isConfigured;
      setStatus(prev => ({ ...prev, auth: authReady ? 'ready' : 'error' }));
    } catch (error) {
      setStatus(prev => ({ ...prev, auth: 'error' }));
    }

    // Check clipboard capability
    try {
      const clipboardCheck = canCopyToClipboard();
      setStatus(prev => ({ 
        ...prev, 
        clipboard: clipboardCheck.canCopy ? 'available' : 
                   clipboardCheck.suggestions && clipboardCheck.suggestions.length > 0 ? 'limited' : 'unavailable'
      }));
      setDetails(prev => ({ ...prev, clipboard: clipboardCheck }));
    } catch (error) {
      setStatus(prev => ({ ...prev, clipboard: 'unavailable' }));
      setDetails(prev => ({ ...prev, clipboard: { error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleTestClipboard = async () => {
    setTesting(true);
    try {
      await testClipboard();
      setTimeout(checkSystemStatus, 500); // Recheck after test
    } catch (error) {
      console.error('Clipboard test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
      case 'connected':
      case 'ready':
      case 'available':
      case 'setup':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'demo':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'limited':
      case 'needs-setup':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (component: string, status: string) => {
    const texts: Record<string, Record<string, string>> = {
      supabase: {
        checking: 'Verificando...',
        connected: 'Conectado',
        demo: 'Modo Demo',
        error: 'Erro'
      },
      auth: {
        checking: 'Verificando...',
        ready: 'Pronto',
        error: 'Erro'
      },
      clipboard: {
        checking: 'Verificando...',
        available: 'Disponível',
        limited: 'Limitado',
        unavailable: 'Indisponível'
      },
      database: {
        checking: 'Verificando...',
        setup: 'Configurado',
        'needs-setup': 'Precisa Configurar',
        demo: 'Modo Demo',
        error: 'Erro'
      }
    };
    return texts[component]?.[status] || 'Desconhecido';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
      case 'available':
      case 'setup':
        return 'bg-green-100 text-green-800';
      case 'demo':
        return 'bg-blue-100 text-blue-800';
      case 'limited':
      case 'needs-setup':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Supabase Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Supabase</p>
              <p className="text-sm text-gray-600">
                {status.supabase === 'demo' ? 'Dados simulados' : 'Banco de dados'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.supabase)}
            <Badge className={getStatusColor(status.supabase)}>
              {getStatusText('supabase', status.supabase)}
            </Badge>
          </div>
        </div>

        {/* Database Status */}
        {status.supabase === 'connected' && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Banco de Dados</p>
                <p className="text-sm text-gray-600">Tabelas e schema</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.database)}
              <Badge className={getStatusColor(status.database)}>
                {getStatusText('database', status.database)}
              </Badge>
            </div>
          </div>
        )}

        {/* Auth Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Autenticação</p>
              <p className="text-sm text-gray-600">
                {status.supabase === 'demo' ? 'Sistema demo' : 'Sistema de login'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.auth)}
            <Badge className={getStatusColor(status.auth)}>
              {getStatusText('auth', status.auth)}
            </Badge>
          </div>
        </div>

        {/* Clipboard Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Clipboard className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Área de Transferência</p>
              <p className="text-sm text-gray-600">Capacidade de cópia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.clipboard)}
            <Badge className={getStatusColor(status.clipboard)}>
              {getStatusText('clipboard', status.clipboard)}
            </Badge>
          </div>
        </div>

        {/* Clipboard Test Button */}
        {status.clipboard !== 'checking' && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestClipboard}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clipboard className="h-4 w-4 mr-2" />
              )}
              Testar Clipboard
            </Button>
          </div>
        )}

        {/* Status Summary */}
        {status.supabase === 'demo' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Play className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Modo Demonstração:</strong> O sistema está funcionando com dados simulados. 
              Todas as funcionalidades estão ativas para teste.
            </AlertDescription>
          </Alert>
        )}

        {status.clipboard === 'limited' && details.clipboard?.suggestions && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>Clipboard Limitado:</strong> {details.clipboard.reason}. 
              Sugestões: {details.clipboard.suggestions.join(', ')}.
            </AlertDescription>
          </Alert>
        )}

        {status.clipboard === 'unavailable' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Clipboard Indisponível:</strong> A cópia automática não funciona neste ambiente. 
              Use Ctrl+C (Cmd+C) para copiar textos selecionados.
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={checkSystemStatus}>
            <Wifi className="h-4 w-4 mr-2" />
            Verificar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}