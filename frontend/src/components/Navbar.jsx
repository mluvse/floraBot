import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Camera, BookOpen, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloraLogo from './FloraLogo';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  const links = [
    { to: '/', label: 'Главная', icon: Home },
    { to: '/recognize', label: 'Распознать', icon: Camera },
    { to: '/catalog', label: 'Каталог', icon: BookOpen },
  ];
  if (user) links.push({ to: '/profile', label: 'Профиль', icon: User });

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-flora-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <FloraLogo size={38} className="group-hover:scale-110 transition-transform duration-200" />
          <span className="font-display font-bold text-xl text-flora-700 group-hover:text-flora-600 transition-colors">
            FloraBot
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive(to)
                  ? 'bg-flora-100 text-flora-700'
                  : 'text-earth-600 hover:bg-flora-50 hover:text-flora-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Auth desktop */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-earth-600 font-medium">
                👋 {user.username}
              </span>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-earth-500 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
                <LogOut size={15} /> Выйти
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">Войти</Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Регистрация</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-xl text-earth-600 hover:bg-flora-50 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-flora-100 shadow-lg px-4 py-4 flex flex-col gap-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive(to) ? 'bg-flora-100 text-flora-700' : 'text-earth-600 hover:bg-flora-50'
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
          <div className="border-t border-flora-100 pt-2 mt-1">
            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-earth-500 font-medium">👋 {user.username}</div>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all font-medium">
                  <LogOut size={18} /> Выйти
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary justify-center">Войти</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary justify-center">Регистрация</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
