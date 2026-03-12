import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface RoleRequest {
  id: string;
  requested_role: string;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
}

const REQUESTABLE_ROLES = ['DOCENT', 'ADMIN'] as const;

const RoleRequestForm = () => {
  const { user, roles } = useAuth();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('role_requests')
      .select('id, requested_role, status, created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRequests((data as RoleRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleRequest = async (role: typeof REQUESTABLE_ROLES[number]) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('role_requests').insert({
      user_id: user.id,
      requested_role: role,
    });
    if (error) {
      const isDuplicate = error.code === '23505';
      toast({
        title: isDuplicate ? 'Al aangevraagd' : 'Fout',
        description: isDuplicate
          ? `Je hebt al een openstaande aanvraag voor ${role}.`
          : 'Kon aanvraag niet indienen.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Aanvraag ingediend', description: `Rol "${role}" is aangevraagd. Een beheerder zal dit beoordelen.` });
      fetchRequests();
    }
    setSubmitting(false);
  };

  const statusIcon = (s: RequestStatus) => {
    if (s === 'PENDING') return <Clock className="w-3 h-3" />;
    if (s === 'APPROVED') return <CheckCircle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const statusVariant = (s: RequestStatus) => {
    if (s === 'PENDING') return 'secondary' as const;
    if (s === 'APPROVED') return 'default' as const;
    return 'destructive' as const;
  };

  // Roles user can still request (doesn't have yet, no PENDING request)
  const availableRoles = REQUESTABLE_ROLES.filter(r =>
    !roles.includes(r) &&
    !requests.some(req => req.requested_role === r && req.status === 'PENDING')
  );

  if (loading) return <p className="text-xs text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      {/* Request buttons */}
      {availableRoles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Vraag een extra rol aan:</p>
          <div className="flex gap-2">
            {availableRoles.map(role => (
              <Button
                key={role}
                size="sm"
                variant="outline"
                disabled={submitting}
                onClick={() => handleRequest(role)}
              >
                <Send className="w-3 h-3 mr-1.5" />
                {role === 'DOCENT' ? 'Docentrol' : 'Adminrol'} aanvragen
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Existing requests */}
      {requests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Mijn aanvragen:</p>
          {requests.map(req => (
            <div key={req.id} className="flex items-center gap-2 text-xs p-2 rounded bg-secondary/50 border border-border">
              {statusIcon(req.status as RequestStatus)}
              <span className="font-medium">{req.requested_role}</span>
              <Badge variant={statusVariant(req.status as RequestStatus)} className="text-[9px] px-1.5 py-0">
                {req.status}
              </Badge>
              <span className="text-muted-foreground ml-auto">
                {new Date(req.created_at).toLocaleDateString('nl-NL')}
              </span>
            </div>
          ))}
        </div>
      )}

      {availableRoles.length === 0 && requests.length === 0 && (
        <p className="text-xs text-muted-foreground">Je hebt al alle beschikbare rollen.</p>
      )}
    </div>
  );
};

export default RoleRequestForm;
