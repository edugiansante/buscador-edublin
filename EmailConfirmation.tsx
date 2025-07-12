import { useEffect, useState } from 'react'
import { AuthService } from '../lib/auth'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface EmailConfirmationProps {
  onConfirmed: () => void
  onError: (error: string) => void
}

export function EmailConfirmation({ onConfirmed, onError }: EmailConfirmationProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleConfirmation()
  }, [])

  const handleConfirmation = async () => {
    try {
      const result = await AuthService.handleEmailConfirmation()
      
      if (result.success) {
        setStatus('success')
        setMessage('Email confirmado com sucesso!')
        setTimeout(() => {
          onConfirmed()
        }, 2000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Erro ao confirmar email.')
        onError(result.error || 'Erro ao confirmar email.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Erro inesperado ao confirmar email.')
      onError('Erro inesperado ao confirmar email.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirmando seu email...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto verificamos seu email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                Sua conta foi verificada com sucesso. Você será redirecionado em instantes.
              </p>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Erro na confirmação
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleConfirmation}
                  className="w-full"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
                <Button 
                  onClick={onConfirmed}
                  className="w-full"
                >
                  Voltar ao início
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}