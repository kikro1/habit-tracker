import { NavLink, Outlet } from 'react-router-dom'
import { Sprout, BookOpenText, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useHabitReminders from '../hooks/useHabitReminders'

export default function Layout() {
  const { user, signOut } = useAuth()
  useHabitReminders(Boolean(user))

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-moss text-paper shadow-card' : 'text-ink-soft hover:bg-paper-deep'
    }`

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-line bg-paper-dim/80 backdrop-blur sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display text-xl text-ink">
            <div className="w-8 h-8 rounded-full bg-moss text-paper flex items-center justify-center shrink-0">
              <Sprout size={16} />
            </div>
            <span className="hidden sm:inline">Field Log</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              <BookOpenText size={16} />
              <span className="hidden sm:inline">Today</span>
            </NavLink>
            <NavLink to="/stats" className={linkClass}>
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Stats</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-ink-faint font-mono-num">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-deep transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  )
}
