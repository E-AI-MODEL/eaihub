import { useState, useEffect } from 'react';
import { Shield, Database, Cpu, Activity, CheckCircle, AlertTriangle, BookOpen, Trash2, Download, RefreshCw, HardDrive, Zap, Terminal, Eye, XCircle, MessageSquare, Users, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SSOT_DATA } from '@/data/ssot';
import { 
  runSystemAudit, 
  getStorageInspectorData, 
  deleteStorageItem, 
  performAdminAction,
  type SystemHealth,
  type StorageItem
} from '@/services/adminService';
import {
  fetchAllSessionsAdmin, deleteSession, deleteAllSessions, deleteOfflineSessions,
  fetchChatMessages, deleteChatMessage, deleteAllChatMessages,
  deleteTeacherMessage,
} from '@/services/adminDbService';
import { toast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [selectedStorageItem, setSelectedStorageItem] = useState<StorageItem | null>(null);
  // Database tab state
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [dbFilter, setDbFilter] = useState('');
  const [dbLoading, setDbLoading] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Load system data on mount
  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const [health, storage] = await Promise.all([
        runSystemAudit(),
        Promise.resolve(getStorageInspectorData())
      ]);
      setSystemHealth(health);
      setStorageItems(storage);
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast({
        title: 'Fout bij laden',
        description: 'Kon systeemdata niet ophalen.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAction = async (action: 'CLEAR_CACHE' | 'EXPORT_LOGS' | 'RESET_IDENTITY' | 'FIX_CORRUPTION') => {
    setIsRunningAction(true);
    try {
      const result = await performAdminAction(action);
      toast({
        title: result.success ? 'Actie voltooid' : 'Actie mislukt',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      // Reload data after action
      await loadSystemData();
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Actie kon niet worden uitgevoerd.',
        variant: 'destructive'
      });
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleDeleteStorageItem = (key: string) => {
    deleteStorageItem(key);
    setStorageItems(prev => prev.filter(item => item.key !== key));
    setSelectedStorageItem(null);
    toast({
      title: 'Verwijderd',
      description: `Key "${key}" verwijderd uit localStorage.`
    });
  };

  // Database tab loaders
  const loadDbData = async () => {
    setDbLoading(true);
    try {
      const [sessions, messages] = await Promise.all([
        fetchAllSessionsAdmin(),
        fetchChatMessages(dbFilter || undefined),
      ]);
      setDbSessions(sessions);
      setDbMessages(messages);
    } catch (e) {
      console.error('DB load error:', e);
    } finally {
      setDbLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast({ title: 'Sessie verwijderd', description: `Sessie ${sessionId.slice(0, 8)}... en bijbehorende berichten verwijderd.` });
      loadDbData();
    } catch { toast({ title: 'Fout', variant: 'destructive' }); }
  };

  const handleBulkAction = async (action: 'all' | 'offline' | 'messages') => {
    setIsRunningAction(true);
    try {
      if (action === 'all') await deleteAllSessions();
      else if (action === 'offline') await deleteOfflineSessions();
      else if (action === 'messages') await deleteAllChatMessages();
      toast({ title: 'Voltooid', description: `${action} verwijderd.` });
      loadDbData();
    } catch { toast({ title: 'Fout', variant: 'destructive' }); }
    finally { setIsRunningAction(false); }
  };


  const ssotDimensions = SSOT_DATA.rubrics.map(rubric => ({
    code: rubric.bands[0]?.band_id?.replace(/\d+/g, '') || rubric.rubric_id.toUpperCase().slice(0, 2),
    name: rubric.name,
    description: rubric.bands.map(b => b.label).join(' → '),
    bandCount: rubric.bands.length,
    bands: rubric.bands
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'text-green-500';
      case 'COMPROMISED': return 'text-red-500';
      case 'OK': return 'text-green-500';
      case 'WARNING': return 'text-yellow-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStorageTypeColor = (type: StorageItem['type']) => {
    switch (type) {
      case 'PROFILE': return 'bg-blue-500/20 text-blue-400';
      case 'MASTERY': return 'bg-green-500/20 text-green-400';
      case 'SESSION': return 'bg-purple-500/20 text-purple-400';
      case 'SYSTEM': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Systeembeheer, Diagnostics & SSOT Browser</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSystemData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-xs font-mono text-green-500 hidden sm:inline">Admin Access</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-secondary border border-border w-full overflow-x-auto flex justify-start">
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm whitespace-nowrap"><span className="hidden sm:inline">System </span>Health</TabsTrigger>
            <TabsTrigger value="database" onClick={loadDbData} className="text-xs sm:text-sm whitespace-nowrap">Database</TabsTrigger>
            <TabsTrigger value="pipeline" onClick={loadDbData} className="text-xs sm:text-sm whitespace-nowrap">Pipeline</TabsTrigger>
            <TabsTrigger value="storage" className="text-xs sm:text-sm whitespace-nowrap">Storage<span className="hidden sm:inline"> Inspector</span></TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm whitespace-nowrap"><span className="hidden sm:inline">Admin </span>Actions</TabsTrigger>
            <TabsTrigger value="ssot" className="text-xs sm:text-sm whitespace-nowrap">SSOT<span className="hidden sm:inline"> Browser</span></TabsTrigger>
          </TabsList>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Integrity Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      System Integrity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <span className={`text-5xl font-bold ${
                        systemHealth.integrityScore >= 80 ? 'text-green-500' :
                        systemHealth.integrityScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {systemHealth.integrityScore}%
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">Integrity Score</p>
                    </div>
                    <Progress 
                      value={systemHealth.integrityScore} 
                      className="h-2 mb-4"
                    />
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeRubrics}</p>
                        <p className="text-[10px] text-muted-foreground">Rubrics</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeCommands}</p>
                        <p className="text-[10px] text-muted-foreground">Commands</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeGates}</p>
                        <p className="text-[10px] text-muted-foreground">Logic Gates</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.curriculumNodes}</p>
                        <p className="text-[10px] text-muted-foreground">Curriculum Nodes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Runtime Telemetry */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      Runtime Telemetry
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Logic Engine</span>
                        </div>
                        <span className={`text-xs font-mono ${getStatusColor(systemHealth.telemetry.logicEngineStatus)}`}>
                          {systemHealth.telemetry.logicEngineStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Terminal className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Gateway bereikbaar</span>
                        </div>
                        <span className={`text-xs font-mono ${systemHealth.telemetry.edgeFunctionReachable ? 'text-green-500' : 'text-yellow-500'}`}>
                          {systemHealth.telemetry.edgeFunctionReachable ? 'REACHABLE' : 'UNREACHABLE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Fallback Mode</span>
                        </div>
                        <span className={`text-xs font-mono ${systemHealth.telemetry.isFallbackActive ? 'text-yellow-500' : 'text-green-500'}`}>
                          {systemHealth.telemetry.isFallbackActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Last Self-Test</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(systemHealth.telemetry.lastSelfTest).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Browser Environment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Browser Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform</span>
                        <span className="text-foreground">{systemHealth.browser.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Screen</span>
                        <span className="text-foreground">{systemHealth.browser.screen}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connection</span>
                        <span className="text-foreground">{systemHealth.browser.connection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Memory</span>
                        <span className="text-foreground">{systemHealth.browser.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU Cores</span>
                        <span className="text-foreground">{systemHealth.browser.hardwareConcurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cookies</span>
                        <span className={systemHealth.browser.cookiesEnabled ? 'text-green-500' : 'text-red-500'}>
                          {systemHealth.browser.cookiesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      System Issues ({systemHealth.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemHealth.issues.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Geen problemen gedetecteerd</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {systemHealth.issues.map((issue, idx) => (
                          <div 
                            key={idx}
                            className={`p-2 rounded text-xs ${
                              issue.includes('CRITICAL') 
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                            }`}
                          >
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    Database Beheer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Button variant="outline" size="sm" onClick={loadDbData} disabled={dbLoading}>
                      <RefreshCw className={`w-3 h-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} /> Vernieuw
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBulkAction('all')} disabled={isRunningAction}>
                      <Trash2 className="w-3 h-3 mr-1" /> Wis alle sessies
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/50 text-destructive" onClick={() => handleBulkAction('offline')} disabled={isRunningAction}>
                      <Trash2 className="w-3 h-3 mr-1" /> Wis offline sessies
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/50 text-destructive" onClick={() => handleBulkAction('messages')} disabled={isRunningAction}>
                      <MessageSquare className="w-3 h-3 mr-1" /> Wis alle chatberichten
                    </Button>
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Sessies ({dbSessions.length})
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded mb-6">
                    <table className="w-full text-[10px]">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Naam</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Vak</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Status</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Berichten</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Laatst actief</th>
                          <th className="px-2 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbSessions.map((s: any) => (
                          <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                            <td className="px-2 py-1.5 text-foreground">{s.name || 'Anoniem'}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{s.subject || '—'} {s.level || ''}</td>
                            <td className="px-2 py-1.5">
                              <Badge className={`text-[8px] ${s.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>{s.status}</Badge>
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">{s.messages_count}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">
                              {s.last_active_at ? new Date(s.last_active_at).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                            </td>
                            <td className="px-2 py-1.5">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDeleteSession(s.session_id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {dbSessions.length === 0 && (
                          <tr><td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">Geen sessies</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Chatberichten ({dbMessages.length})
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded">
                     <table className="w-full text-[10px]">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Rol</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Inhoud</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Phase</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">TD</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">K</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">gF</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Epist.</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Rep.</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Tijd</th>
                          <th className="px-2 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbMessages.slice(0, 100).map((m: any) => {
                          const analysis = m.analysis as any;
                          const mechanical = m.mechanical as any;
                          const phase = analysis?.process_phases?.[0] ?? null;
                          const td = analysis?.task_densities?.[0] ?? null;
                          const kLevel = analysis?.coregulation_bands?.find((b: string) => b?.startsWith('K')) ?? null;
                          const gFactor = mechanical?.semanticValidation?.gFactor ?? null;
                          const epistemic = analysis?.epistemic_status ?? null;
                          const repairs = mechanical?.repairAttempts ?? null;
                          const isExpanded = expandedMessageId === m.id;
                          return (
                            <tr key={m.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer" onClick={() => setExpandedMessageId(isExpanded ? null : m.id)}>
                              <td className="px-2 py-1.5">
                                <Badge className={`text-[8px] ${m.role === 'user' ? 'bg-blue-500/20 text-blue-400' : m.role === 'model' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{m.role}</Badge>
                              </td>
                              <td className="px-2 py-1.5 text-foreground max-w-[200px] truncate">{m.content}</td>
                              <td className="px-2 py-1.5">{phase ? <Badge variant="outline" className="text-[8px]">{phase}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{td ? <Badge variant="outline" className="text-[8px]">{td}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{kLevel ? <Badge variant="outline" className="text-[8px]">{kLevel}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{gFactor !== null ? <span className={`text-[9px] font-mono ${gFactor >= 0.8 ? 'text-green-500' : gFactor >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>{(gFactor * 100).toFixed(0)}%</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{epistemic ? <Badge variant="outline" className="text-[8px]">{epistemic}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{repairs !== null && repairs > 0 ? <Badge className="text-[8px] bg-yellow-500/20 text-yellow-400">{repairs}</Badge> : <span className="text-muted-foreground">0</span>}</td>
                              <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                                {new Date(m.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-2 py-1.5 flex items-center gap-1">
                                {(analysis || mechanical) && (isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />)}
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive" onClick={async (e) => { e.stopPropagation(); await deleteChatMessage(m.id); loadDbData(); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Expanded JSON preview row */}
                        {dbMessages.slice(0, 100).map((m: any) => expandedMessageId === m.id && (m.analysis || m.mechanical) ? (
                          <tr key={`${m.id}-expand`} className="border-t border-border bg-secondary/20">
                            <td colSpan={10} className="px-2 py-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {m.analysis && (
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground mb-1">Analysis</p>
                                    <pre className="text-[9px] font-mono text-muted-foreground bg-background p-2 rounded max-h-40 overflow-auto">{JSON.stringify(m.analysis, null, 2)}</pre>
                                  </div>
                                )}
                                {m.mechanical && (
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground mb-1">Mechanical</p>
                                    <pre className="text-[9px] font-mono text-muted-foreground bg-background p-2 rounded max-h-40 overflow-auto">{JSON.stringify(m.mechanical, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null)}
                        {dbMessages.length === 0 && (
                          <tr><td colSpan={10} className="px-2 py-4 text-center text-muted-foreground">Geen berichten</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Storage Inspector Tab */}
          <TabsContent value="storage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Storage Stats */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary" />
                    Storage Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systemHealth && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Quota Usage</span>
                          <span className="text-foreground">{systemHealth.storage.quotaEstimate.toFixed(2)}%</span>
                        </div>
                        <Progress value={systemHealth.storage.quotaEstimate} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.keyCount}</p>
                          <p className="text-[10px] text-muted-foreground">Total Keys</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{(systemHealth.storage.usedBytes / 1024).toFixed(1)}KB</p>
                          <p className="text-[10px] text-muted-foreground">Used Space</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.profilesFound}</p>
                          <p className="text-[10px] text-muted-foreground">Profiles</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.sessionsFound}</p>
                          <p className="text-[10px] text-muted-foreground">Sessions</p>
                        </div>
                      </div>
                      {systemHealth.storage.corruptKeys.length > 0 && (
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                          <p className="text-xs text-red-400">
                            {systemHealth.storage.corruptKeys.length} corrupt keys detected
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Storage Items */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    LocalStorage Items ({storageItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {storageItems.map((item) => (
                      <div 
                        key={item.key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStorageItem?.key === item.key 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-secondary/30 hover:bg-secondary/50'
                        } ${item.isCorrupt ? 'border-red-500/50' : ''}`}
                        onClick={() => setSelectedStorageItem(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`text-[9px] ${getStorageTypeColor(item.type)}`}>
                              {item.type}
                            </Badge>
                            <span className="text-xs font-mono text-foreground truncate">{item.key}</span>
                            {item.isCorrupt && (
                              <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground">{item.size}b</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStorageItem(item.key);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {selectedStorageItem?.key === item.key && (
                          <pre className="mt-2 p-2 rounded bg-background text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-32">
                            {JSON.stringify(item.value, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {storageItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">LocalStorage is leeg</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Actions Tab */}
          <TabsContent value="actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    Destructive Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={() => handleAdminAction('CLEAR_CACHE')}
                    disabled={isRunningAction}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cache
                    <span className="ml-auto text-xs opacity-70">Wist alle localStorage</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => handleAdminAction('RESET_IDENTITY')}
                    disabled={isRunningAction}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Identity
                    <span className="ml-auto text-xs opacity-70">Nieuwe gebruiker-ID</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => handleAdminAction('FIX_CORRUPTION')}
                    disabled={isRunningAction}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fix Corruption
                    <span className="ml-auto text-xs opacity-70">Verwijdert corrupte keys</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    Export & Debug
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAdminAction('EXPORT_LOGS')}
                    disabled={isRunningAction}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Audit Log
                    <span className="ml-auto text-xs opacity-70">JSON download</span>
                  </Button>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-2">SSOT Version</h4>
                    <p className="text-sm font-mono text-primary">{systemHealth?.version || 'Loading...'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-2">Study Load</h4>
                    <p className="text-sm font-mono text-muted-foreground">
                      {systemHealth?.totalStudyTime || 0} minuten ({((systemHealth?.totalStudyTime || 0) / 60).toFixed(1)} uur)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SSOT Browser Tab */}
          <TabsContent value="ssot">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    10D Matrix - Rubrics (v{SSOT_DATA.version})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ssotDimensions.map((dim) => (
                      <div 
                        key={dim.code}
                        className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-10 h-10 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            {dim.code}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground block">{dim.name}</span>
                            <span className="text-[10px] text-muted-foreground">{dim.bandCount} bands</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{dim.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {dim.bands.map((band) => (
                            <span 
                              key={band.band_id} 
                              className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono"
                              title={band.description}
                            >
                              {band.band_id}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Commands Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Command Library ({Object.keys(SSOT_DATA.command_library.commands).length} commands)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(SSOT_DATA.command_library.commands).map(([cmd, desc]) => (
                      <div 
                        key={cmd}
                        className="p-2 rounded bg-secondary/30 border border-border"
                      >
                        <code className="text-xs text-primary font-mono">{cmd}</code>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Logic Gates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    Logic Gates ({SSOT_DATA.interaction_protocol.logic_gates.length} rules)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SSOT_DATA.interaction_protocol.logic_gates.map((gate, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded border ${
                          gate.priority === 'CRITICAL' ? 'border-destructive/50 bg-destructive/5' :
                          gate.priority === 'HIGH' ? 'border-orange-500/50 bg-orange-500/5' :
                          'border-border bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <code className="text-xs font-mono text-foreground">{gate.trigger_band}</code>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            gate.priority === 'CRITICAL' ? 'bg-destructive/20 text-destructive' :
                            gate.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {gate.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{gate.condition}</p>
                        <p className="text-[10px] text-primary mt-1">{gate.enforcement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
