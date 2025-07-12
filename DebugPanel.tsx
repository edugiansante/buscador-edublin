import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { AuthService } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, Database, User, Settings, Bug, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface DebugInfo {
  environment: any;
  authState: any;
  dbConnection: any;
  userProfile: any;
  lastError: any;
}

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: null,
    authState: null,
    dbConnection: null,
    userProfile: null,
    lastError: null
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: DebugInfo = {
      environment: null,
      authState: null,
      dbConnection: null,
      userProfile: null,
      lastError: null
    };

    try {
      // Test environment
      info.environment = AuthService.getEnvironmentInfo();

      // Test auth state
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        info.authState = {
          hasUser: !!user,
          userId: user?.id,
          email: user?.email,
          emailConfirmed: !!user?.email_confirmed_at,
          error: error ? {
            message: error.message,
            name: error.name
          } : null
        };
      } catch (authError: any) {
        info.authState = { error: authError.message };
      }

      // Test database connection and setup
      try {
        const result = await AuthService.testConnection();
        info.dbConnection = result;
      } catch (dbError: any) {
        info.dbConnection = { 
          isSetup: false, 
          error: dbError.message, 
          needsSetup: false,
          details: dbError
        };
      }

      // Test user profile
      try {
        const currentUser = await AuthService.getCurrentUser();
        info.userProfile = {
          hasProfile: !!currentUser,
          nome: currentUser?.nome,
          verificado: currentUser?.verificado,
          created: currentUser?.created_at,
          isMinimal: !info.dbConnection?.isSetup && !!currentUser
        };
      } catch (profileError: any) {
        info.userProfile = { error: profileError.message };
      }

    } catch (error: any) {
      info.lastError = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <Bug className="h-4 w-4 text-gray-400" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (success: boolean | undefined) => {
    if (success === undefined) return "bg-gray-100 text-gray-800";
    return success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getDatabaseStatusIcon = (dbInfo: any) => {
    if (!dbInfo) return <Bug className="h-4 w-4 text-gray-400" />;
    if (dbInfo.isSetup) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (dbInfo.needsSetup) return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const getDatabaseStatusText = (dbInfo: any) => {
    if (!dbInfo) return "Unknown";
    if (dbInfo.isSetup) return "Configured";
    if (dbInfo.needsSetup) return "Needs Setup";
    return "Connection Error";
  };

  const getDatabaseStatusColor = (dbInfo: any) => {
    if (!dbInfo) return "bg-gray-100 text-gray-800";
    if (dbInfo.isSetup) return "bg-green-100 text-green-800";
    if (dbInfo.needsSetup) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  // Only show in development
  if (debugInfo.environment?.isProduction !== false && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card className="w-96 max-h-[80vh] overflow-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Panel
                </CardTitle>
                <Button size="sm" onClick={runDiagnostics} disabled={loading}>
                  {loading ? 'Testing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Environment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Environment</span>
                  {getStatusIcon(true)}
                </div>
                {debugInfo.environment && (
                  <div className="pl-6 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base URL:</span>
                      <span className="font-mono text-xs truncate max-w-32" title={debugInfo.environment.baseUrl}>
                        {debugInfo.environment.baseUrl}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Production:</span>
                      <Badge variant={debugInfo.environment.isProduction ? "default" : "secondary"}>
                        {debugInfo.environment.isProduction ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Database Connection & Setup */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Database</span>
                  {getDatabaseStatusIcon(debugInfo.dbConnection)}
                </div>
                {debugInfo.dbConnection && (
                  <div className="pl-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge className={getDatabaseStatusColor(debugInfo.dbConnection)}>
                        {getDatabaseStatusText(debugInfo.dbConnection)}
                      </Badge>
                    </div>
                    
                    {debugInfo.dbConnection.needsSetup && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800 text-xs">
                          ⚠️ Tables not created! Run the SQL setup script in Supabase.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {debugInfo.dbConnection.error && !debugInfo.dbConnection.needsSetup && (
                      <div className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                        Error: {debugInfo.dbConnection.error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Auth State */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Authentication</span>
                  {getStatusIcon(debugInfo.authState?.hasUser)}
                </div>
                {debugInfo.authState && (
                  <div className="pl-6 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>User:</span>
                      <Badge className={getStatusColor(debugInfo.authState.hasUser)}>
                        {debugInfo.authState.hasUser ? "Logged In" : "Not Logged In"}
                      </Badge>
                    </div>
                    {debugInfo.authState.hasUser && (
                      <>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-mono text-xs truncate max-w-32" title={debugInfo.authState.email}>
                            {debugInfo.authState.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confirmed:</span>
                          <Badge className={getStatusColor(debugInfo.authState.emailConfirmed)}>
                            {debugInfo.authState.emailConfirmed ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </>
                    )}
                    {debugInfo.authState.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800 text-xs">
                          {debugInfo.authState.error.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Profile</span>
                  {getStatusIcon(debugInfo.userProfile?.hasProfile)}
                </div>
                {debugInfo.userProfile && (
                  <div className="pl-6 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Profile:</span>
                      <Badge className={getStatusColor(debugInfo.userProfile.hasProfile)}>
                        {debugInfo.userProfile.hasProfile ? "Exists" : "Missing"}
                      </Badge>
                    </div>
                    {debugInfo.userProfile.hasProfile && (
                      <>
                        <div className="flex justify-between">
                          <span>Nome:</span>
                          <span className="font-mono text-xs truncate max-w-24" title={debugInfo.userProfile.nome}>
                            {debugInfo.userProfile.nome}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified:</span>
                          <Badge className={getStatusColor(debugInfo.userProfile.verificado)}>
                            {debugInfo.userProfile.verificado ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {debugInfo.userProfile.isMinimal && (
                          <div className="text-xs text-yellow-600 bg-yellow-50 p-1 rounded">
                            ⚠️ Minimal profile (DB not setup)
                          </div>
                        )}
                      </>
                    )}
                    {debugInfo.userProfile.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800 text-xs">
                          {debugInfo.userProfile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Last Error */}
              {debugInfo.lastError && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Last Error</span>
                  </div>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 text-xs font-mono">
                      {debugInfo.lastError.message}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Action Items */}
              {debugInfo.dbConnection?.needsSetup && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800 text-xs">
                    🔧 <strong>Action needed:</strong> Run SQL setup in Supabase Dashboard to create tables.
                  </AlertDescription>
                </Alert>
              )}

              {/* Console Logs Reminder */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-xs">
                  💡 Check browser console (F12) for detailed logs and error messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}