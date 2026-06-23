import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Leaf, ArrowLeft, Calendar, MapPin, Flower2, BookOpen, Edit, Trash2, Plus, X, AlertCircle } from 'lucide-react';
import axios from '../api.js';
import { useAuth } from '../context/AuthContext';
import useLazyReveal from '../hooks/useLazyReveal';
import { treeImageUrl } from '../utils/imageUrl.js';

const API = '/api';

function TreeImage({ url, alt, className }) {
  const [error, setError] = useState(false);
  const src = treeImageUrl(url);
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col">
        <Flower2 size={48} className="text-flora-300 mb-2" />
        <span className="text-xs text-flora-400">Нет фото</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} loading="lazy" />;
}

function TreeCard({ tree }) {
  const ref = useLazyReveal();
  return (
    <Link to={`/catalog/${tree.id}`} ref={ref}
      className="lazy-reveal card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group block overflow-hidden">
      <div className="h-44 bg-gradient-to-br from-flora-100 to-blossom-100 flex items-center justify-center relative overflow-hidden">
        <TreeImage
          url={tree.image_url}
          alt={tree.name_ru}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-earth-900/40 to-transparent pointer-events-none" />
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-earth-800 text-lg leading-tight mb-1">{tree.name_ru}</h3>
        <p className="text-earth-400 text-xs italic mb-3">{tree.name_latin}</p>
        <div className="flex flex-wrap gap-2">
          {tree.family && <span className="badge bg-flora-50 text-flora-600 text-xs">{tree.family.split('(')[0].trim()}</span>}
          {tree.bloom_season && <span className="badge bg-blossom-50 text-blossom-600 text-xs"><Calendar size={10} className="mr-1" />{tree.bloom_season}</span>}
        </div>
      </div>
    </Link>
  );
}

export function CatalogPage() {
  const [trees, setTrees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        const { data } = await axios.get(`${API}/trees`, { params });
        setTrees(data);
      } catch {}
      setLoading(false);
    };
    const timer = setTimeout(fetch, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-flora-50 via-white to-blossom-50 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 page-enter">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-earth-800 mb-3">🌳 Каталог деревьев</h1>
          <p className="text-earth-400 max-w-lg mx-auto">Подробные описания деревьев с характеристиками цветков, временем цветения и ареалом.</p>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию..." className="input-field pl-10" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-300 hover:text-earth-500">
                <X size={16} />
              </button>
            )}
          </div>
          {user && (
            <Link to="/catalog/new" className="btn-primary whitespace-nowrap"><Plus size={18} /> Добавить</Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse">
                <div className="h-44 bg-flora-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-flora-100 rounded w-3/4" />
                  <div className="h-3 bg-flora-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : trees.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-earth-200 mb-4" />
            <p className="text-earth-400 text-lg">Деревья не найдены</p>
            {search && <button onClick={() => setSearch('')} className="mt-3 text-flora-600 hover:underline text-sm">Очистить поиск</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trees.map(t => <TreeCard key={t.id} tree={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function TreeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id === 'new') { setLoading(false); return; }
    axios.get(`${API}/trees/${id}`).then(r => setTree(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Удалить это дерево из каталога?')) return;
    setDeleting(true);
    try { await axios.delete(`${API}/trees/${id}`); navigate('/catalog'); } catch {}
    setDeleting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Flower2 size={40} className="animate-spin text-flora-400" />
    </div>
  );
  if (!tree) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center">
        <p className="text-earth-500">Дерево не найдено</p>
        <Link to="/catalog" className="btn-secondary mt-4">К каталогу</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-flora-50 to-white pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary !p-2"><ArrowLeft size={18} /></button>
          <Link to="/catalog" className="text-sm text-earth-400 hover:text-flora-600 transition-colors">← Каталог</Link>
        </div>

        <div className="card overflow-hidden page-enter">
          <div className="h-64 md:h-80 bg-gradient-to-br from-flora-100 to-blossom-100 relative">
            <TreeImage
              url={tree.image_url}
              alt={tree.name_ru}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-earth-900/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="font-display font-bold text-3xl text-white mb-1">{tree.name_ru}</h1>
              <p className="text-white/70 italic text-lg">{tree.name_latin}</p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-flora-50 rounded-2xl p-4">
                <div className="text-xs text-flora-500 font-medium mb-1">Семейство</div>
                <div className="text-earth-700 font-medium text-sm">{tree.family || '—'}</div>
              </div>
              <div className="bg-blossom-50 rounded-2xl p-4">
                <div className="flex items-center gap-1 text-xs text-blossom-500 font-medium mb-1"><Calendar size={10} /> Цветение</div>
                <div className="text-earth-700 font-medium text-sm">{tree.bloom_season || '—'}</div>
              </div>
              {tree.regions?.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mb-1"><MapPin size={10} /> Ареал</div>
                  <div className="text-earth-700 font-medium text-sm">{tree.regions.join(', ')}</div>
                </div>
              )}
            </div>

            {tree.description && (
              <div>
                <h2 className="font-display font-semibold text-earth-700 mb-2 flex items-center gap-2"><Leaf size={16} /> Описание</h2>
                <p className="text-earth-500 leading-relaxed">{tree.description}</p>
              </div>
            )}

            {tree.flower_description && (
              <div className="bg-blossom-50 rounded-2xl p-5">
                <h2 className="font-display font-semibold text-blossom-700 mb-2 flex items-center gap-2"><Flower2 size={16} /> Описание цветков</h2>
                <p className="text-earth-600 leading-relaxed">{tree.flower_description}</p>
              </div>
            )}

            {user && (
              <div className="flex gap-3 pt-4 border-t border-flora-100">
                <Link to={`/catalog/${id}/edit`} className="btn-secondary flex-1 justify-center"><Edit size={16} /> Редактировать</Link>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-red-500 border-2 border-red-200 hover:bg-red-50 transition-all font-semibold text-sm disabled:opacity-50">
                  <Trash2 size={16} /> Удалить
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TreeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name_ru: '', name_latin: '', family: '', description: '',
    flower_description: '', bloom_season: '', regions: '', image_url: ''
  });

  useEffect(() => {
    if (isEdit) {
      axios.get(`${API}/trees/${id}`).then(r => {
        const t = r.data;
        setForm({ ...t, regions: (t.regions || []).join(', ') });
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name_ru.trim()) { setError('Введите название дерева'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, regions: form.regions ? form.regions.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (isEdit) await axios.put(`${API}/trees/${id}`, payload);
      else await axios.post(`${API}/trees`, payload);
      navigate('/catalog');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><Flower2 size={40} className="animate-spin text-flora-400" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-flora-50 to-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary !p-2"><ArrowLeft size={18} /></button>
          <h1 className="font-display font-bold text-2xl text-earth-800">{isEdit ? 'Редактировать дерево' : 'Добавить дерево'}</h1>
        </div>
        <div className="card p-6 md:p-8 page-enter">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2"><AlertCircle size={16} />{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name_ru', label: 'Название (рус.) *', placeholder: 'Яблоня домашняя' },
              { key: 'name_latin', label: 'Латинское название', placeholder: 'Malus domestica' },
              { key: 'family', label: 'Семейство', placeholder: 'Розовые (Rosaceae)' },
              { key: 'bloom_season', label: 'Период цветения', placeholder: 'Апрель–Май' },
              { key: 'regions', label: 'Ареал (через запятую)', placeholder: 'Европа, Азия, Россия' },
              { key: 'image_url', label: 'URL изображения', placeholder: 'https://...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-earth-700 mb-1">{label}</label>
                <input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="input-field" />
              </div>
            ))}
            {['description', 'flower_description'].map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  {key === 'description' ? 'Описание дерева' : 'Описание цветков'}
                </label>
                <textarea value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  rows={3} className="input-field resize-none" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 justify-center">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
                {saving ? '🌸 Сохранение...' : isEdit ? 'Сохранить' : 'Добавить дерево'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
