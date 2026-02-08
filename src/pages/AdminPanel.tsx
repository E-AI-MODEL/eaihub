import { Shield, Database, Cpu, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminPanel = () => {
  // Mock system status
  const systemStatus = [
    { name: 'SSOT Engine', status: 'operational', latency: '12ms' },
    { name: 'Supabase', status: 'operational', latency: '45ms' },
    { name: 'AI Gateway', status: 'operational', latency: '230ms' },
    { name: 'Logic Gates', status: 'operational', latency: '8ms' },
  ];

  // Mock SSOT dimensions
  const ssotDimensions = [
    { code: 'K', name: 'Knowledge', description: 'Kennisstand en begrip' },
    { code: 'C', name: 'Cognitive Load', description: 'Mentale belasting' },
    { code: 'P', name: 'Precision', description: 'Nauwkeurigheid van input' },
    { code: 'TD', name: 'Task Difficulty', description: 'Moeilijkheidsgraad' },
    { code: 'V', name: 'Verification', description: 'Verificatie status' },
    { code: 'E', name: 'Engagement', description: 'Betrokkenheid' },
    { code: 'T', name: 'Time', description: 'Tijdsfactor' },
    { code: 'S', name: 'Scaffolding', description: 'Ondersteuningsniveau' },
    { code: 'L', name: 'Learning Style', description: 'Leerstijl' },
    { code: 'B', name: 'Behavior', description: 'Gedragspatronen' },
  ];

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Systeembeheer & SSOT Browser</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-xs font-mono text-green-500">Admin Access</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
            <TabsTrigger value="ssot">SSOT Browser</TabsTrigger>
            <TabsTrigger value="developer">Developer Tools</TabsTrigger>
          </TabsList>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemStatus.map((service) => (
                      <div 
                        key={service.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          {service.status === 'operational' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-foreground">{service.name}</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{service.latency}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    Runtime Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-foreground">847</p>
                      <p className="text-xs text-muted-foreground">Sessions Today</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-foreground">12.4k</p>
                      <p className="text-xs text-muted-foreground">API Calls</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-foreground">99.7%</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">Gate Breaches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SSOT Browser Tab */}
          <TabsContent value="ssot">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  10D Matrix - Dimensies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ssotDimensions.map((dim) => (
                    <div 
                      key={dim.code}
                      className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {dim.code}
                        </span>
                        <span className="text-sm font-medium text-foreground">{dim.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Developer Tools Tab */}
          <TabsContent value="developer">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">Tech Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-secondary/30 border border-border">
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`{
  "kernel_version": "15.0",
  "ssot_integrity": "VALID",
  "logic_gates_active": true,
  "hybrid_persistence": "SUPABASE_PRIMARY",
  "active_themes": ["DEFAULT", "DEVIL", "META", "CREATIVE", "COACH", "SYSTEM", "PRAGMATIC"],
  "knowledge_levels": ["K1", "K2", "K3"],
  "dimensions": 10,
  "commands_available": 40
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
