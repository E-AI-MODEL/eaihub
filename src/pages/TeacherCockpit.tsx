import { useState, useEffect } from 'react';
import { Users, Activity, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, AnalyticsSnapshot, StudentSession } from '@/services/analyticsService';
import { Skeleton } from '@/components/ui/skeleton';

const TeacherCockpit = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derive pending approvals from students with alerts or STRUGGLE sentiment
  const pendingApprovals = analytics?.students.filter(
    s => s.alerts.length > 0 || s.lastAnalysis.sentiment === 'STRUGGLE'
  ) || [];

  const getStatusColor = (status: StudentSession['status']) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'IDLE': return 'bg-yellow-500';
      case 'WAITING': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getSentimentColor = (sentiment: StudentSession['lastAnalysis']['sentiment']) => {
    switch (sentiment) {
      case 'FLOW': return 'text-green-500';
      case 'STRUGGLE': return 'text-red-500';
      case 'BORED': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-green-500">
                {analytics?.activeStudents || 0} Online
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Laatste update: {lastRefresh.toLocaleTimeString('nl-NL')}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actieve Sessies</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{analytics?.activeStudents || 0}</p>
                  )}
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gem. Mastery</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{analytics?.avgMastery || 0}%</p>
                  )}
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
                  {isLoading ? (
                    <Skeleton className="h-9 w-12 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{pendingApprovals.length}</p>
                  )}
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interventie Nodig</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-destructive">{analytics?.interventionNeeded || 0}</p>
                  )}
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
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))
                  ) : analytics?.students.map((student) => (
                    <div 
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-secondary/50 border transition-colors cursor-pointer ${
                        student.isRealUser 
                          ? 'border-primary/50 hover:border-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(student.status)}`} />
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {student.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {student.name}
                            {student.isRealUser && (
                              <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.currentModule}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-mono text-primary">{student.lastAnalysis.kLevel}</span>
                          <p className="text-[10px] text-muted-foreground">
                            Agency: TD{student.lastAnalysis.agency.replace('TD', '')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-medium ${getSentimentColor(student.lastAnalysis.sentiment)}`}>
                            {student.lastAnalysis.sentiment}
                          </span>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{student.progress}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Human Gate / Approval Queue */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Human Gate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))
                  ) : pendingApprovals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">Geen interventies nodig</p>
                    </div>
                  ) : (
                    pendingApprovals.map((student) => (
                      <div 
                        key={student.id}
                        className={`p-3 rounded-lg border ${
                          student.lastAnalysis.sentiment === 'STRUGGLE'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{student.name}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold ${
                            student.lastAnalysis.sentiment === 'STRUGGLE' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {student.lastAnalysis.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {student.lastAnalysis.summary}
                        </p>
                        {student.alerts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {student.alerts.map((alert, i) => (
                              <span 
                                key={i}
                                className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded"
                              >
                                {alert}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-green-500 border-green-500/50 hover:bg-green-500/10">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Intervene
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-muted-foreground border-border hover:bg-muted">
                            <XCircle className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
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
