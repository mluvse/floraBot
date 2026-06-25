import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Camera, Upload, Loader2, Leaf, X, ChevronDown, ChevronUp, AlertTriangle, PlusCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RecognizePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('upload');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState(-1);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Пожалуйста, загрузите изображение'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Файл слишком большой (макс. 10 MB)'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API}/api/recognition/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при распознавании');
    } finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraActive(true);
    } catch { setError('Не удалось получить доступ к камере'); }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    uploadBase64(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const uploadBase64 = async (dataUrl) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/recognition/analyze-base64`,
        { imageBase64: dataUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при распознавании');
    } finally { setLoading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError('');
    setNotes('');
    setExpandedVariant(-1);
  };

  const saveNotes = async () => {
    if (!result?.history_id || !notes.trim()) return;
    setSavingNotes(true);
    try {
      await axios.patch(`${API}/api/history/${result.history_id}/notes`,
        { notes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch {} finally { setSavingNotes(false); }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-flora-900 mb-2">🌸 Распознать дерево</h1>
        <p className="text-flora-600">Загрузите фото цветущего дерева или сделайте снимок с камеры</p>
      </div>

      {/* Mode tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <button onClick={() => { setMode('upload'); reset(); }}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all ${mode === 'upload' ? 'bg-flora-500 text-white shadow-lg' : 'bg-white text-flora-700 hover:bg-flora-50'}`}>
          <Upload className="w-4 h-4 inline mr-2" />Загрузить файл
        </button>
        <button onClick={() => { setMode('camera'); reset(); }}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all ${mode === 'camera' ? 'bg-flora-500 text-white shadow-lg' : 'bg-white text-flora-700 hover:bg-flora-50'}`}>
          <Camera className="w-4 h-4 inline mr-2" />Камера
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && !preview && (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card p-12 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
            dragging ? 'border-flora-500 bg-flora-50 scale-[1.02]' : 'border-flora-200 hover:border-flora-400 hover:bg-flora-50/50'
          }`}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          <Upload className="w-12 h-12 text-flora-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-flora-800 mb-1">Перетащите фото или нажмите для выбора</p>
          <p className="text-sm text-flora-500">JPG, PNG, WEBP · до 10 MB</p>
        </div>
      )}

      {/* Camera mode */}
      {mode === 'camera' && !preview && (
        <div className="card overflow-hidden">
          {!cameraActive && (
            <div className="p-12 text-center">
              <Camera className="w-12 h-12 text-flora-400 mx-auto mb-4" />
              <button onClick={startCamera} className="btn-primary">Запустить камеру</button>
            </div>
          )}
          {cameraActive && (
            <div className="relative">
              <video ref={videoRef} className="w-full aspect-[4/3] object-cover bg-black" playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-flora-500 shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-flora-500" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="card p-6 text-center">
          <img src={preview} alt="Preview" className="w-full max-h-96 object-contain rounded-xl mb-4" />
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 justify-center">
              <AlertTriangle className="w-5 h-5" />{error}
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-3 text-flora-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Анализируем изображение...</span>
            </div>
          )}
          <button onClick={reset} className="mt-4 text-flora-500 hover:text-flora-700 flex items-center gap-1 mx-auto">
            <X className="w-4 h-4" />Отмена
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Photo */}
          <div className="card p-4">
            <img src={`${API}${result.image_url}`} alt="Uploaded" className="w-full max-h-80 object-contain rounded-xl" />
          </div>

          {/* Main result */}
          <div className={`card p-6 ${result.is_unknown ? 'border-amber-300 bg-amber-50/30' : ''}`}>
            {result.is_demo && (
              <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Демо-режим: настройте Pl@ntNet API для реального распознавания
              </div>
            )}
            {result.is_unknown && !result.is_demo && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Это растение не найдено в нашем каталоге. Показан лучший вариант от ИИ.
              </div>
            )}

            {/* Best match */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-flora-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-8 h-8 text-flora-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-flora-500 mb-1">
                  {result.is_unknown ? 'Возможно, это (не в каталоге)' : 'Определено'}
                </p>
                <h2 className="text-2xl font-bold text-flora-900">
                  {result.tree?.name_ru || result.variants?.[0]?.name || 'Неизвестное растение'}
                </h2>
                <p className="text-flora-600 italic">
                  {result.tree?.name_latin || result.variants?.[0]?.latin || ''}
                </p>
                <p className="text-sm text-flora-500 mt-1">
                  Семейство: {result.tree?.family || result.variants?.[0]?.family || '—'}
                </p>
                {result.tree?.bloom_season && (
                  <p className="text-sm text-flora-500 mt-1">
                    Цветение: {result.tree.bloom_season}
                  </p>
                )}
                {!result.tree && result.variants?.[0]?.commonNames?.length > 0 && (
                  <p className="text-sm text-flora-500 mt-1">
                    Также известно как: {result.variants[0].commonNames.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                  result.confidence > 80 ? 'bg-green-100 text-green-700' :
                  result.confidence > 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {result.confidence}% уверенность
                </div>
                {result.is_unknown && !result.is_demo && (
                  <span className="block mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    не в каталоге
                  </span>
                )}
              </div>
            </div>

            {/* Tree details if in catalog */}
            {result.tree && (
              <div className="bg-white rounded-xl p-4 mb-4 border border-flora-100">
                {result.tree.bloom_season && (
                  <p className="text-sm text-flora-600 mb-2">
                    <span className="font-medium">Цветение:</span> {result.tree.bloom_season}
                  </p>
                )}
                {result.tree.flower_description && (
                  <p className="text-sm text-flora-600">
                    <span className="font-medium">Описание цветков:</span> {result.tree.flower_description}
                  </p>
                )}
                <a href={`/catalog/${result.tree.id}`} className="inline-flex items-center gap-1 text-flora-600 hover:text-flora-800 text-sm mt-3 font-medium">
                  Подробнее в каталоге →
                </a>
              </div>
            )}

            {/* If NOT in catalog - show info from Pl@ntNet + add button */}
            {!result.tree && result.variants?.[0] && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <span className="font-medium">Это растение пока не добавлено в наш каталог.</span>
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Научное название:</span> {result.variants[0].latin}
                </p>
                {result.variants[0].commonNames?.length > 0 && (
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Известно как:</span> {result.variants[0].commonNames.join(', ')}
                  </p>
                )}
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Семейство:</span> {result.variants[0].family}
                </p>
                <a href="/catalog/new" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Добавить в каталог
                </a>
              </div>
            )}

            {/* All variants */}
            {result.variants && result.variants.length > 1 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-flora-700 mb-3">Другие варианты:</p>
                <div className="space-y-2">
                  {result.variants.slice(1).map((v, i) => (
                    <div key={i} className={`rounded-xl border transition-all ${
                      expandedVariant === i + 1 ? 'border-flora-300 bg-flora-50/50' : 'border-flora-100 bg-white hover:border-flora-200'
                    }`}>
                      <button
                        onClick={() => setExpandedVariant(expandedVariant === i + 1 ? -1 : i + 1)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            v.confidence > 70 ? 'bg-green-100 text-green-700' :
                            v.confidence > 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {v.confidence}%
                          </span>
                          <div>
                            <p className="font-medium text-flora-800 text-sm">{v.name}</p>
                            <p className="text-xs text-flora-500 italic">{v.latin}</p>
                          </div>
                          {!v.inCatalog && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">не в каталоге</span>
                          )}
                        </div>
                        {expandedVariant === i + 1 ? <ChevronUp className="w-4 h-4 text-flora-400" /> : <ChevronDown className="w-4 h-4 text-flora-400" />}
                      </button>
                      {expandedVariant === i + 1 && (
                        <div className="px-4 pb-3 pt-1 border-t border-flora-100">
                          <p className="text-xs text-flora-600 mb-1">Семейство: {v.family}</p>
                          {v.commonNames?.length > 0 && (
                            <p className="text-xs text-flora-500">Также известно как: {v.commonNames.join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-6 pt-4 border-t border-flora-100">
              <label className="text-sm font-medium text-flora-700 mb-2 block">📝 Ваши заметки</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Где сфотографировали? Какие впечатления?"
                className="w-full px-4 py-3 rounded-xl border border-flora-200 focus:border-flora-400 focus:ring-2 focus:ring-flora-100 outline-none resize-none text-sm"
                rows={3}
              />
              {result.history_id && (
                <button onClick={saveNotes} disabled={savingNotes || !notes.trim()}
                  className="mt-2 px-4 py-2 bg-flora-500 text-white rounded-lg text-sm font-medium hover:bg-flora-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingNotes ? 'Сохранение...' : 'Сохранить заметку'}
                </button>
              )}
            </div>
          </div>

          <button onClick={reset} className="w-full py-3 bg-white border-2 border-flora-200 text-flora-700 rounded-xl font-medium hover:bg-flora-50 transition-colors">
            🔄 Распознать другое фото
          </button>
        </div>
      )}
    </div>
  );
}
