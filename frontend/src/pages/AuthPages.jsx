import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Flower2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloraLogo from '../components/FloraLogo';
import PetalRain from '../components/PetalRain';

function AuthInput({ label, type = 'text', icon: Icon, value, onChange, error, placeholder }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-sm font-medium text-earth-700 mb-1">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field pl-10 ${error ? 'border-red-400 bg-red-50' : ''}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Некорректный email';
    if (!form.password) e.password = 'Введите пароль';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setServerError('');
    try {
      await login(form.email, form.password);
      navigate('/recognize');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Ошибка входа. Проверьте данные.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-flora-50 to-blossom-50 pt-16 px-4">
      <div className="blob absolute top-0 left-0 w-72 h-72 bg-flora-200 opacity-30 rounded-full" />
      <div className="blob blob-2 absolute bottom-0 right-0 w-96 h-96 bg-blossom-100 opacity-25 rounded-full" />
      <PetalRain count={10} />

      <div className="relative z-10 w-full max-w-md">
        <div className="card p-8 page-enter">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <FloraLogo size={56} />
            </Link>
            <h1 className="font-display font-bold text-2xl text-earth-800">Добро пожаловать!</h1>
            <p className="text-earth-400 text-sm mt-1">Войдите в свой аккаунт FloraBot</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Email" type="email" icon={Mail} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              error={errors.email} placeholder="your@email.com" />
            <AuthInput label="Пароль" type="password" icon={Lock} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              error={errors.password} placeholder="Ваш пароль" />

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><span className="animate-spin">🌸</span> Входим...</> : <>Войти</>}
            </button>
          </form>

          <p className="text-center text-sm text-earth-400 mt-6">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-flora-600 font-medium hover:text-flora-700 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Минимум 3 символа';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Некорректный email';
    if (!form.password || form.password.length < 6) e.password = 'Минимум 6 символов';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setServerError('');
    try {
      await register(form.username, form.email, form.password);
      navigate('/recognize');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(e => { mapped[e.path] = e.msg; });
        setErrors(mapped);
      } else {
        setServerError(err.response?.data?.error || 'Ошибка регистрации.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blossom-50 to-flora-50 pt-16 px-4 py-8">
      <div className="blob absolute -top-20 right-10 w-80 h-80 bg-blossom-200 opacity-25 rounded-full" />
      <div className="blob blob-3 absolute bottom-0 left-0 w-72 h-72 bg-flora-200 opacity-30 rounded-full" />
      <PetalRain count={10} />

      <div className="relative z-10 w-full max-w-md">
        <div className="card p-8 page-enter">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <FloraLogo size={56} />
            </Link>
            <h1 className="font-display font-bold text-2xl text-earth-800">Создать аккаунт</h1>
            <p className="text-earth-400 text-sm mt-1">Начните исследовать деревья вместе с FloraBot</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Имя пользователя" icon={User} value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              error={errors.username} placeholder="Ваш никнейм" />
            <AuthInput label="Email" type="email" icon={Mail} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              error={errors.email} placeholder="your@email.com" />
            <AuthInput label="Пароль" type="password" icon={Lock} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              error={errors.password} placeholder="Минимум 6 символов" />
            <AuthInput label="Подтвердите пароль" type="password" icon={Lock} value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              error={errors.confirm} placeholder="Повторите пароль" />

            <button type="submit" disabled={loading}
              className="btn-pink w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><span className="animate-spin">🌸</span> Регистрируем...</> : <><Flower2 size={18} /> Зарегистрироваться</>}
            </button>
          </form>

          <p className="text-center text-sm text-earth-400 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-flora-600 font-medium hover:text-flora-700 hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
