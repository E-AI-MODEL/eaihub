import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, GraduationCap, BookOpen, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MetricCell from '@/components/dashboard/MetricCell';
import SectionLabel from '@/components/dashboard/SectionLabel';
import type { AppRole } from '@/contexts/AuthContext';

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  school_id: string | null;
  roles: AppRole[];
  session_count?: number;
  last_active?: string | null;
}

const ROLE_META: Record<AppRole, { label: string; color: string; icon: React.ElementType }> = {
  LEERLING: { label: 'Leerling', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: BookOpen },
  DOCENT: { label: 'Docent', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: GraduationCap },
  ADMIN: { label: 'Admin', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Shield },
  SUPERUSER: { label: 'Superuser', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Shield },
};

const AdminUsersTab: React.FC = () => {
  const { user: currentUser, isSuperUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);

  // Resolve admin's own school_id
  useEffect(() => {
    if (!currentUser) return;
    supabase
      .from('profiles')
      .select('school_id')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.school_id) setAdminSchoolId(data.school_id);
      });
  }, [currentUser]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, name, school_id')
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // Fetch all roles
      const { data: allRoles, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rErr) throw rErr;

      // Fetch session counts per user (aggregated)
      const { data: sessions } = await supabase
        .from('student_sessions')
        .select('user_id, last_active_at')
        .order('last_active_at', { ascending: false });

      const roleMap = new Map<string, AppRole[]>();
      (allRoles || []).forEach(r => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role as AppRole);
        roleMap.set(r.user_id, existing);
      });

      // Session stats per user
      const sessionCountMap = new Map<string, number>();
      const lastActiveMap = new Map<string, string>();
      (sessions || []).forEach(s => {
        sessionCountMap.set(s.user_id, (sessionCountMap.get(s.user_id) || 0) + 1);
        if (!lastActiveMap.has(s.user_id) && s.last_active_at) {
          lastActiveMap.set(s.user_id, s.last_active_at);
        }
      });

      const merged: UserRow[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        school_id: p.school_id,
        roles: roleMap.get(p.id) || [],
        session_count: sessionCountMap.get(p.id) || 0,
        last_active: lastActiveMap.get(p.id) || null,
      }));

      // Filter to own school if not superuser
      const filtered = isSuperUser
        ? merged
        : merged.filter(u => u.school_id === adminSchoolId || !u.school_id);

      setUsers(filtered);
    } catch (e) {
      console.error('[AdminUsers] Load error:', e);
      toast({ title: 'Fout bij laden gebruikers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [adminSchoolId, isSuperUser]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggleDocent = async (targetUser: UserRow) => {
    const hasDocent = targetUser.roles.includes('DOCENT');
    try {
      if (hasDocent) {
        // Remove DOCENT role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUser.id)
          .eq('role', 'DOCENT');
        if (error) throw error;
        toast({ title: `Docentrol ingetrokken voor ${targetUser.name || targetUser.email}` });
      } else {
        // Add DOCENT role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: targetUser.id, role: 'DOCENT' });
        if (error) throw error;
        toast({ title: `Docentrol toegekend aan ${targetUser.name || targetUser.email}` });
      }
      loadUsers();
      setSelectedUser(null);
    } catch (e) {
      console.error('[AdminUsers] Role toggle error:', e);
      toast({ title: 'Fout bij rolwijziging', variant: 'destructive' });
    }
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}u`;
    return `${Math.floor(hours / 24)}d`;
  };

  const totalUsers = users.length;
  const totalDocenten = users.filter(u => u.roles.includes('DOCENT')).length;
  const totalLeerlingen = users.filter(u => u.roles.includes('LEERLING') && !u.roles.includes('DOCENT')).length;
  const totalAdmins = users.filter(u => u.roles.includes('ADMIN')).length;

  return (
    <div className="space-y-6">
      {/* Metrics overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCell label="Gebruikers" value={String(totalUsers)} icon={<Users className="w-3 h-3 text-primary" />} />
        <MetricCell label="Leerlingen" value={String(totalLeerlingen)} icon={<BookOpen className="w-3 h-3 text-emerald-400" />} />
        <MetricCell label="Docenten" value={String(totalDocenten)} icon={<GraduationCap className="w-3 h-3 text-blue-400" />} />
        <MetricCell label="Admins" value={String(totalAdmins)} icon={<Shield className="w-3 h-3 text-amber-400" />} />
      </div>

      {adminSchoolId && (
        <div className="text-[10px] font-mono text-muted-foreground">
          School: <span className="text-foreground">{adminSchoolId}</span>
          {!isSuperUser && <span className="ml-2 text-amber-500/70">(gefilterd op eigen school)</span>}
        </div>
      )}

      {/* User list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Gebruikers
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                  className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-secondary/50 ${
                    selectedUser?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-foreground truncate max-w-[200px]">
                      {u.name || 'Naamloos'}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {u.session_count} sessies · {getTimeSince(u.last_active)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground truncate max-w-[180px]">
                      {u.email || '—'}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      {u.roles.map(role => {
                        const meta = ROLE_META[role];
                        return (
                          <span key={role} className={`text-[7px] font-mono uppercase px-1 py-0.5 border ${meta.color}`}>
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <p className="text-[11px] text-muted-foreground py-4 text-center">Geen gebruikers gevonden.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected user detail */}
      {selectedUser && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {selectedUser.name || selectedUser.email || 'Gebruiker'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">E-mail: </span>
                <span className="text-foreground">{selectedUser.email || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">School: </span>
                <span className="text-foreground">{selectedUser.school_id || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sessies: </span>
                <span className="text-foreground">{selectedUser.session_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Laatst actief: </span>
                <span className="text-foreground">{selectedUser.last_active ? new Date(selectedUser.last_active).toLocaleString('nl-NL') : '—'}</span>
              </div>
            </div>

            <SectionLabel icon={<Shield className="w-3 h-3 text-primary" />} label="Rollen" />
            <div className="flex flex-wrap gap-2">
              {selectedUser.roles.map(role => {
                const meta = ROLE_META[role];
                return (
                  <Badge key={role} variant="outline" className={meta.color}>
                    {meta.label}
                  </Badge>
                );
              })}
            </div>

            {/* Role management — only DOCENT toggle for now */}
            {selectedUser.id !== currentUser?.id && (
              <div className="pt-2 border-t border-border">
                <SectionLabel icon={<GraduationCap className="w-3 h-3 text-primary" />} label="Rolbeheer" />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={selectedUser.roles.includes('DOCENT') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleDocent(selectedUser)}
                    className="text-[10px]"
                  >
                    {selectedUser.roles.includes('DOCENT') ? (
                      <><Trash2 className="w-3 h-3 mr-1" /> Docentrol intrekken</>
                    ) : (
                      <><Plus className="w-3 h-3 mr-1" /> Docentrol toekennen</>
                    )}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1.5">
                  Admin- en superuserrollen kunnen hier niet worden gewijzigd.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsersTab;
