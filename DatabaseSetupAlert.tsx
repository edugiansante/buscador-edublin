import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, Database, ExternalLink, Copy, CheckCircle, Download, Eye, EyeOff, Share, TestTube } from "lucide-react";
import { AuthService } from "../lib/auth";
import { copyToClipboard, downloadAsFile, shareText, isClipboardSupported } from "../lib/clipboard";

interface DatabaseStatus {
  isSetup: boolean;
  error: string | null;
  needsSetup: boolean;
  details: any;
}

const SQL_CONTENT = `-- Edublin Database Setup Script
-- Run this entire script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    idade INTEGER,
    cidade_origem TEXT,
    telefone TEXT,
    whatsapp TEXT,
    whatsapp_opt_in BOOLEAN DEFAULT FALSE,
    foto_url TEXT,
    interesses TEXT[] DEFAULT '{}',
    verificado BOOLEAN DEFAULT FALSE,
    premium BOOLEAN DEFAULT FALSE,
    relatos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add missing columns to existing tables (safe migrations)
DO $$ 
BEGIN
    -- Add idade column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'idade') THEN
        ALTER TABLE public.users ADD COLUMN idade INTEGER;
    END IF;
    
    -- Add cidade_origem column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'cidade_origem') THEN
        ALTER TABLE public.users ADD COLUMN cidade_origem TEXT;
    END IF;
    
    -- Add telefone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'telefone') THEN
        ALTER TABLE public.users ADD COLUMN telefone TEXT;
    END IF;
    
    -- Add other required columns...
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'whatsapp') THEN
        ALTER TABLE public.users ADD COLUMN whatsapp TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'whatsapp_opt_in') THEN
        ALTER TABLE public.users ADD COLUMN whatsapp_opt_in BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'verificado') THEN
        ALTER TABLE public.users ADD COLUMN verificado BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'premium') THEN
        ALTER TABLE public.users ADD COLUMN premium BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'relatos') THEN
        ALTER TABLE public.users ADD COLUMN relatos INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create other necessary tables
CREATE TABLE IF NOT EXISTS public.search_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    cidade_origem TEXT NOT NULL,
    pais_destino TEXT NOT NULL,
    cidade_destino TEXT NOT NULL,
    escola TEXT,
    cia_aerea TEXT,
    mes_ano TEXT NOT NULL,
    curso TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        id, email, nome, idade, telefone, verificado, whatsapp_opt_in, premium, relatos
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'nome', 'User'),
        (NEW.raw_user_meta_data->>'idade')::INTEGER,
        NEW.raw_user_meta_data->>'telefone',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
        FALSE, FALSE, 0
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW; -- Profile already exists
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Test function
CREATE OR REPLACE FUNCTION public.test_database_setup()
RETURNS TABLE(table_name TEXT, column_count BIGINT, has_policies BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public'),
        (SELECT COUNT(*) > 0 FROM pg_policies p WHERE p.tablename = t.table_name AND p.schemaname = 'public')
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name IN ('users', 'search_criteria')
    ORDER BY t.table_name;
END;
$$;

-- Final test
SELECT * FROM public.test_database_setup();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Database setup completed! Check the test results above.';
END $$;`;

export function DatabaseSetupAlert() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [showFullSQL, setShowFullSQL] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const dbStatus = await AuthService.getDatabaseStatus();
      setStatus(dbStatus);
    } catch (error) {
      setStatus({
        isSetup: false,
        error: 'Connection failed',
        needsSetup: true,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseFunctionality = async () => {
    setTesting(true);
    try {
      const result = await AuthService.testDatabaseFunctionality();
      if (result.success) {
        console.log('Database test successful:', result.data);
        // Refresh status after test
        await checkDatabaseStatus();
      } else {
        console.error('Database test failed:', result.error);
      }
    } catch (error) {
      console.error('Database test exception:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleCopySQL = async () => {
    setCopyStatus('copying');
    
    try {
      const result = await copyToClipboard(SQL_CONTENT);
      
      if (result.success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        console.error('Copy failed:', result.error);
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Copy error:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleDownloadSQL = () => {
    const success = downloadAsFile(SQL_CONTENT, 'edublin-database-setup.sql', 'text/plain');
    if (!success) {
      console.error('Download failed');
    }
  };

  const handleShareSQL = async () => {
    const success = await shareText(SQL_CONTENT, 'Edublin Database Setup SQL');
    if (!success) {
      // Fallback to copy if share is not available
      handleCopySQL();
    }
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying': return 'Copiando...';
      case 'success': return 'Copiado!';
      case 'error': return 'Erro';
      default: return 'Copiar';
    }
  };

  const getCopyButtonIcon = () => {
    switch (copyStatus) {
      case 'copying': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Copy className="h-4 w-4" />;
    }
  };

  const getStatusBadgeText = () => {
    if (!status) return 'Verificando...';
    if (status.isSetup) return 'Configurado';
    if (status.error?.includes('Schema incomplete') || status.error?.includes('missing columns')) {
      return 'Schema incompleto';
    }
    if (status.needsSetup) return 'Não criadas';
    return 'Erro de conexão';
  };

  const getStatusBadgeVariant = () => {
    if (!status) return 'secondary';
    if (status.isSetup) return 'default';
    return 'destructive';
  };

  const clipboardSupported = isClipboardSupported();

  if (loading) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4" />
        <AlertTitle>Verificando configuração do banco...</AlertTitle>
        <AlertDescription>
          Aguarde enquanto verificamos se as tabelas foram criadas.
        </AlertDescription>
      </Alert>
    );
  }

  if (status?.isSetup) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>✅ Banco de dados configurado!</AlertTitle>
        <AlertDescription>
          Todas as tabelas e configurações estão funcionando corretamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Banco de dados precisa de configuração</AlertTitle>
        <AlertDescription>
          {status?.error?.includes('Schema incomplete') || status?.error?.includes('missing columns') 
            ? 'O schema do banco está incompleto. Algumas colunas estão faltando.'
            : 'As tabelas do banco de dados precisam ser criadas antes de usar a aplicação.'
          }
        </AlertDescription>
      </Alert>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Database className="h-5 w-5" />
            Configuração necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status das tabelas:</span>
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusBadgeText()}
            </Badge>
          </div>

          {(status?.needsSetup || status?.error?.includes('Schema incomplete')) && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">📋 Passos para configurar:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>
                    Acesse o{' '}
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      Supabase Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Selecione seu projeto</li>
                  <li>Vá em <strong>SQL Editor</strong> no menu lateral</li>
                  <li>Cole o SQL completo e execute</li>
                  <li>Aguarde a mensagem "SUCCESS" aparecer</li>
                  <li>Clique em "Verificar novamente" abaixo</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">📄 SQL de configuração atualizado:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopySQL}
                      disabled={copyStatus === 'copying'}
                      className={`flex items-center gap-2 ${
                        copyStatus === 'success' ? 'border-green-300 bg-green-50 text-green-700' :
                        copyStatus === 'error' ? 'border-red-300 bg-red-50 text-red-700' : ''
                      }`}
                    >
                      {getCopyButtonIcon()}
                      {getCopyButtonText()}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadSQL}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    {/* Show share button on mobile devices */}
                    {navigator.share && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleShareSQL}
                        className="flex items-center gap-2"
                      >
                        <Share className="h-4 w-4" />
                        Compartilhar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFullSQL(!showFullSQL)}
                    className="flex items-center gap-2 text-sm"
                  >
                    {showFullSQL ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showFullSQL ? 'Ocultar SQL' : 'Ver SQL completo'}
                  </Button>

                  {showFullSQL && (
                    <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{SQL_CONTENT}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">💡 Dicas importantes:</h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Execute todo o SQL de uma vez só (não linha por linha)</li>
                  <li>Aguarde a mensagem <strong>"SUCCESS: Database setup completed!"</strong></li>
                  <li>Se der erro, limpe o editor e cole o SQL novamente</li>
                  <li>O script é seguro para rodar múltiplas vezes (não vai duplicar dados)</li>
                  <li>Inclui migrações automáticas para tabelas existentes</li>
                </ul>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={checkDatabaseStatus} size="sm">
                  ↻ Verificar novamente
                </Button>
                <Button 
                  onClick={testDatabaseFunctionality}
                  disabled={testing}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  {testing ? 'Testando...' : 'Testar Funções'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Ocultar' : 'Ver'} detalhes técnicos
                </Button>
              </div>

              {showDetails && status.details && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Detalhes do erro:</h5>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(status.details, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}

          {!status?.needsSetup && !status?.error?.includes('Schema incomplete') && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Erro de conexão com o banco de dados. Verifique:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Se as credenciais do Supabase estão corretas</li>
                <li>Se o projeto Supabase está ativo</li>
                <li>Se há conectividade com a internet</li>
              </ul>
              <Button onClick={checkDatabaseStatus} size="sm">
                ↻ Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help text for copy issues */}
      {copyStatus === 'error' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Problema ao copiar automaticamente</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Não foi possível copiar o texto automaticamente. Tente:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Download:</strong> Use o botão "Download" para baixar o arquivo SQL</li>
              <li><strong>Manual:</strong> Clique em "Ver SQL completo" e selecione o texto manualmente</li>
              <li><strong>Compartilhar:</strong> {navigator.share ? 'Use o botão "Compartilhar"' : 'Função não disponível neste navegador'}</li>
              {!clipboardSupported && <li><strong>HTTPS:</strong> Esta função funciona melhor em conexões seguras (HTTPS)</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Browser compatibility info */}
      {!clipboardSupported && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ⚠️ <strong>Clipboard limitado:</strong> Use os botões "Download" ou "Ver SQL completo" para obter o código.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}