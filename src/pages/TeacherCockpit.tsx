import { Users, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TeacherCockpit = () => {
  // Mock data for students
  const mockStudents = [
    { id: 1, name: 'Anna de Vries', subject: 'Biologie', status: 'active', knowledgeLevel: 'K2', agency: 0.81 },
    { id: 2, name: 'Bas Jansen', subject: 'Wiskunde', status: 'stuck', knowledgeLevel: 'K1', agency: 0.45 },
    { id: 3, name: 'Carmen Lopez', subject: 'Economie', status: 'active', knowledgeLevel: 'K3', agency: 0.92 },
    { id: 4, name: 'David Smit', subject: 'Biologie', status: 'idle', knowledgeLevel: 'K2', agency: 0.67 },
  ];

  // Mock pending approvals
  const pendingApprovals = [
    { id: 1, student: 'Bas Jansen', type: 'Summatief', question: 'Berekening van de afgeleide...' },
    { id: 2, student: 'Anna de Vries', type: 'Summatief', question: 'DNA replicatie proces...' },
  ];

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Cockpit</h1>
            <p className="text-sm text-muted-foreground">Live overzicht van je klas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-green-500">4 Online</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actieve Sessies</p>
                  <p className="text-3xl font-bold text-foreground">4</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gem. Agency</p>
                  <p className="text-3xl font-bold text-foreground">0.71</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wachtend</p>
                  <p className="text-3xl font-bold text-foreground">2</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vastgelopen</p>
                  <p className="text-3xl font-bold text-destructive">1</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">Actieve Leerlingen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStudents.map((student) => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          student.status === 'active' ? 'bg-green-500' :
                          student.status === 'stuck' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-primary">{student.knowledgeLevel}</span>
                        <span className="text-xs text-muted-foreground">Agency: {student.agency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Approval Queue */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Human Gate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div 
                      key={approval.id}
                      className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{approval.student}</span>
                        <span className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold">
                          {approval.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {approval.question}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-green-500 border-green-500/50 hover:bg-green-500/10">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-500 border-red-500/50 hover:bg-red-500/10">
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCockpit;
