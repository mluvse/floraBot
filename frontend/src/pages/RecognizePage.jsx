import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Sparkles, CheckCircle, AlertCircle, Leaf, RefreshCw, Info } from 'lucide-react';
import axios from '../api.js';
import { useAuth } from '../context/AuthContext';
import PetalRain from '../components/PetalRain';

const API = '/api';

export default function RecognizePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-flora-50 to-blossom-50 pt-16 px-4">
        <div className="card p-10 text-center max-w-md">
          <Leaf size={48} className="mx-auto text-flora-400 mb-4 animate-float" />
          <h2 className="font-display font-bold text-2xl text-earth-800 mb-3">Войдите, чтобы распознавать</h2>
          <p className="text-earth-400 mb-6">Распознавание деревьев доступно только для авторизованных пользователей.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="btn-primary">Войти</Link>
            <Link to="/register" className="btn-secondary">Регистрация</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) { setError('Пожалуйста, выберите изображение.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('Файл слишком большой. Максимум 10 MB.'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setError('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    setFile({ isBase64: true, data: dataUrl });
    setResult(null);
    setError('');
    stopCamera();
  };

  const analyze = async () => {
    if (!file) { setError('Загрузите или сделайте фото'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      let res;
      if (file.isBase64) {
        res = await axios.post(`${API}/recognition/analyze-base64`, { imageBase64: file.data });
      } else {
        const fd = new FormData();
        fd.append('image', file);
        res = await axios.post(`${API}/recognition/analyze`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при распознавании. Попробуйте ещё раз.');
    } finally { setLoading(false); }
  };

  const saveNotes = async () => {
    if (!result?.history_id) return;
    try {
      await axios.patch(`${API}/history/${result.history_id}/notes`, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch {}
  };

  const reset = () => {
    setPreview(null); setFile(null); setResult(null); setError(''); setNotes(''); setNotesSaved(false);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-flora-50 via-white to-blossom-50 pt-20 pb-12 px-4 relative overflow-hidden">
      <div className="blob absolute top-0 right-0 w-80 h-80 bg-blossom-100 opacity-30 rounded-full" />
      <div className="blob blob-2 absolute bottom-0 left-0 w-96 h-96 bg-flora-100 opacity-25 rounded-full" />
      <PetalRain count={8} />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8 page-enter">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-earth-800 mb-2">
            🌸 Распознать дерево
          </h1>
          <p className="text-earth-400">Загрузите фото цветущего дерева или сделайте снимок с камеры</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-flora-100">
          <button
            onClick={() => { setMode('upload'); stopCamera(); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              mode === 'upload' ? 'bg-flora-600 text-white shadow-md' : 'text-earth-500 hover:bg-flora-50'
            }`}
          >
            <Upload size={16} /> Загрузить фото
          </button>
          <button
            onClick={() => { setMode('camera'); reset(); startCamera(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              mode === 'camera' ? 'bg-blossom-500 text-white shadow-md' : 'text-earth-500 hover:bg-blossom-50'
            }`}
          >
            <Camera size={16} /> Камера
          </button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && !preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`card p-12 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
              dragging ? 'border-flora-500 bg-flora-50 scale-[1.02]' : 'border-flora-200 hover:border-flora-400 hover:bg-flora-50/50'
            }`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <Upload size={48} className={`mx-auto mb-4 transition-colors ${dragging ? 'text-flora-500' : 'text-flora-300'}`} />
            <p className="font-medium text-earth-600 mb-1">Перетащите фото или нажмите для выбора</p>
            <p className="text-sm text-earth-400">JPG, PNG, WEBP · до 10 MB</p>
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && !preview && (
          <div className="card overflow-hidden">
            <div className="relative bg-earth-900 aspect-[4/3]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-60">Запуск камеры...</p>
                  </div>
                </div>
              )}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-2xl" />
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blossom-400 rounded-tl" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blossom-400 rounded-tr" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blossom-400 rounded-bl" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blossom-400 rounded-br" />
                </div>
              )}
            </div>
            {cameraActive && (
              <div className="p-4 flex justify-center">
                <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-blossom-400 hover:border-blossom-500 shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blossom-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && !result && (
          <div className="card overflow-hidden page-enter">
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-80 object-cover" />
              <button onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-earth-900/60 text-white flex items-center justify-center hover:bg-earth-900/80 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <button onClick={analyze} disabled={loading}
                className="btn-pink w-full justify-center text-base disabled:opacity-60">
                {loading
                  ? <><span className="animate-spin text-xl">🌸</span> Анализируем...</>
                  : <><Sparkles size={20} /> Определить дерево</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 page-enter">
            <div className="card overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-flora-600 to-flora-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={24} className="text-flora-200" />
                  <h2 className="font-display font-bold text-xl">Результат распознавания</h2>
                </div>
                {result.is_demo && (
                  <div className="flex items-center gap-2 text-flora-100 text-xs bg-flora-800/40 rounded-lg px-3 py-1.5 mt-2">
                    <Info size={12} /> Демо-режим: настройте Yandex Vision API для реального распознавания
                  </div>
                )}
              </div>

              {/* Photo + result */}
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative">
                  <img src={preview} alt="Analyzed" className="w-full h-56 object-cover" />
                  {/* Confidence */}
                  <div className="absolute bottom-3 left-3 right-3 bg-earth-900/70 backdrop-blur-sm rounded-xl px-3 py-2">
                    <div className="flex justify-between text-white text-xs mb-1 font-medium">
                      <span>Уверенность ИИ</span>
                      <span>{result.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-earth-600 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full confidence-bar"
                        style={{
                          '--target-width': `${result.confidence}%`,
                          background: result.confidence > 80 ? '#22c55e' : result.confidence > 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="badge bg-flora-100 text-flora-700 mb-3">
                    <Leaf size={12} className="mr-1" /> Определено
                  </div>
                  <h3 className="font-display font-bold text-2xl text-earth-800 mb-1">
                    {result.tree?.name_ru}
                  </h3>
                  <p className="text-earth-400 text-sm italic mb-3">{result.tree?.name_latin}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-earth-400">Семейство:</span> <span className="font-medium text-earth-700">{result.tree?.family}</span></div>
                    <div><span className="text-earth-400">Цветение:</span> <span className="font-medium text-earth-700">{result.tree?.bloom_season}</span></div>
                  </div>
                </div>
              </div>

              {result.tree?.flower_description && (
                <div className="px-6 pb-4 border-t border-flora-50 pt-4">
                  <p className="text-sm text-earth-500 leading-relaxed">
                    <span className="font-medium text-earth-700">Описание цветков: </span>
                    {result.tree.flower_description}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="px-6 pb-6">
                <label className="block text-sm font-medium text-earth-700 mb-2">📝 Ваши заметки</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Где нашли это дерево? Особые наблюдения..."
                  rows={3}
                  className="input-field resize-none"
                />
                <div className="flex gap-3 mt-3">
                  <button onClick={saveNotes} className="btn-secondary !py-2 !px-4 text-sm flex-1 justify-center">
                    {notesSaved ? <><CheckCircle size={16} className="text-green-500" /> Сохранено!</> : 'Сохранить заметку'}
                  </button>
                  <Link to={`/catalog/${result.tree?.id}`} className="btn-primary !py-2 !px-4 text-sm">
                    Подробнее
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">
                <RefreshCw size={16} /> Новое фото
              </button>
              <Link to="/profile" className="btn-primary flex-1 justify-center">
                История распознаваний
              </Link>
            </div>
          </div>
        )}

        {error && !preview && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
