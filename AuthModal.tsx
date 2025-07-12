import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { AuthService } from "../lib/auth";
import { supabaseConfig } from "../lib/supabase";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Play,
  UserPlus,
  LogIn
} from "lucide-react";

export interface UserData {
  id: string;
  email: string;
  nome: string;
  idade?: number;
  telefone?: string;
  verificado: boolean;
  premium: boolean;
  relatos: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserData) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    idade: '',
    telefone: ''
  });

  if (!isOpen) return null;

  const isDemoMode = AuthService.isDemoMode();
  const demoCredentials = AuthService.getDemoCredentials();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!signInData.email || !signInData.password) {
        throw new Error('Preencha todos os campos');
      }

      const { user } = await AuthService.signIn({
        email: signInData.email,
        password: signInData.password
      });

      if (user) {
        setSuccess('Login realizado com sucesso!');
        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 1000);
      } else {
        throw new Error('Erro no login. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!signUpData.email || !signUpData.password || !signUpData.nome) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      if (signUpData.password !== signUpData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (signUpData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      const { user } = await AuthService.signUp({
        email: signUpData.email,
        password: signUpData.password,
        nome: signUpData.nome,
        idade: signUpData.idade ? parseInt(signUpData.idade) : undefined,
        telefone: signUpData.telefone || undefined
      });

      if (isDemoMode) {
        // In demo mode, we can sign in immediately
        const { user: signedInUser } = await AuthService.signIn({
          email: signUpData.email,
          password: signUpData.password
        });

        if (signedInUser) {
          setSuccess('Conta demo criada com sucesso!');
          setTimeout(() => {
            onSuccess(signedInUser);
            onClose();
          }, 1000);
        }
      } else {
        // In real mode, show email confirmation message
        setSuccess('Conta criada! Verifique seu email para confirmar.');
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await AuthService.signIn({
        email: demoCredentials.email,
        password: demoCredentials.password
      });

      if (user) {
        setSuccess('Login demo realizado com sucesso!');
        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error with demo sign in:', error);
      setError(error.message || 'Erro no login demo');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setSignInData({
      email: demoCredentials.email,
      password: demoCredentials.password
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🔐</span>
              Entrar ou Criar Conta
              {isDemoMode && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  DEMO
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          {isDemoMode && (
            <Alert className="border-blue-200 bg-blue-50">
              <Play className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Modo Demonstração:</strong> Suas credenciais ficam apenas no navegador. 
                Use as credenciais demo ou crie uma conta de teste.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Criar Conta
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              {isDemoMode && (
                <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <span>🎯</span>
                      Acesso Rápido Demo
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Use estas credenciais para testar rapidamente:
                    </p>
                    <div className="bg-white p-3 rounded border text-sm font-mono">
                      <div><strong>Email:</strong> {demoCredentials.email}</div>
                      <div><strong>Senha:</strong> {demoCredentials.password}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={handleDemoSignIn}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Entrar com Demo
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={fillDemoCredentials}
                        disabled={isLoading}
                      >
                        Preencher Campos
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>

              {!isDemoMode && (
                <div className="text-center">
                  <Button variant="link" size="sm" onClick={() => {
                    // TODO: Implement forgot password
                    alert('Funcionalidade em desenvolvimento');
                  }}>
                    Esqueci minha senha
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              {isDemoMode && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    <strong>Conta Demo:</strong> Seus dados ficam salvos apenas no navegador. 
                    Use qualquer email (não precisa ser real).
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signUpData.nome}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, nome: e.target.value }))}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={isDemoMode ? "qualquer@email.com" : "seu@email.com"}
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-idade">Idade</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-idade"
                        type="number"
                        placeholder="25"
                        min="16"
                        max="80"
                        value={signUpData.idade}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, idade: e.target.value }))}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-telefone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={signUpData.telefone}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, telefone: e.target.value }))}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Conta {isDemoMode && 'Demo'}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-xs text-gray-600 text-center">
                {isDemoMode ? (
                  <p>
                    🎭 <strong>Modo Demo:</strong> Seus dados ficam apenas no navegador e são removidos ao limpar o cache.
                  </p>
                ) : (
                  <p>
                    Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {!isDemoMode && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚙️</span>
                <h4 className="font-medium text-yellow-900">Quer testar sem configurar?</h4>
              </div>
              <p className="text-sm text-yellow-800 mb-3">
                Configure o Supabase ou use o modo demonstração para explorar a plataforma.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onClose}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Voltar ao Modo Demo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}