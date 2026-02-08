import { Shield, Database, Cpu, Activity, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SSOT_DATA } from '@/data/ssot';

const AdminPanel = () => {
  // Mock system status
  const systemStatus = [
    { name: 'SSOT Engine', status: 'operational', latency: '12ms' },
    { name: 'Supabase', status: 'operational', latency: '45ms' },
    { name: 'AI Gateway', status: 'operational', latency: '230ms' },
    { name: 'Logic Gates', status: 'operational', latency: '8ms' },
  ];

  // Get dimensions from live SSOT_DATA
  const ssotDimensions = SSOT_DATA.rubrics.map(rubric => ({
    code: rubric.bands[0]?.band_id?.replace(/\d+/g, '') || rubric.rubric_id.toUpperCase().slice(0, 2),
    name: rubric.name,
    description: rubric.bands.map(b => b.label).join(' → '),
    bandCount: rubric.bands.length,
    bands: rubric.bands
  }));

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
