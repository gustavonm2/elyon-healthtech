import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ClinicGroup, ClinicMember, ProfessionalRole } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoggedUserType = 'admin' | ProfessionalRole | 'paciente' | 'gestor_master' | 'recepcao_upa';

export interface LoggedUser {
    id: string;
    name: string;
    email: string;
    role: LoggedUserType;
    groupId?: string;
    groupName?: string;
}

interface AuthContextType {
    currentUser: LoggedUser | null;
    isLoggedIn: boolean;
    /** Try to log in with email + password. Returns role on success or null on failure. */
    loginUser: (email: string, password: string) => Promise<LoggedUserType | null>;
    logoutUser: () => void;
    /** Register a new clinic group and return its id */
    registerGroup: (group: Omit<ClinicGroup, 'id' | 'members' | 'createdAt'>) => Promise<string>;
    /** Add a member to an existing group. Returns null on success, error message on failure. */
    addMember: (groupId: string, member: Omit<ClinicMember, 'id' | 'groupId' | 'createdAt'>) => Promise<string | null>;
    /** Get group by id */
    getGroup: (groupId: string) => Promise<ClinicGroup | undefined>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<LoggedUser | null>(() => {
        const raw = localStorage.getItem('sci_current_user');
        return raw ? JSON.parse(raw) : null;
    });

    const loginUser = useCallback(async (email: string, password: string): Promise<LoggedUserType | null> => {
        const normalizedEmail = email.toLowerCase().trim();

        // Check for special dev/demo test accounts
        if (normalizedEmail.includes('simulador') && (password === '1' || password.length > 0)) {
            const user: LoggedUser = {
                id: 'simulador-architect',
                name: 'Senior Principal Architect',
                email: 'simulador@elyon.ai',
                role: 'simulador',
            };
            setCurrentUser(user);
            localStorage.setItem('sci_current_user', JSON.stringify(user));
            localStorage.setItem('userRole', 'simulador');
            return 'simulador';
        }

        if (normalizedEmail.includes('recepcao') || normalizedEmail.includes('recepcaoupa')) {
            const user: LoggedUser = {
                id: 'recepcao-upa-user',
                name: 'Recepção UPA',
                email: 'recepcaoupa@elyon.ai',
                role: 'recepcao_upa',
            };
            setCurrentUser(user);
            localStorage.setItem('sci_current_user', JSON.stringify(user));
            localStorage.setItem('userRole', 'recepcao_upa');
            return 'recepcao_upa';
        }

        if (normalizedEmail.includes('triagem') || normalizedEmail.includes('triagemupa')) {
            const user: LoggedUser = {
                id: 'triagem-upa-user',
                name: 'Enfermeiro Triador Manchester',
                email: 'triagemupa@elyon.ai',
                role: 'triagem_upa',
            };
            setCurrentUser(user);
            localStorage.setItem('sci_current_user', JSON.stringify(user));
            localStorage.setItem('userRole', 'triagem_upa');
            return 'triagem_upa';
        }

        // Check if admin (gestor_master) of some clinic group
        const { data: groups, error: groupErr } = await supabase
            .from('clinic_groups')
            .select('*')
            .eq('admin_email', normalizedEmail)
            .eq('admin_password', password)
            .limit(1);

        if (!groupErr && groups && groups.length > 0) {
            const group = groups[0];
            const user: LoggedUser = {
                id: `admin-${group.id}`,
                name: group.admin_name,
                email: group.admin_email,
                role: 'gestor_master',
                groupId: group.id,
                groupName: group.name,
            };
            setCurrentUser(user);
            localStorage.setItem('sci_current_user', JSON.stringify(user));
            localStorage.setItem('userRole', 'gestor_master');
            return 'gestor_master';
        }

        // Check members
        const { data: members, error: memberErr } = await supabase
            .from('clinic_members')
            .select('*, clinic_groups(name)')
            .eq('email', normalizedEmail)
            .eq('password', password)
            .limit(1);

        if (!memberErr && members && members.length > 0) {
            const member = members[0];
            const groupName = (member.clinic_groups as { name: string } | null)?.name ?? '';
            const user: LoggedUser = {
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role as LoggedUserType,
                groupId: member.group_id,
                groupName,
            };
            setCurrentUser(user);
            localStorage.setItem('sci_current_user', JSON.stringify(user));
            localStorage.setItem('userRole', member.role);
            return member.role as LoggedUserType;
        }

        return null;
    }, []);

    const logoutUser = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('sci_current_user');
        localStorage.removeItem('userRole');
    }, []);

    const registerGroup = useCallback(
        async (groupData: Omit<ClinicGroup, 'id' | 'members' | 'createdAt'>): Promise<string> => {
            const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const { error } = await supabase.from('clinic_groups').insert({
                id,
                name: groupData.name,
                specialty: groupData.specialty,
                admin_name: groupData.adminName,
                admin_email: groupData.adminEmail,
                admin_password: groupData.adminPassword,
            });
            if (error) {
                console.error('Erro ao registrar grupo:', error);
                throw new Error(error.message);
            }
            return id;
        },
        []
    );

    const addMember = useCallback(
        async (groupId: string, memberData: Omit<ClinicMember, 'id' | 'groupId' | 'createdAt'>): Promise<string | null> => {
            // Tenta resolver o groupId; agora nullable no banco, então não bloqueia se faltar
            let resolvedGroupId: string | null = groupId || null;
            if (!resolvedGroupId) {
                try {
                    const raw = localStorage.getItem('sci_current_user');
                    resolvedGroupId = raw ? (JSON.parse(raw)?.groupId ?? null) : null;
                } catch { /* ignore */ }
            }

            const id = `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const { error } = await supabase.from('clinic_members').insert({
                id,
                group_id: resolvedGroupId,   // null é aceito agora (FK removida)
                name:     memberData.name,
                email:    memberData.email,
                password: memberData.password,
                role:     memberData.role,
                cpf:      memberData.cpf ?? null,
                conselho: memberData.conselho ?? null,
            });
            if (error) {
                console.error('Erro ao adicionar membro:', error);
                return error.message;
            }
            return null;
        },
        []
    );

    const getGroup = useCallback(async (groupId: string): Promise<ClinicGroup | undefined> => {
        const { data: group, error: gErr } = await supabase
            .from('clinic_groups')
            .select('*')
            .eq('id', groupId)
            .limit(1)
            .single();

        if (gErr || !group) return undefined;

        const { data: members } = await supabase
            .from('clinic_members')
            .select('*')
            .eq('group_id', groupId);

        return {
            id: group.id,
            name: group.name,
            specialty: group.specialty,
            adminName: group.admin_name,
            adminEmail: group.admin_email,
            adminPassword: group.admin_password,
            createdAt: group.created_at,
            members: (members ?? []).map((m) => ({
                id: m.id,
                groupId: m.group_id,
                name: m.name,
                email: m.email,
                password: m.password,
                role: m.role as ProfessionalRole,
                createdAt: m.created_at,
            })),
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{ currentUser, isLoggedIn: !!currentUser, loginUser, logoutUser, registerGroup, addMember, getGroup }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
