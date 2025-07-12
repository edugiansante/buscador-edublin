import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { OnboardingFlow, OnboardingData } from "./components/OnboardingFlow";
import { SearchResults } from "./components/SearchResults";
import { AuthModal, UserData } from "./components/AuthModal";
import { SecurityCheck } from "./components/SecurityCheck";
import { EmailConfirmation } from "./components/EmailConfirmation";
import { DebugPanel } from "./components/DebugPanel";
import { DatabaseSetupAlert } from "./components/DatabaseSetupAlert";
import { SupabaseConfigModal } from "./components/SupabaseConfigModal";
import { DemoModeBanner } from "./components/DemoModeBanner";
import { AuthService } from "./lib/auth";
import { SearchService } from "./lib/search";
import { supabaseConfig, getEnvironmentInfo } from "./lib/supabase";
import { getDemoStats } from "./lib/demo-data";
import edublinLogo from 'figma:asset/6904bc83a71a4183ab70a31279f30245aae9215e.png';

type AppState = "home" | "how-it-works" | "onboarding" | "results" | "email-confirmation";

// Ultra-short timeout utility for quick operations
const quickTimeout = <T extends any>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Check if this looks like a development/testing environment
const isDevelopmentContext = (): boolean => {
  try {
    const envInfo = getEnvironmentInfo();
    
    // Development indicators
    const hasDevIndicators = 
      envInfo.hostname === 'localhost' ||
      envInfo.hostname.includes('127.0.0.1') ||
      envInfo.hostname.includes('figma.com') ||
      envInfo.hostname.includes('netlify') ||
      envInfo.hostname.includes('vercel') ||
      envInfo.hostname.includes('github') ||
      envInfo.hostname.includes('dev') ||
      envInfo.hostname.includes('test') ||
      envInfo.hostname.includes('staging');
    
    return hasDevIndicators;
  } catch {
    return false;
  }
};

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [searchData, setSearchData] = useState<OnboardingData | null>(null);
  const [searchCriteriaId, setSearchCriteriaId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [savingSearch, setSavingSearch] = useState(false);
  const [showDatabaseAlert, setShowDatabaseAlert] = useState(false);
  const [showSupabaseConfigModal, setShowSupabaseConfigModal] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if demo banner was dismissed
  const isDemoBannerDismissed = () => {
    try {
      return localStorage.getItem('demo_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  };

  // Safe localStorage check
  const getLocalStorageItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  // Check if user explicitly wants to configure Supabase
  const hasExplicitConfigIntent = (): boolean => {
    try {
      // Check URL parameters for config intent
      const urlParams = new URLSearchParams(window.location.search);
      const hasConfigParam = urlParams.has('configure') || urlParams.has('setup');
      
      // Check if user previously tried to configure (but not skipped)
      const hasConfigAttempt = localStorage.getItem('supabase_config_attempted') === 'true';
      
      return hasConfigParam || hasConfigAttempt;
    } catch {
      return false;
    }
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const init = async () => {
      try {
        console.log('🚀 App initialization started');
        
        // Check Supabase configuration IMMEDIATELY - no async calls
        const isSupabaseConfigured = supabaseConfig.isConfigured;
        const isDevContext = isDevelopmentContext();
        const hasConfigIntent = hasExplicitConfigIntent();
        
        console.log('🌍 Environment check:', {
          supabaseConfigured: isSupabaseConfigured,
          isDevelopment: isDevContext,
          hasConfigIntent: hasConfigIntent,
          hostname: window.location.hostname
        });
        
        // If Supabase is not configured - enter demo mode IMMEDIATELY
        if (!isSupabaseConfigured) {
          console.log('🎭 Supabase not configured - entering demo mode IMMEDIATELY');
          
          if (isMounted) {
            setIsDemoMode(true);
            AuthService.forceDemoMode('Supabase not configured');
            
            // Set up demo auth listener - this should NOT make any Supabase calls
            console.log('👂 Setting up DEMO auth listener...');
            authSubscription = AuthService.onAuthStateChange((user) => {
              console.log('🔄 Demo auth state changed:', user ? `User: ${user.nome}` : 'No user');
              if (isMounted) {
                setCurrentUser(user);
                if (user) {
                  setSearchAttempts(0);
                }
              }
            });

            // IMPROVED: Only show config modal in development contexts or with explicit intent
            if ((isDevContext || hasConfigIntent) && !getLocalStorageItem('supabase_config_skipped')) {
              console.log('⚙️  Development context detected - showing config modal');
              setShowSupabaseConfigModal(true);
            } else {
              // Production/user context - go straight to demo with banner
              console.log('🎭 Production context - starting demo mode directly');
              setShowDemoBanner(!isDemoBannerDismissed());
            }
            
            setAuthLoading(false);
            console.log('✅ Demo mode initialization completed');
          }
          return;
        }
        
        // Supabase is configured - TEST CONNECTION FIRST
        console.log('🔧 Supabase IS configured - testing connection...');
        
        // NEW: Quick connection test before proceeding
        const connectionTest = await AuthService.testQuickConnection();
        console.log('🔌 Connection test result:', connectionTest);
        
        if (!connectionTest.success && connectionTest.shouldUseDemoMode) {
          console.log('🎭 Connection test failed - switching to demo mode');
          
          if (isMounted) {
            setIsDemoMode(true);
            AuthService.forceDemoMode('Connection test failed');
            
            // Set up demo auth listener
            console.log('👂 Setting up DEMO auth listener (connection failed)...');
            authSubscription = AuthService.onAuthStateChange((user) => {
              console.log('🔄 Demo auth state changed (fallback):', user ? `User: ${user.nome}` : 'No user');
              if (isMounted) {
                setCurrentUser(user);
                if (user) {
                  setSearchAttempts(0);
                }
              }
            });
            
            setShowDemoBanner(!isDemoBannerDismissed());
            setAuthLoading(false);
            console.log('✅ Demo mode initialization completed (connection fallback)');
          }
          return;
        }
        
        // Connection test passed - proceed with real mode
        console.log('✅ Connection test passed - proceeding with real mode');
        setIsDemoMode(false);
        
        // Check for email confirmation first (before any async operations)
        const urlHash = window.location.hash;
        const isEmailConfirmation = 
          urlHash.includes('access_token=') || 
          urlHash.includes('type=signup') ||
          urlHash.includes('type=email_confirmation') ||
          urlHash.includes('action=confirmed') ||
          urlHash.includes('type=recovery');
          
        if (isEmailConfirmation) {
          console.log('📧 Detected email confirmation callback');
          if (isMounted) {
            setCurrentState("email-confirmation");
            setAuthLoading(false);
          }
          return;
        }

        // Set up REAL auth state listener ONLY if connection test passed
        console.log('👂 Setting up REAL auth state listener...');
        authSubscription = AuthService.onAuthStateChange((user) => {
          console.log('🔄 Real auth state changed:', user ? `User: ${user.nome}` : 'No user');
          if (isMounted) {
            setCurrentUser(user);
            if (user) {
              setSearchAttempts(0);
            }
          }
        });

        // Initialize real auth with monitoring for failures
        console.log('⏱️  Starting REAL auth initialization...');
        try {
          await quickTimeout(initializeRealAuth(), 2000); // Shorter timeout
          console.log('✅ Real mode initialization completed successfully');
        } catch (initError) {
          console.warn('⚠️  Real auth init failed, checking if we should switch to demo');
          
          // Check circuit breaker status after init failure
          const cbStatus = AuthService.getCircuitBreakerStatus();
          if (cbStatus.permanentDemo || cbStatus.failureCount >= 3) {
            console.log('🎭 Switching to demo mode due to init failures');
            
            if (isMounted) {
              setIsDemoMode(true);
              setShowDemoBanner(!isDemoBannerDismissed());
              
              // Replace auth subscription with demo version
              if (authSubscription?.data?.subscription) {
                authSubscription.data.subscription.unsubscribe();
              }
              
              authSubscription = AuthService.onAuthStateChange((user) => {
                console.log('🔄 Demo auth state changed (init fallback):', user ? `User: ${user.nome}` : 'No user');
                if (isMounted) {
                  setCurrentUser(user);
                  if (user) {
                    setSearchAttempts(0);
                  }
                }
              });
            }
          } else {
            throw initError; // Re-throw if not switching to demo
          }
        }
        
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Erro de inicialização';
          
          // Handle different types of errors
          if (errorMessage.includes('timed out') || errorMessage.includes('Connection')) {
            console.log('⚠️  Initialization timed out or connection failed, switching to demo mode');
            setIsDemoMode(true);
            setAuthLoading(false);
            setShowDemoBanner(!isDemoBannerDismissed());
            AuthService.forceDemoMode('App initialization timeout');
            
            // Set up demo auth listener as fallback
            authSubscription = AuthService.onAuthStateChange((user) => {
              console.log('🔄 Demo auth state changed (error fallback):', user ? `User: ${user.nome}` : 'No user');
              if (isMounted) {
                setCurrentUser(user);
                if (user) {
                  setSearchAttempts(0);
                }
              }
            });
          } else {
            setInitError(errorMessage);
            setAuthLoading(false);
          }
        }
      }
    };

    init();

    return () => {
      console.log('🧹 Cleaning up App component');
      isMounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Real auth initialization - NEVER called in demo mode
  const initializeRealAuth = async () => {
    try {
      console.log('🔑 Real auth initialization starting...');
      
      // CRITICAL: Triple check we should be doing this
      if (!supabaseConfig.isConfigured) {
        console.log('🛑 ABORT: Supabase not configured - should not be in initializeRealAuth');
        throw new Error('Should not initialize real auth without Supabase');
      }
      
      if (AuthService.isInDemoMode()) {
        console.log('🛑 ABORT: Demo mode detected - should not be in initializeRealAuth');
        throw new Error('Should not initialize real auth in demo mode');
      }
      
      // Quick database check with very short timeout
      console.log('🗄️  Quick database check...');
      try {
        const dbStatus = await quickTimeout(AuthService.getDatabaseStatus(), 1500);
        console.log('📊 Database status:', dbStatus);
        
        if (!dbStatus.isSetup && dbStatus.needsSetup) {
          console.log('⚠️  Database needs setup');
          setShowDatabaseAlert(true);
        }
      } catch (dbError) {
        console.warn('⚠️  Database check failed/timed out:', dbError);
        setShowDatabaseAlert(true);
      }
      
      // Get current user with short timeout
      console.log('👤 Getting current user...');
      try {
        const user = await quickTimeout(AuthService.getCurrentUser(), 1500);
        console.log('🎯 Current user:', user ? `User: ${user.nome}` : 'No user');
        setCurrentUser(user);
      } catch (userError) {
        console.warn('⚠️  User check failed/timed out:', userError);
        setCurrentUser(null);
      }
      
    } catch (error) {
      console.error('❌ Error in real auth initialization:', error);
      
      // Don't throw - just log and continue, but check if we should switch to demo
      if (error instanceof Error && error.message.includes('timed out')) {
        console.log('⏱️  Real auth init timed out');
        setShowDatabaseAlert(true);
      }
      
      if (error instanceof Error && (
        error.message.includes('Should not initialize') ||
        error.message.includes('demo mode') ||
        error.message.includes('not configured')
      )) {
        console.log('🎭 Switching to demo mode due to configuration issue');
        setIsDemoMode(true);
        setShowDemoBanner(!isDemoBannerDismissed());
        AuthService.forceDemoMode('Configuration issue in initializeRealAuth');
      }
    } finally {
      console.log('🏁 Real auth initialization complete');
      setAuthLoading(false);
    }
  };

  const handleStartOnboarding = () => {
    console.log('📝 Starting onboarding flow');
    setCurrentState("onboarding");
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    console.log('✅ Onboarding completed with data:', data);
    setSavingSearch(true);
    
    try {
      // Rate limiting check (only for non-demo mode)
      if (searchAttempts >= 2 && !currentUser && !isDemoMode && supabaseConfig.isConfigured) {
        console.log('🚫 Rate limit reached');
        setSearchData(data);
        setShowSecurityCheck(true);
        setSavingSearch(false);
        return;
      }

      let criteriaId: string | null = null;

      // Try to save search data - IMPROVED: Better auth check
      if (currentUser || isDemoMode || !supabaseConfig.isConfigured) {
        try {
          console.log('💾 Saving search criteria...');
          
          // Only try to save if user is properly authenticated or in demo mode
          if (isDemoMode || !supabaseConfig.isConfigured || (currentUser && currentUser.id)) {
            const searchCriteria = await quickTimeout(
              SearchService.saveSearchCriteria(currentUser?.id || 'demo-user', {
                cidadeOrigem: data.cidadeOrigem,
                paisDestino: data.paisDestino,
                cidadeDestino: data.cidadeDestino,
                escola: data.escola,
                ciaAerea: data.ciaAerea === 'nao-sei' ? null : data.ciaAerea,
                mesAno: data.mesAno
              }),
              2000 // Shorter timeout
            );
            
            criteriaId = searchCriteria.id;
            setSearchCriteriaId(criteriaId);
            console.log('✅ Search criteria saved');
          } else {
            console.log('⚠️  Skipping search save - user not properly authenticated');
          }
        } catch (error) {
          console.warn('⚠️  Search save failed, continuing anyway:', error);
          
          // Show user-friendly error if it's an auth issue
          if (error instanceof Error && (
            error.message.includes('authenticated') ||
            error.message.includes('42501') ||
            error.message.includes('row-level security')
          )) {
            // Don't block the flow, just warn
            console.log('🔄 Auth issue detected, will proceed without saving search');
          }
        }
      }

      setSearchData(data);
      setCurrentState("results");
      
      // Only increment attempts in real mode
      if (!currentUser && !isDemoMode && supabaseConfig.isConfigured) {
        setSearchAttempts(prev => prev + 1);
      }

    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setSearchData(data);
      setCurrentState("results");
    } finally {
      setSavingSearch(false);
    }
  };

  const handleSecurityCheckSuccess = async () => {
    console.log('🛡️  Security check passed');
    if (searchData) {
      setSavingSearch(true);
      
      try {
        if (currentUser && !isDemoMode && supabaseConfig.isConfigured && currentUser.id) {
          console.log('💾 Saving search criteria after security check...');
          const searchCriteria = await quickTimeout(
            SearchService.saveSearchCriteria(currentUser.id, {
              cidadeOrigem: searchData.cidadeOrigem,
              paisDestino: searchData.paisDestino,
              cidadeDestino: searchData.cidadeDestino,
              escola: searchData.escola,
              ciaAerea: searchData.ciaAerea === 'nao-sei' ? null : searchData.ciaAerea,
              mesAno: searchData.mesAno
            }),
            2000
          );
          
          setSearchCriteriaId(searchCriteria.id);
          console.log('✅ Search criteria saved after security check');
        }
      } catch (error) {
        console.warn('⚠️  Search save failed after security check:', error);
      } finally {
        setSavingSearch(false);
      }
      
      setCurrentState("results");
    }
  };

  const handleBackToHome = () => {
    console.log('🏠 Navigating back to home');
    setCurrentState("home");
    setSearchData(null);
    setSearchCriteriaId(null);
    setInitError(null);
    try {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      console.warn('⚠️  Could not clear URL hash:', error);
    }
  };

  const handleBackToOnboarding = () => {
    console.log('📝 Navigating back to onboarding');
    setCurrentState("onboarding");
  };

  const handleAuthSuccess = (userData: UserData) => {
    console.log('🎉 Authentication successful for user:', userData.nome);
    setCurrentUser(userData);
    setSearchAttempts(0);
    setShowAuthModal(false);
    
    if (searchData && !searchCriteriaId) {
      handleSaveSearchAfterAuth(userData);
    }
  };

  const handleSaveSearchAfterAuth = async (user: UserData) => {
    if (!searchData || isDemoMode || !supabaseConfig.isConfigured || !user.id) return;
    
    try {
      console.log('💾 Saving search criteria after authentication...');
      const searchCriteria = await quickTimeout(
        SearchService.saveSearchCriteria(user.id, {
          cidadeOrigem: searchData.cidadeOrigem,
          paisDestino: searchData.paisDestino,
          cidadeDestino: searchData.cidadeDestino,
          escola: searchData.escola,
          ciaAerea: searchData.ciaAerea === 'nao-sei' ? null : searchData.ciaAerea,
          mesAno: searchData.mesAno
        }),
        2000
      );
      
      setSearchCriteriaId(searchCriteria.id);
      console.log('✅ Search criteria saved after auth');
    } catch (error) {
      console.warn('⚠️  Search save failed after auth:', error);
    }
  };

  const handleAuthRequired = () => {
    console.log('🔐 Authentication required, showing auth modal');
    setShowAuthModal(true);
  };

  const handleLogoClick = () => {
    console.log('🏠 Logo clicked, going to home');
    handleBackToHome();
  };

  const handleHowItWorksClick = () => {
    console.log('❓ How it works clicked');
    setCurrentState("how-it-works");
  };

  const handleSignOut = async () => {
    try {
      console.log('👋 Signing out user...');
      // Only call signOut if not in demo mode
      if (!isDemoMode && supabaseConfig.isConfigured) {
        await quickTimeout(AuthService.signOut(), 1500);
      } else {
        // In demo mode, just clear demo data
        AuthService.clearDemoData();
      }
      setCurrentUser(null);
      setSearchCriteriaId(null);
      handleBackToHome();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.warn('⚠️  Sign out failed, resetting state anyway:', error);
      setCurrentUser(null);
      setSearchCriteriaId(null);
      handleBackToHome();
    }
  };

  const handleEmailConfirmed = () => {
    console.log('📧 Email confirmation completed');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      console.warn('⚠️  Could not clear URL hash:', error);
    }
    setCurrentState("home");
    setAuthLoading(true);
    
    // Only reinitialize if not in demo mode
    if (!isDemoMode && supabaseConfig.isConfigured) {
      quickTimeout(initializeRealAuth(), 2000).catch(error => {
        console.warn('⚠️  Auth reinit failed after email confirmation:', error);
        setAuthLoading(false);
        // Fallback to demo mode
        setIsDemoMode(true);
        setShowDemoBanner(!isDemoBannerDismissed());
        AuthService.forceDemoMode('Email confirmation reinit failed');
      });
    } else {
      setAuthLoading(false);
    }
  };

  const handleEmailConfirmationError = (error: string) => {
    console.error('❌ Email confirmation error:', error);
    setTimeout(() => {
      handleEmailConfirmed();
    }, 3000);
  };

  const handleRetryInit = () => {
    console.log('🔄 Retrying initialization...');
    setInitError(null);
    setAuthLoading(true);
    setShowDatabaseAlert(false);
    
    // Reset circuit breaker first
    AuthService.resetCircuitBreaker();
    
    // Check if we should try real mode or go to demo
    if (supabaseConfig.isConfigured && !isDemoMode) {
      quickTimeout(initializeRealAuth(), 2000).catch(error => {
        console.warn('⚠️  Retry failed:', error);
        // Switch to demo mode on retry failure
        setIsDemoMode(true);
        setAuthLoading(false);
        setShowDemoBanner(!isDemoBannerDismissed());
        AuthService.forceDemoMode('Retry initialization failed');
      });
    } else {
      // Go to demo mode
      setIsDemoMode(true);
      setAuthLoading(false);
      setShowDemoBanner(!isDemoBannerDismissed());
      AuthService.forceDemoMode('Manual retry to demo mode');
    }
  };

  const handleSupabaseConfigured = () => {
    console.log('⚙️  Supabase configured, page will reload');
    setShowSupabaseConfigModal(false);
    // Page will reload automatically
  };

  const handleSupabaseConfigSkipped = () => {
    console.log('⏭️  Supabase config skipped - entering demo mode');
    setShowSupabaseConfigModal(false);
    setIsDemoMode(true);
    setShowDemoBanner(!isDemoBannerDismissed());
    setAuthLoading(false);
    AuthService.forceDemoMode('Supabase config skipped');
    
    // Set up demo auth listener
    const authSubscription = AuthService.onAuthStateChange((user) => {
      console.log('🔄 Demo auth state changed after skip:', user ? `User: ${user.nome}` : 'No user');
      setCurrentUser(user);
      if (user) {
        setSearchAttempts(0);
      }
    });
    
    // Mark as skipped
    try {
      localStorage.setItem('supabase_config_skipped', 'true');
    } catch (error) {
      console.warn('⚠️  Could not save skip preference:', error);
    }
  };

  const handleDemoBannerDismiss = () => {
    setShowDemoBanner(false);
    try {
      localStorage.setItem('demo_banner_dismissed', 'true');
    } catch (error) {
      console.warn('⚠️  Could not save banner dismissal:', error);
    }
  };

  // NEW: Handle explicit configuration request
  const handleExplicitConfigRequest = () => {
    console.log('⚙️  Explicit configuration requested');
    
    // Reset circuit breaker to allow fresh attempt
    AuthService.resetCircuitBreaker();
    
    try {
      localStorage.setItem('supabase_config_attempted', 'true');
    } catch (error) {
      console.warn('⚠️  Could not save config attempt:', error);
    }
    setShowSupabaseConfigModal(true);
  };

  // Show Supabase configuration modal
  if (showSupabaseConfigModal) {
    return (
      <SupabaseConfigModal
        isOpen={showSupabaseConfigModal}
        onClose={handleSupabaseConfigSkipped}
        onConfigured={handleSupabaseConfigured}
      />
    );
  }

  // Show email confirmation screen
  if (currentState === "email-confirmation") {
    return (
      <EmailConfirmation 
        onConfirmed={handleEmailConfirmed}
        onError={handleEmailConfirmationError}
      />
    );
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img 
            src={edublinLogo} 
            alt="Edublin" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">
            {isDemoMode || !supabaseConfig.isConfigured 
              ? 'Carregando modo demonstração...' 
              : 'Carregando...'
            }
          </p>
          
          <div className="mt-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetryInit}
              className="text-sm"
            >
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show initialization error
  if (initError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <img 
            src={edublinLogo} 
            alt="Edublin" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="text-red-600 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Erro de inicialização
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            {initError.includes('timed out') 
              ? 'A conexão está demorando mais que o esperado.'
              : 'Houve um problema ao carregar a aplicação.'
            }
          </p>
          <div className="space-y-2">
            <Button onClick={handleRetryInit} size="sm">
              🔄 Tentar novamente
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setInitError(null);
                setIsDemoMode(true);
                setAuthLoading(false);
                setShowDemoBanner(!isDemoBannerDismissed());
                AuthService.forceDemoMode('Manual switch to demo from error');
              }}
            >
              🎭 Continuar em modo demo
            </Button>
            {isDevelopmentContext() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExplicitConfigRequest}
              >
                🔧 Configurar Supabase
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show saving state
  if (savingSearch) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img 
            src={edublinLogo} 
            alt="Edublin" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">
            {isDemoMode || !supabaseConfig.isConfigured
              ? 'Processando busca demo...' 
              : currentUser 
                ? 'Salvando sua busca...' 
                : 'Processando busca...'
            }
          </p>
        </div>
      </div>
    );
  }

  const demoStats = getDemoStats();

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onLogoClick={handleLogoClick} 
        onHowItWorksClick={handleHowItWorksClick}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onSignIn={() => setShowAuthModal(true)}
      />
      
      {/* Demo Mode Banner */}
      {showDemoBanner && (isDemoMode || !supabaseConfig.isConfigured) && (
        <DemoModeBanner
          onConfigureSupabase={handleExplicitConfigRequest}
          onDismiss={handleDemoBannerDismiss}
        />
      )}

      {/* Database Setup Alert - Only show in configured mode */}
      {showDatabaseAlert && !isDemoMode && supabaseConfig.isConfigured && (
        <section className="py-8 bg-red-50 border-b border-red-200">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <DatabaseSetupAlert />
            </div>
          </div>
        </section>
      )}
      
      {currentState === "home" && (
        <>
          <HeroSection onStartOnboarding={handleStartOnboarding} />
          
          {/* Features section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Como funciona?
                  </h2>
                  <p className="text-lg text-gray-600">
                    Em poucos passos você encontra intercambistas com o mesmo perfil
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">1. Conte sobre sua viagem</h3>
                    <p className="text-sm text-gray-600">
                      Informe destino, data de chegada e outros detalhes importantes
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">2. Encontre matches</h3>
                    <p className="text-sm text-gray-600">
                      Veja outros intercambistas com perfil similar ao seu
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">3. Conecte-se</h3>
                    <p className="text-sm text-gray-600">
                      Converse via WhatsApp e faça amizades antes da viagem
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats section - Enhanced for demo */}
          <section className="py-16 bg-gradient-to-r from-green-600 to-green-700">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center text-white">
                <h2 className="text-3xl font-bold mb-4">
                  {isDemoMode || !supabaseConfig.isConfigured ? 'Dados da Demonstração' : 'Nossa Comunidade'}
                </h2>
                <p className="text-green-100 mb-8">
                  {isDemoMode || !supabaseConfig.isConfigured
                    ? 'Explore os números simulados da nossa plataforma'
                    : 'Conectando intercambistas ao redor do mundo'
                  }
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold mb-2">{demoStats.totalUsers.toLocaleString()}</div>
                    <div className="text-green-100">Usuários {(isDemoMode || !supabaseConfig.isConfigured) && '(Demo)'}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold mb-2">{demoStats.successfulMatches}</div>
                    <div className="text-green-100">Conexões {(isDemoMode || !supabaseConfig.isConfigured) && '(Demo)'}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold mb-2">{demoStats.countriesAvailable}</div>
                    <div className="text-green-100">Países</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold mb-2">{demoStats.universitiesPartners}</div>
                    <div className="text-green-100">Universidades</div>
                  </div>
                </div>

                {(isDemoMode || !supabaseConfig.isConfigured) && (
                  <div className="mt-8 p-4 bg-blue-600/20 rounded-lg">
                    <p className="text-blue-100 text-sm">
                      🎭 <strong>Modo Demonstração:</strong> Todos os números são simulados para fins demonstrativos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Trust section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Segurança em primeiro lugar
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">Perfis Verificados</h3>
                    <p className="text-sm text-gray-600">
                      Todos os usuários passam por verificação de email e documentos para garantir autenticidade
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">Dados Protegidos</h3>
                    <p className="text-sm text-gray-600">
                      Seu WhatsApp só é compartilhado com sua autorização expressa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User Stats Section - Enhanced for demo */}
          {currentUser && (
            <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <h2 className="text-2xl font-bold mb-4">
                    Bem-vindo de volta, {currentUser.nome}!
                    {(isDemoMode || !supabaseConfig.isConfigured) && <span className="text-blue-200 text-sm ml-2">(Demo)</span>}
                  </h2>
                  <p className="text-blue-100 mb-6">
                    Continue explorando e conectando-se com outros intercambistas
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold">
                        {currentUser.verificado ? '✅' : '⏳'}
                      </div>
                      <div className="text-sm text-blue-100">
                        {currentUser.verificado ? 'Verificado' : 'Pendente'}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold">
                        {currentUser.premium ? '👑' : '🆓'}
                      </div>
                      <div className="text-sm text-blue-100">
                        {currentUser.premium ? 'Premium' : 'Gratuito'}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold">
                        {Math.max(0, 5 - (currentUser.relatos || 0))}
                      </div>
                      <div className="text-sm text-blue-100">
                        Contatos restantes
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-700 hover:bg-gray-100"
                    onClick={handleStartOnboarding}
                  >
                    Nova Busca
                  </Button>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {currentState === "how-it-works" && (
        <HowItWorks 
          onStartOnboarding={handleStartOnboarding}
          onBack={handleBackToHome}
        />
      )}

      {currentState === "onboarding" && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onBack={handleBackToHome}
        />
      )}

      {currentState === "results" && searchData && (
        <SearchResults 
          searchData={searchData} 
          searchCriteriaId={searchCriteriaId}
          currentUser={currentUser}
          onBack={handleBackToOnboarding}
          onAuthRequired={handleAuthRequired}
        />
      )}
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
                  <img 
                    src={edublinLogo} 
                    alt="Edublin" 
                    className="h-6 w-auto brightness-0 invert"
                  />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Sobre</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Termos</a>
                <a href="#" className="hover:text-white transition-colors">Contato</a>
                {/* IMPROVED: Only show config for development or explicit contexts */}
                {(isDemoMode || !supabaseConfig.isConfigured) && (isDevelopmentContext() || hasExplicitConfigIntent()) && (
                  <button 
                    onClick={handleExplicitConfigRequest}
                    className="hover:text-white transition-colors"
                  >
                    ⚙️ Configurar
                  </button>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 Edublin. Conectando intercambistas de forma segura.</p>
              <p className="mt-2">
                🔐 Protegido por Supabase • 🛡️ Dados criptografados • 🌟 Open Source
              </p>
              {(isDemoMode || !supabaseConfig.isConfigured) && (
                <p className="mt-2 text-blue-400">
                  🎭 Funcionando em modo demonstração
                  {isDevelopmentContext() && (
                    <button 
                      onClick={handleExplicitConfigRequest}
                      className="ml-2 underline hover:text-blue-300"
                    >
                      - Configure o Supabase para dados reais
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <SecurityCheck
        isOpen={showSecurityCheck}
        onClose={() => setShowSecurityCheck(false)}
        onSuccess={handleSecurityCheckSuccess}
        reason="Para continuar buscando, confirme que você não é um robô."
      />

      <SupabaseConfigModal
        isOpen={showSupabaseConfigModal}
        onClose={handleSupabaseConfigSkipped}
        onConfigured={handleSupabaseConfigured}
      />

      {/* Debug Panel - Only in development */}
      <DebugPanel />
    </div>
  );
}