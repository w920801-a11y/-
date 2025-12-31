
import React, { useState, useCallback, useEffect } from 'react';
import { Location, SearchResult, Restaurant } from './types';
import { findNearbyRestaurants } from './services/geminiService';
import RestaurantCard from './components/RestaurantCard';
import MapView from './components/MapView';

const App: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [isConfigMissing, setIsConfigMissing] = useState<boolean>(false);

  useEffect(() => {
    // 檢查 API 金鑰是否存在
    if (!process.env.API_KEY || process.env.API_KEY === "") {
      setIsConfigMissing(true);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (isConfigMissing) return;

    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("您的瀏覽器不支援定位功能。");
      setLoading(false);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(coords);
        fetchRestaurants(coords);
      },
      (err) => {
        console.error("定位錯誤:", err);
        let msg = "無法取得您的位置。";
        if (err.code === 1) msg = "請允許網站存取您的位置資訊。";
        if (err.code === 3) msg = "定位逾時。";
        setError(msg);
        setLoading(false);
      },
      geoOptions
    );
  }, [isConfigMissing]);

  const fetchRestaurants = async (coords: Location) => {
    try {
      setLoading(true);
      setError(null);
      const searchResult = await findNearbyRestaurants(coords);
      setResults(searchResult);
    } catch (err: any) {
      setError(err.message || "搜尋餐廳失敗。");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (restaurant: Restaurant) => {
    setActiveTab('list');
    const element = document.getElementById(`res-${restaurant.name}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2');
        setTimeout(() => element.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2'), 2000);
    }
  };

  // 如果缺少 API Key，顯示引導畫面
  if (isConfigMissing) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="inline-flex p-4 bg-red-500/20 rounded-full">
            <i className="fas fa-key text-4xl text-red-500"></i>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tight">環境變數未設定</h1>
            <p className="text-slate-400 leading-relaxed">
              檢測到您的環境中缺少 <code className="bg-slate-800 px-2 py-1 rounded text-orange-400">API_KEY</code>。<br/>
              這是為了保護您的金鑰不被公開洩漏。
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-left space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <i className="fas fa-lightbulb text-yellow-400"></i> 如何修復？
            </h2>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>建議將此專案部屬至 <b>Vercel</b> 或 <b>Netlify</b>。</li>
              <li>在部屬平台的 <b>Environment Variables</b> 中新增 <code className="text-white">API_KEY</code>。</li>
              <li>填入您從 Google AI Studio 獲得的金鑰。</li>
            </ol>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            安全提示：請勿將金鑰直接寫死在程式碼中上傳至 GitHub。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-3 px-6 shrink-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl shadow-md">
              <i className="fas fa-location-dot text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-none">
                NearBite
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">精準美食探索</p>
            </div>
          </div>
          <div className="flex gap-2">
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crosshairs"></i>}
                {location ? "重新定位" : "探索附近"}
              </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {!location && !loading && !error && (
          <div className="absolute inset-0 z-40 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-utensils text-4xl text-orange-500"></i>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">肚子餓了嗎？</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  點擊下方按鈕，我們將使用 AI 為您尋找半徑 2km 內最精準的美食推薦。
                </p>
              </div>
              <button
                onClick={getCurrentLocation}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200 active:scale-95"
              >
                開始精準定位
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-40 bg-slate-50/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-4 text-center p-6">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                <i className="fas fa-crosshairs absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500"></i>
             </div>
             <p className="text-slate-700 font-bold">正在鎖定高精度位置...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-40 bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center space-y-6">
              <i className="fas fa-circle-exclamation text-5xl text-red-400"></i>
              <p className="text-slate-500 text-sm">{error}</p>
              <button
                onClick={getCurrentLocation}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                重試定位
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
          <section className={`flex-1 md:w-[400px] lg:w-[450px] flex flex-col bg-white border-r border-slate-200 h-full overflow-hidden transition-all duration-300 ${activeTab === 'map' ? 'hidden md:flex' : 'flex'}`}>
            <div className="md:hidden flex p-2 bg-slate-100 m-4 rounded-xl shrink-0">
               <button onClick={() => setActiveTab('list')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>清單</button>
               <button onClick={() => setActiveTab('map')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>地圖</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 scroll-smooth">
              {results ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI 精選建議</h2>
                    <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{results.text.split('[')[0].trim()}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pb-10">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      附近美食列表
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{results.restaurants.length} 間餐廳</span>
                    </h2>
                    <div className="grid gap-4">
                      {results.restaurants.map((res, idx) => (
                        <div id={`res-${res.name}`} key={`${res.name}-${idx}`}>
                           <RestaurantCard restaurant={res} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-3">
                  <i className="fas fa-map-pin text-4xl"></i>
                  <p className="text-sm font-medium">請開始搜尋以查看結果</p>
                </div>
              )}
            </div>
          </section>

          <section className={`flex-[1.5] relative h-full transition-all duration-300 ${activeTab === 'list' ? 'hidden md:block' : 'block'}`}>
            <button onClick={() => setActiveTab('list')} className="md:hidden absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-xl text-slate-800 border border-slate-200">
              <i className="fas fa-list"></i>
            </button>
            {location ? (
              <MapView userLocation={location} restaurants={results?.restaurants || []} onMarkerClick={handleMarkerClick} />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm">
                 等待定位資訊...
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
