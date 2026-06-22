import { Link } from 'react-router-dom';
import { Camera, BookOpen, Leaf, Sparkles, ArrowRight, TreePine, Flower2 } from 'lucide-react';
import PetalRain from '../components/PetalRain';
import FloraLogo from '../components/FloraLogo';
import useLazyReveal from '../hooks/useLazyReveal';

const FEATURES = [
  { icon: Camera, title: 'Фото или камера', desc: 'Загрузите фото или сделайте снимок прямо с телефона — ИИ мгновенно определит дерево по цветкам.', color: 'bg-blossom-50 text-blossom-600' },
  { icon: Sparkles, title: 'Yandex Vision ИИ', desc: 'Используем мощный Yandex Vision API для точного распознавания видов деревьев по форме и цвету цветков.', color: 'bg-flora-50 text-flora-600' },
  { icon: BookOpen, title: 'База знаний', desc: 'Подробный каталог деревьев с описаниями, временем цветения и ареалом распространения.', color: 'bg-amber-50 text-amber-600' },
  { icon: Leaf, title: 'История распознаваний', desc: 'Все ваши определения сохраняются. Добавляйте заметки и возвращайтесь к ним в любое время.', color: 'bg-emerald-50 text-emerald-600' },
];

const STATS = [
  { value: '8+', label: 'Видов деревьев' },
  { value: '99%', label: 'Точность ИИ' },
  { value: '0с', label: 'Время анализа' },
];

function FeatureCard({ icon: Icon, title, desc, color }) {
  const ref = useLazyReveal();
  return (
    <div ref={ref} className="lazy-reveal card p-6 hover:shadow-xl transition-shadow duration-300 group">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={22} />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2 text-earth-800">{title}</h3>
      <p className="text-earth-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const statsRef = useLazyReveal();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-flora-50 via-white to-blossom-50 pt-16">
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob absolute -top-20 -left-20 w-80 h-80 bg-flora-200 opacity-30 rounded-full" />
          <div className="blob blob-2 absolute top-1/3 -right-20 w-96 h-96 bg-blossom-200 opacity-25 rounded-full" />
          <div className="blob blob-3 absolute -bottom-20 left-1/3 w-72 h-72 bg-amber-100 opacity-30 rounded-full" />
        </div>

        {/* Floating animated icons */}
        <div className="absolute inset-0 pointer-events-none">
          <Flower2 size={32} className="absolute top-1/4 left-16 text-blossom-300 animate-float opacity-60" />
          <TreePine size={28} className="absolute top-1/3 right-20 text-flora-400 animate-float-slow opacity-50" />
          <Leaf size={24} className="absolute bottom-1/3 left-24 text-flora-300 animate-sway opacity-60" />
          <Flower2 size={20} className="absolute bottom-1/4 right-16 text-blossom-400 animate-float-fast opacity-50" />
          <Sparkles size={22} className="absolute top-20 right-1/3 text-amber-400 animate-pulse-soft opacity-60" />
        </div>

        {/* Petals */}
        <PetalRain count={20} />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto page-enter">
          {/* Custom logo icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-flora-200 rounded-full blur-2xl opacity-50 scale-150" />
              <FloraLogo size={96} className="relative drop-shadow-xl animate-float" />
            </div>
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl text-earth-800 mb-6 leading-tight">
            Flora<span className="text-flora-600">Bot</span>
          </h1>
          <p className="text-xl md:text-2xl text-earth-500 mb-4 font-light">
            Распознайте дерево по цветку за секунды
          </p>
          <p className="text-base text-earth-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Сфотографируйте цветущее дерево — наш ИИ на базе Yandex Vision определит вид, расскажет об особенностях и сохранит результат в вашем профиле.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/recognize" className="btn-pink text-base justify-center">
              <Camera size={20} /> Распознать дерево
            </Link>
            <Link to="/catalog" className="btn-secondary text-base justify-center">
              <BookOpen size={20} /> Смотреть каталог <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce text-earth-300">
          <span className="text-xs font-medium">Листайте вниз</span>
          <div className="w-px h-8 bg-gradient-to-b from-earth-200 to-transparent" />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-flora-600 py-12">
        <div ref={statsRef} className="lazy-reveal max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="font-display font-bold text-4xl text-white mb-1">{value}</div>
              <div className="text-flora-200 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-earth-800 mb-4">
              Всё для любителей природы
            </h2>
            <p className="text-earth-400 max-w-xl mx-auto">
              FloraBot сочетает передовой ИИ с удобным интерфейсом, чтобы каждая прогулка была познавательной.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-flora-600 to-flora-700 py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob absolute -top-10 left-10 w-40 h-40 bg-flora-500 opacity-40 rounded-full" />
          <div className="blob blob-2 absolute -bottom-10 right-10 w-60 h-60 bg-flora-800 opacity-30 rounded-full" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <Flower2 size={48} className="mx-auto mb-6 text-blossom-200 animate-float" />
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
            Начните исследовать прямо сейчас
          </h2>
          <p className="text-flora-100 mb-8 text-lg">
            Регистрация бесплатна. Начните определять деревья за считанные секунды.
          </p>
          <Link to="/register" className="bg-white text-flora-700 font-semibold px-8 py-4 rounded-2xl inline-flex items-center gap-2 hover:bg-flora-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95">
            <Sparkles size={20} /> Попробовать бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-earth-900 text-earth-300 py-10 text-center px-4">
        <div className="flex justify-center mb-4">
          <FloraLogo size={32} />
        </div>
        <p className="font-display text-lg text-white mb-1">FloraBot</p>
        <p className="text-sm text-earth-500">© 2024 FloraBot. Разработано с 🌸 и Yandex Vision AI.</p>
      </footer>
    </div>
  );
}
