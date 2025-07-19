import React, { useState } from 'react'
import FuturisticAIChat from './components/ChatView'
import { Toaster } from './components/ui/sonner'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { UserMenu } from './components/auth/UserMenu'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Loader2 } from 'lucide-react'

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <main className="h-screen w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-lg font-medium">Loading...</p>
            <p className="text-sm text-muted-foreground">Checking authentication status</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) {
    if (!showAuth) {
      return (
        <main className="h-screen w-full flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <h1 className="text-3xl font-bold mb-4">AI Chat Assistant</h1>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                Please sign in to start chatting with your AI assistant
              </p>
              <div className="flex flex-col gap-4 w-full">
                <Button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuth(true);
                  }}
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      );
    }

    return (
      <main className="h-screen w-full flex items-center justify-center p-4">
        {authMode === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setAuthMode('register')}
            onSuccess={() => setShowAuth(false)}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setAuthMode('login')}
            onSuccess={() => setShowAuth(false)}
          />
        )}
        
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowAuth(false)}
          >
            ← Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full">
      <div className="absolute top-4 right-4 z-50">
        <UserMenu />
      </div>
      <FuturisticAIChat />
      <Toaster />
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App
