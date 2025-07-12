import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Menu, User, LogOut, Settings, Shield } from "lucide-react";
import { UserData } from "./AuthModal";
import edublinLogo from 'figma:asset/6904bc83a71a4183ab70a31279f30245aae9215e.png';

interface HeaderProps {
  onLogoClick?: () => void;
  onHowItWorksClick?: () => void;
  currentUser?: UserData | null;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export function Header({ onLogoClick, onHowItWorksClick, currentUser, onSignOut, onSignIn }: HeaderProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onLogoClick}
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={edublinLogo} 
              alt="Edublin" 
              className="h-8 w-auto"
            />
          </button>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-600 hover:text-green-800 transition-colors">Buscar</a>
          <button 
            onClick={onHowItWorksClick}
            className="text-gray-600 hover:text-green-800 transition-colors"
          >
            Como Funciona
          </button>
          <a href="#" className="text-gray-600 hover:text-green-800 transition-colors">Contato</a>
          
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.foto_url || undefined} alt={currentUser.nome} />
                    <AvatarFallback>{getInitials(currentUser.nome)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{currentUser.nome}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                {!currentUser.verificado && (
                  <DropdownMenuItem className="text-orange-600">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Verificar E-mail</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" className="border-green-300 text-green-800 hover:bg-green-50" onClick={onSignIn}>
                Entrar
              </Button>
              <Button size="sm" className="bg-green-800 hover:bg-green-900" onClick={onSignIn}>
                Cadastrar
              </Button>
            </>
          )}
        </nav>
        
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}