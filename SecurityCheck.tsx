import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Shield, RefreshCw, AlertTriangle } from "lucide-react";

interface SecurityCheckProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: string;
}

export function SecurityCheck({ isOpen, onClose, onSuccess, reason }: SecurityCheckProps) {
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const generateCaptcha = () => {
    const operations = [
      () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        return { question: `${a} + ${b}`, answer: a + b };
      },
      () => {
        const a = Math.floor(Math.random() * 15) + 5;
        const b = Math.floor(Math.random() * 5) + 1;
        return { question: `${a} - ${b}`, answer: a - b };
      },
      () => {
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 5) + 2;
        return { question: `${a} × ${b}`, answer: a * b };
      }
    ];

    const randomOp = operations[Math.floor(Math.random() * operations.length)]();
    setCaptchaQuestion(`Quanto é ${randomOp.question}?`);
    setCorrectAnswer(randomOp.answer);
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setCaptchaAnswer("");
      setAttempts(0);
      setIsBlocked(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(captchaAnswer) === correctAnswer) {
      onSuccess();
      onClose();
    } else {
      setAttempts(prev => prev + 1);
      setCaptchaAnswer("");
      
      if (attempts >= 2) {
        setIsBlocked(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        generateCaptcha();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription>
            {reason}
          </DialogDescription>
        </DialogHeader>

        {isBlocked ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Muitas tentativas incorretas. Tente novamente em alguns minutos.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-lg font-medium mb-4">{captchaQuestion}</p>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-20 h-12 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="?"
                required
              />
            </div>

            {attempts > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Resposta incorreta. Tentativas restantes: {3 - attempts}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Verificar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateCaptcha}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}