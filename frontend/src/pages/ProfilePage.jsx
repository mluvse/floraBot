import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Trash2, Leaf, Camera, History, Award, Edit3 } from 'lucide-react';
import axios from '../api.js';
import { useAuth } from '../context/AuthContext';
import useLazyReveal from '../hooks/useLazyReveal';

const API = '/api';

function HistoryCard({ item, onDelete }) {
  const ref = useLazyReveal();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Удалить эту запись?')) return;
    setDeleting(true);
    try { await axios.delete(`${API}/history/${item.id}`); onDelete(item.id); } catch {}
    setDeleting(false);
  };

  return (
    <div ref={ref} className="lazy-reveal card p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-flora-50 flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Leaf size={24} className="text-flora-200" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-earth-800 truncate">{item.name_ru || 'Неизвестно'}</h3>
            <p className="text-xs text-earth-400 italic">{item.name_latin}</p>
          </div>
          <button onClick={handleDelete} disabled={deleting}
            className="text-earth-300 hover:text-red-400 transition-colors flex-shrink-0 p-1">
            <Trash2 size={15} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {item.confidence && (
            <span className={`badge text-xs ${item.confidence > 0.8 ? 'bg-green-50 text-green-600' : item.confidence > 0.6 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
              {Math.round(item.confidence * 100)}% точность
            </span>
          )}
          <span className="text-xs text-earth-300">
            {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {item.notes && <p className="text-xs text-earth-400 mt-1 line-clamp-1">📝 {item.notes}</p>}
        {item.tree_id && (
          <Link to={`/catalog/${item.tree_id}`} className="text-xs text-flora-600 hover:underline mt-1 inline-block">
            Подробнее →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useLazyReveal();

  useEffect(() => {
    axios.get(`${API}/history`).then(r => setHistory(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setHistory(prev => prev.filter(h => h.id !== id));

  const stats = {
    total: history.length,
    unique: new Set(history.map(h => h.tree_id).filter(Boolean)).size,
    avgConf: history.length ? Math.round(history.reduce((s, h) => s + (h.confidence || 0), 0) / history.length * 100) : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-flora-50 via-white to-blossom-50 pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Profile header */}
        <div ref={headerRef} className="lazy-reveal card p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-flora-400 to-blossom-400 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="font-display font-bold text-2xl text-earth-800 mb-1">{user?.username}</h1>
              <p className="text-earth-400 text-sm">{user?.email}</p>
              <p className="text-earth-300 text-xs mt-1">
                В FloraBot с {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>
            <button onClick={logout}
              className="text-sm text-earth-400 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 border border-earth-100">
              Выйти
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-flora-100">
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-flora-600">{stats.total}</div>
              <div className="text-xs text-earth-400 flex items-center justify-center gap-1 mt-1"><Camera size={10} /> Распознаний</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-blossom-500">{stats.unique}</div>
              <div className="text-xs text-earth-400 flex items-center justify-center gap-1 mt-1"><Leaf size={10} /> Уникальных</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-amber-500">{stats.avgConf}%</div>
              <div className="text-xs text-earth-400 flex items-center justify-center gap-1 mt-1"><Award size={10} /> Средняя точность</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link to="/recognize" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-blossom-100 flex items-center justify-center group-hover:bg-blossom-200 transition-colors">
              <Camera size={20} className="text-blossom-500" />
            </div>
            <div>
              <div className="font-medium text-earth-700 text-sm">Распознать</div>
              <div className="text-xs text-earth-400">Новое фото</div>
            </div>
          </Link>
          <Link to="/catalog" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-flora-100 flex items-center justify-center group-hover:bg-flora-200 transition-colors">
              <Leaf size={20} className="text-flora-500" />
            </div>
            <div>
              <div className="font-medium text-earth-700 text-sm">Каталог</div>
              <div className="text-xs text-earth-400">Все деревья</div>
            </div>
          </Link>
        </div>

        {/* History */}
        <div>
          <h2 className="font-display font-bold text-xl text-earth-800 mb-4 flex items-center gap-2">
            <History size={20} className="text-flora-500" /> История распознаваний
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-4 flex gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-flora-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-4 bg-flora-100 rounded w-2/3" />
                    <div className="h-3 bg-flora-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="card p-10 text-center">
              <Camera size={40} className="mx-auto text-earth-200 mb-3" />
              <p className="text-earth-400">Вы ещё не распознали ни одного дерева</p>
              <Link to="/recognize" className="btn-primary mt-4 inline-flex">Начать сейчас</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => <HistoryCard key={item.id} item={item} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
