import type { AppNavKey } from '../../state/AppStateProvider'

interface SidebarProps {
  activeNav: AppNavKey
  onNavigate: (nav: AppNavKey) => void
}

const NAV_ITEMS: Array<{ id: AppNavKey; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'billing', label: 'Billing & Claims' },
  { id: 'denials', label: 'Denials & AR' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'admin', label: 'Admin / Master Files' },
]

export const Sidebar = ({ activeNav, onNavigate }: SidebarProps) => (
  <aside className="hidden w-64 flex-none border-r border-slate-200 bg-white/90 backdrop-blur-sm md:flex md:flex-col">
    <div className="px-6 pb-4 pt-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation</div>
    </div>
    <nav className="flex-1 space-y-1 px-2">
      {NAV_ITEMS.map((item) => {
        const isActive = activeNav === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              isActive
                ? 'bg-brand/10 text-brand-dark ring-1 ring-inset ring-brand/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>

    <div className="m-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
      <p className="font-semibold text-slate-700">Statements</p>
      <p className="mt-1 leading-relaxed">
        Patient statement generation and migration: <span className="font-semibold text-emerald-600">COMPLETE</span>.
      </p>
      <p className="mt-2 text-[11px] text-slate-400">Not part of this prototype.</p>
    </div>
  </aside>
)
