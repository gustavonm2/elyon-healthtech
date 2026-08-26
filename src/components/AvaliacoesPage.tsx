import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, ChevronDown, ChevronUp, TrendingUp, TrendingDown, X } from 'lucide-react';
import { getRatings, seedMockRatings, type StoredRating } from '../utils/patientStore';

// ── Star display ──────────────────────────────────────────────────────────────
const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-3.5 h-3.5' }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={size}
                fill={s <= Math.round(value) ? '#F59E0B' : 'none'}
                stroke={s <= Math.round(value) ? '#F59E0B' : '#CBD5E1'}
            />
        ))}
    </div>
);

// ── Score badge colour ────────────────────────────────────────────────────────
const scoreBg = (avg: number) => {
    if (avg >= 4.5) return { bg: '#D1FAE5', text: '#065F46' };
    if (avg >= 3.5) return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
};

// ── Doctor summary type ───────────────────────────────────────────────────────
interface DoctorRow {
    name: string;
    specialty: string;
    team: string;
    ratings: StoredRating[];
    avg: number;
    total: number;
}

// ── Sort options ──────────────────────────────────────────────────────────────
type SortKey = 'avg_desc' | 'avg_asc' | 'total_desc' | 'name_asc';
const SORT_LABELS: Record<SortKey, string> = {
    avg_desc:   'Melhor Avaliado',
    avg_asc:    'Pior Avaliado',
    total_desc: 'Mais Avaliações',
    name_asc:   'Nome A–Z',
};

// ── Main component ────────────────────────────────────────────────────────────
const AvaliacoesPage: React.FC = () => {
    const [ratings, setRatings] = useState<StoredRating[]>([]);
    const [search, setSearch] = useState('');
    const [specialty, setSpecialty] = useState('all');
    const [team, setTeam] = useState('all');
    const [sort, setSort] = useState<SortKey>('avg_desc');
    const [sortOpen, setSortOpen] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        seedMockRatings();
        setRatings(getRatings());
    }, []);

    // Group into doctor rows
    const doctorMap = useMemo(() => {
        const map = new Map<string, DoctorRow>();
        ratings.forEach(r => {
            if (!map.has(r.doctorName)) {
                map.set(r.doctorName, { name: r.doctorName, specialty: r.doctorSpecialty, team: r.team, ratings: [], avg: 0, total: 0 });
            }
            map.get(r.doctorName)!.ratings.push(r);
        });
        map.forEach(d => {
            d.total = d.ratings.length;
            d.avg = d.total > 0 ? Math.round((d.ratings.reduce((a, r) => a + r.stars, 0) / d.total) * 10) / 10 : 0;
        });
        return map;
    }, [ratings]);

    const allSpecialties = useMemo(() => Array.from(new Set(ratings.map(r => r.doctorSpecialty))), [ratings]);
    const allTeams = useMemo(() => Array.from(new Set(ratings.map(r => r.team))), [ratings]);

    const rows = useMemo(() => {
        let list = Array.from(doctorMap.values());
        if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()));
        if (specialty !== 'all') list = list.filter(d => d.specialty === specialty);
        if (team !== 'all') list = list.filter(d => d.team === team);
        list = list.sort((a, b) => {
            if (sort === 'avg_desc') return b.avg - a.avg;
            if (sort === 'avg_asc') return a.avg - b.avg;
            if (sort === 'total_desc') return b.total - a.total;
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [doctorMap, search, specialty, team, sort]);

    // Summary strip
    const allAvg = ratings.length > 0 ? Math.round((ratings.reduce((a, r) => a + r.stars, 0) / ratings.length) * 10) / 10 : 0;
    const best = rows[0];
    const worst = rows[rows.length - 1];

    const clearFilters = () => { setSearch(''); setSpecialty('all'); setTeam('all'); setSort('avg_desc'); };
    const hasFilters = search || specialty !== 'all' || team !== 'all' || sort !== 'avg_desc';

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-300">

                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-[12px] font-bold text-slate-800 tracking-tight">Avaliações dos Pareceristas</h1>
                    <p className="text-slate-500 mt-1 text-[11px] font-medium">Controle interno de desempenho por profissional e equipe</p>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Média Geral', value: allAvg.toFixed(1), sub: `${ratings.length} aval.`, accent: '#F59E0B' },
                        { label: 'Profissionais', value: String(doctorMap.size), sub: 'pareceristas', accent: '#2563EB' },
                        { label: 'Melhor Avaliado', value: best ? best.avg.toFixed(1) : '–', sub: best?.name.split(' ').slice(0,2).join(' ') ?? 'N/A', accent: '#10B981' },
                        { label: 'Pior Avaliado', value: worst ? worst.avg.toFixed(1) : '–', sub: worst?.name.split(' ').slice(0,2).join(' ') ?? 'N/A', accent: '#DC2626' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.accent }} />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
                                <p className="text-[18px] font-black text-slate-800 leading-tight">{s.value}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">{s.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-3 items-center">

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm text-slate-400">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou especialidade..."
                                className="w-full pl-9 pr-4 py-2 text-[11px] border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D3461] shadow-sm text-slate-700"
                            />
                        </div>

                        {/* Specialty */}
                        <select
                            value={specialty}
                            onChange={e => setSpecialty(e.target.value)}
                            className="text-[11px] font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D3461] shadow-sm cursor-pointer"
                        >
                            <option value="all">Todas as Especialidades</option>
                            {allSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Team */}
                        <select
                            value={team}
                            onChange={e => setTeam(e.target.value)}
                            className="text-[11px] font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D3461] shadow-sm cursor-pointer"
                        >
                            <option value="all">Todas as Equipes</option>
                            {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortOpen(o => !o)}
                                className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                            >
                                {sort === 'avg_desc' ? <TrendingUp className="w-4 h-4 text-[#10B981]" /> : sort === 'avg_asc' ? <TrendingDown className="w-4 h-4 text-[#DC2626]" /> : null}
                                {SORT_LABELS[sort]}
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {sortOpen && (
                                <div className="absolute right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                                    {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setSort(key); setSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-[11px] font-semibold transition-colors ${sort === key ? 'bg-[#EEF4FA] text-[#1D3461]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear filters */}
                        {hasFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-slate-500 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" /> Limpar
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500">Profissional</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500">Especialidade</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500">Equipe</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 text-center">Nota Média</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 text-center">Avaliações</th>
                                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 text-center">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((doc, idx) => {
                                    const { bg, text } = scoreBg(doc.avg);
                                    const isOpen = expanded === doc.name;
                                    return (
                                        <React.Fragment key={doc.name}>
                                            <tr
                                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                                onClick={() => setExpanded(isOpen ? null : doc.name)}
                                            >
                                                {/* Rank + name */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-[11px] font-bold text-slate-800 group-hover:text-[#1D3461] transition-colors">{doc.name}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Specialty */}
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold bg-[#EEF4FA] text-[#1D3461]">
                                                        {doc.specialty}
                                                    </span>
                                                </td>

                                                {/* Team */}
                                                <td className="py-4 px-6 text-[11px] font-medium text-slate-500">{doc.team}</td>

                                                {/* Avg score */}
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[13px] font-black px-2.5 py-0.5 rounded-lg" style={{ backgroundColor: bg, color: text }}>
                                                            {doc.avg.toFixed(1)}
                                                        </span>
                                                        <Stars value={doc.avg} />
                                                    </div>
                                                </td>

                                                {/* Count */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[12px] font-bold text-slate-700">{doc.total}</span>
                                                </td>

                                                {/* Expand */}
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EEF4FA] text-[#1D3461] hover:bg-[#1D3461] hover:text-white transition-all shadow-sm"
                                                        title={isOpen ? 'Ocultar' : 'Ver avaliações'}
                                                    >
                                                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded review rows */}
                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={6} className="bg-[#F8FAFC] border-b border-slate-100 px-6 py-0">
                                                        <div className="py-4 space-y-3">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avaliações individuais — {doc.name}</p>
                                                            {doc.ratings.length === 0 ? (
                                                                <p className="text-[11px] text-slate-400">Nenhuma avaliação ainda.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full">
                                                                        <thead>
                                                                            <tr className="text-left">
                                                                                <th className="pb-2 pr-6 text-[10px] font-bold text-slate-400">Paciente</th>
                                                                                <th className="pb-2 pr-6 text-[10px] font-bold text-slate-400">Nota</th>
                                                                                <th className="pb-2 pr-6 text-[10px] font-bold text-slate-400">Comentário</th>
                                                                                <th className="pb-2 text-[10px] font-bold text-slate-400">Data</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {doc.ratings.map(r => (
                                                                                <tr key={r.id}>
                                                                                    <td className="py-2 pr-6 text-[11px] font-bold text-slate-700 whitespace-nowrap">{r.patientName}</td>
                                                                                    <td className="py-2 pr-6">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Stars value={r.stars} size="w-3 h-3" />
                                                                                            <span className="text-[11px] font-black text-slate-700">{r.stars}.0</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-2 pr-6 text-[11px] text-slate-500 font-medium max-w-[320px]">
                                                                                        {r.comment || <span className="italic text-slate-300">Sem comentário</span>}
                                                                                    </td>
                                                                                    <td className="py-2 text-[11px] text-slate-400 font-medium whitespace-nowrap">{r.date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-[11px] font-medium">
                                            Nenhum profissional encontrado com os filtros selecionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer row count */}
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-400">
                        {rows.length} profissional{rows.length !== 1 ? 'is' : ''} · {ratings.length} avaliação{ratings.length !== 1 ? 'ões' : ''} no total
                    </div>
                </div>
            </div>

            {/* Close sort dropdown on outside click */}
            {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}
        </div>
    );
};

export default AvaliacoesPage;
