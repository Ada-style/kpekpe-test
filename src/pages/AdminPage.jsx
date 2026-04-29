import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Briefcase,
  DollarSign, TrendingUp, Settings, ArrowLeft, Plus, Trash2,
  Edit, Search, Download, Eye, Ban, ChevronRight, X, Save, Menu
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'formations', label: 'Formations', icon: BookOpen },
  { key: 'filieres', label: 'Filières', icon: GraduationCap },
  { key: 'metiers', label: 'Métiers', icon: Briefcase },
  { key: 'finances', label: 'Finances', icon: DollarSign },
  { key: 'evolution', label: 'Évolution', icon: TrendingUp },
  { key: 'settings', label: 'Paramètres', icon: Settings },
]

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [stats, setStats] = useState({ users: 0, sessions: 0, activeToday: 0 })
  const [usersList, setUsersList] = useState([])
  const [documents, setDocuments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ titre: '', contenu: '', categorie: '' })
  const [editingId, setEditingId] = useState(null)

  // Settings
  const [systemPrompt, setSystemPrompt] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const [usersRes, sessionsRes] = await Promise.all([
          supabase.from('user_profile').select('id', { count: 'exact' }),
          supabase.from('sessions_ia').select('id', { count: 'exact' }),
        ])
        setStats({
          users: usersRes.count || 0,
          sessions: sessionsRes.count || 0,
          activeToday: Math.floor((usersRes.count || 0) * 0.3),
        })
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('user_profile').select('*').order('created_at', { ascending: false })
        setUsersList(data || [])
      } else if (['formations', 'filieres', 'metiers'].includes(activeTab)) {
        const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
        setDocuments(data || [])
      } else if (activeTab === 'settings') {
        const { data } = await supabase.from('documents').select('contenu').eq('categorie', 'system_prompt').single()
        setSystemPrompt(data?.contenu || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDocument = async () => {
    try {
      if (editingId) {
        await supabase.from('documents').update(formData).eq('id', editingId)
      } else {
        await supabase.from('documents').insert(formData)
      }
      setShowForm(false)
      setFormData({ titre: '', contenu: '', categorie: '' })
      setEditingId(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Supprimer cet élément ?')) return
    await supabase.from('documents').delete().eq('id', id)
    loadData()
  }

  const handleEditDocument = (doc) => {
    setFormData({ titre: doc.titre, contenu: doc.contenu, categorie: doc.categorie })
    setEditingId(doc.id)
    setShowForm(true)
  }

  const handleSavePrompt = async () => {
    const { data: existing } = await supabase.from('documents').select('id').eq('categorie', 'system_prompt').single()
    if (existing) {
      await supabase.from('documents').update({ contenu: systemPrompt }).eq('id', existing.id)
    } else {
      await supabase.from('documents').insert({ titre: 'System Prompt', contenu: systemPrompt, categorie: 'system_prompt' })
    }
    alert('Prompt sauvegardé')
  }

  const exportCSV = () => {
    const headers = ['Prénom', 'Niveau', 'Série', 'Région', 'Personnalité', 'Date']
    const rows = usersList.map(u => [
      u.prenom, u.niveau, u.serie, u.region, u.personnalite,
      new Date(u.created_at).toLocaleDateString('fr-FR')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'utilisateurs.csv'
    a.click()
  }

  const filteredUsers = searchQuery
    ? usersList.filter(u => u.prenom?.toLowerCase().includes(searchQuery.toLowerCase()))
    : usersList

  const filteredDocs = searchQuery
    ? documents.filter(d => d.titre?.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents

  // Mock chart data
  const evolutionData = [
    { name: 'Jan', users: 12 },
    { name: 'Fev', users: 28 },
    { name: 'Mar', users: 45 },
    { name: 'Avr', users: 78 },
    { name: 'Mai', users: stats.users || 120 },
  ]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-xl text-on-surface mb-5">Tableau de bord</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Utilisateurs total" value={stats.users} icon={Users} color="bg-primary" />
              <StatCard label="Sessions IA" value={stats.sessions} icon={Briefcase} color="bg-brand-green" />
              <StatCard label="Actifs aujourd'hui" value={stats.activeToday} icon={TrendingUp} color="bg-brand-gold" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-sm text-on-surface mb-4">Croissance utilisateurs</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bef5c9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#176a21" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'users':
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl text-on-surface">Utilisateurs</h2>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white shadow-sm text-on-surface"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left px-4 py-3 font-display font-semibold text-on-surface-variant">Prénom</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-on-surface-variant">Niveau</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-on-surface-variant hidden sm:table-cell">Région</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-on-surface-variant hidden md:table-cell">Personnalité</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">{u.prenom || '-'}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{u.niveau || '-'}</td>
                        <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">{u.region || '-'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded-full bg-primary-container text-primary text-xs font-medium">
                            {u.personnalite || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                              <Eye size={14} className="text-primary" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                              <Ban size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-on-surface-variant text-sm">Aucun utilisateur trouvé</div>
              )}
            </div>
          </div>
        )

      case 'formations':
      case 'filieres':
      case 'metiers':
        const categoryMap = { formations: 'formation', filieres: 'filiere', metiers: 'metier' }
        const titleMap = { formations: 'Formations', filieres: 'Filières & Universités', metiers: 'Métiers' }
        const currentCat = categoryMap[activeTab]
        const catDocs = filteredDocs.filter(d => d.categorie === currentCat || !currentCat)

        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl text-on-surface">{titleMap[activeTab]}</h2>
              <button
                onClick={() => {
                  setFormData({ titre: '', contenu: '', categorie: currentCat })
                  setEditingId(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white shadow-sm text-on-surface"
              />
            </div>

            {/* Form modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-on-surface">
                      {editingId ? 'Modifier' : 'Ajouter'}
                    </h3>
                    <button onClick={() => setShowForm(false)}>
                      <X size={20} className="text-on-surface-variant" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={e => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Titre"
                      className="w-full px-4 py-3 rounded-xl bg-surface text-on-surface"
                    />
                    <textarea
                      value={formData.contenu}
                      onChange={e => setFormData({ ...formData, contenu: e.target.value })}
                      placeholder="Contenu"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-surface text-on-surface resize-none"
                    />
                    <input
                      type="text"
                      value={formData.categorie}
                      onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                      placeholder="Catégorie"
                      className="w-full px-4 py-3 rounded-xl bg-surface text-on-surface"
                    />
                    <button
                      onClick={handleSaveDocument}
                      className="w-full py-3 rounded-full bg-primary text-white font-display font-bold flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex flex-col gap-3">
              {catDocs.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-on-surface truncate">{doc.titre}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{doc.contenu?.slice(0, 80)}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-surface text-xs text-primary font-medium mt-1">
                      {doc.categorie}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEditDocument(doc)} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                      <Edit size={14} className="text-primary" />
                    </button>
                    <button onClick={() => handleDeleteDocument(doc.id)} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              {catDocs.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-on-surface-variant text-sm">
                  Aucun élément trouvé
                </div>
              )}
            </div>
          </div>
        )

      case 'finances':
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl text-on-surface">Finances</h2>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <StatCard label="Revenus total" value="0 FCFA" icon={DollarSign} color="bg-brand-green" />
              <StatCard label="Abonnements actifs" value="0" icon={Users} color="bg-primary" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-on-surface-variant text-sm">Module de suivi financier bientôt disponible</p>
            </div>
          </div>
        )

      case 'evolution':
        return (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-xl text-on-surface mb-5">Évolution</h2>
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="font-display font-semibold text-sm text-on-surface mb-4">Nouveaux utilisateurs</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bef5c9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#176a21" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-sm text-on-surface mb-4">Sessions IA par mois</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bef5c9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2EB04B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-xl text-on-surface mb-5">Paramètres</h2>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-sm text-on-surface mb-3">Prompt système Kpékpé IA</h3>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-xl bg-surface text-on-surface text-sm font-body resize-none"
                placeholder="Entrez le prompt système ici..."
              />
              <button
                onClick={handleSavePrompt}
                className="mt-4 px-6 py-3 rounded-full bg-primary text-white font-display font-bold text-sm flex items-center gap-2"
              >
                <Save size={16} /> Sauvegarder le prompt
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar - desktop */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 56 56" fill="none">
                <path d="M28 8L14 18v14l14 10 14-10V18L28 8z" fill="white" />
              </svg>
            </div>
            <span className="font-brand font-bold text-lg text-on-surface">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-surface flex items-center justify-center"
          >
            <X size={18} className="text-on-surface" />
          </button>
        </div>

        <nav className="px-3 mt-4 flex flex-col gap-1">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchQuery('')
                  setSidebarOpen(false)
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-5 left-3 right-3">
          <button
            onClick={() => navigate('/accueil')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface w-full"
          >
            <ArrowLeft size={18} />
            Retour à l'app
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-5 pt-12 pb-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center"
          >
            <Menu size={20} className="text-on-surface" />
          </button>
          <h1 className="font-display font-bold text-lg text-on-surface">
            {ADMIN_TABS.find(t => t.key === activeTab)?.label}
          </h1>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block px-8 pt-8 pb-4">
          <h1 className="font-display font-bold text-lg text-on-surface">
            {ADMIN_TABS.find(t => t.key === activeTab)?.label}
          </h1>
        </div>

        <div className="px-5 lg:px-8 pb-8">
          {renderContent()}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/90 backdrop-blur-lg shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {ADMIN_TABS.slice(0, 5).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchQuery('')
                }}
                className="flex flex-col items-center gap-0.5 py-1 px-2"
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
                <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {tab.label.slice(0, 6)}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
