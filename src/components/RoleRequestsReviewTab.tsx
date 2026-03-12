import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface RoleRequestRow {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  school_id: string | null;
}

const RoleRequestsReviewTab = () => {
  const { user, isSuperUser, roles } = useAuth();
  const isAdmin = roles.includes('ADMIN');
  const [requests, setRequests] = useState<(RoleRequestRow & { profile?: ProfileRow })[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);

  // Resolve admin's school for frontend filtering
  useEffect(() => {
    if (!user || isSuperUser) return;
    supabase.from('profiles').select('school_id').eq('id', user.id).maybeSingle()
      .then(({ data }) => setAdminSchoolId(data?.school_id ?? null));
  }, [user, isSuperUser]);

  const fetchRequests = async () => {
    setLoading(true);
    // Fetch requests — RLS handles visibility (admin sees DOCENT only, superuser sees all)
    const { data: reqData } = await supabase
      .from('role_requests')
      .select('*')
      .order('created_at', { ascending: false });

    const rows = (reqData as RoleRequestRow[]) || [];

    // Enrich with profile data
    const userIds = [...new Set(rows.map(r => r.user_id))];
    let profiles: ProfileRow[] = [];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, email, name, school_id')
        .in('id', userIds);
      profiles = (pData as ProfileRow[]) || [];
    }

    const enriched = rows.map(r => ({
      ...r,
      profile: profiles.find(p => p.id === r.user_id),
    }));

    // Frontend school filter for non-superuser admins
    const filtered = isSuperUser
      ? enriched
      : enriched.filter(r => !adminSchoolId || r.profile?.school_id === adminSchoolId);

    setRequests(filtered);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [adminSchoolId, isSuperUser]);

  const handleReview = async (req: RoleRequestRow, approve: boolean) => {
    if (!user) return;
    setActing(req.id);

    try {
      if (approve) {
        // 1. Add role to user_roles
        const { error: roleErr } = await supabase.from('user_roles').insert([{
          user_id: req.user_id,
          role: req.requested_role as 'DOCENT' | 'ADMIN' | 'LEERLING' | 'SUPERUSER',
        }]);
        if (roleErr) throw roleErr;
      }

      // 2. Update request status
      const { error: updateErr } = await supabase
        .from('role_requests')
        .update({
          status: approve ? 'APPROVED' : 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (updateErr) throw updateErr;

      toast({
        title: approve ? 'Goedgekeurd' : 'Afgewezen',
        description: `${req.requested_role}-aanvraag ${approve ? 'goedgekeurd' : 'afgewezen'}.`,
      });
      fetchRequests();
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message || 'Kon actie niet uitvoeren.', variant: 'destructive' });
    } finally {
      setActing(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Rolaanvragen
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{pendingCount} open</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isSuperUser
              ? 'Alle aanvragen (superuser-toegang)'
              : 'DOCENT-aanvragen binnen je school'}
          </p>
          {!isSuperUser && isAdmin && (
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Schoolfilter is frontend-only. ADMIN-aanvragen vereisen superuser-goedkeuring.
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Geen aanvragen gevonden.</p>
        ) : (
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {req.profile?.name || req.profile?.email || req.user_id.slice(0, 8)}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">{req.requested_role}</Badge>
                    <Badge
                      variant={req.status === 'PENDING' ? 'secondary' : req.status === 'APPROVED' ? 'default' : 'destructive'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {req.profile?.email && <span>{req.profile.email}</span>}
                    {req.profile?.school_id && <span className="ml-2">• {req.profile.school_id}</span>}
                    <span className="ml-2">• {new Date(req.created_at).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>
                {req.status === 'PENDING' && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] text-green-600 border-green-600/30 hover:bg-green-600/10"
                      disabled={acting === req.id}
                      onClick={() => handleReview(req, true)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Goedkeuren
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] text-red-600 border-red-600/30 hover:bg-red-600/10"
                      disabled={acting === req.id}
                      onClick={() => handleReview(req, false)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Afwijzen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleRequestsReviewTab;
