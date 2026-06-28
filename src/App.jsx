import { useState, useEffect, useRef } from 'react';
import { database } from './firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 🌟 IMPORT FILE THỐNG KÊ VÀO ĐÂY (Chú ý viết hoa chữ S nếu bạn đã đổi tên file)
import Statistic from './Statistic'; 

function App() {
  // 🌟 STATE QUẢN LÝ TAB (Mặc định mở trang realtime)
  const [currentTab, setCurrentTab] = useState('realtime'); 

  const [chartData, setChartData] = useState([]);
  const [currentData, setCurrentData] = useState({
    Accel_X: 0, Accel_Y: 0, Accel_Z: 0, Gyro_X: 0, Gyro_Y: 0, Gyro_Z: 0, Temperature: 0
  });
  const [fullHistory, setFullHistory] = useState([]);
  const [currentBehavior, setCurrentBehavior] = useState("Đang phân tích...");
  const behaviorRef = useRef(currentBehavior);

  useEffect(() => { behaviorRef.current = currentBehavior; }, [currentBehavior]);

  // Lắng nghe dữ liệu cảm biến
  useEffect(() => {
    const sensorRef = ref(database, 'Sensor');
    const recentDataQuery = query(sensorRef, limitToLast(1));
    const unsubscribe = onValue(recentDataQuery, (snapshot) => {
      const dataList = snapshot.val();
      if (dataList) {
        const latestKey = Object.keys(dataList)[0];
        const data = dataList[latestKey];
        setCurrentData(data);

        let timeLabel = ""; let dateLabel = "";
        if (data.Time && typeof data.Time === 'string') {
          const timeParts = data.Time.split(" "); 
          if (timeParts.length === 2) { dateLabel = timeParts[0]; timeLabel = timeParts[1]; }
        } else {
          const now = new Date();
          timeLabel = now.toLocaleTimeString('vi-VN', { hour12: false });
          dateLabel = now.toLocaleDateString('vi-VN');
        }
        
        const newDataPoint = {
          time: timeLabel, date: dateLabel,
          accelX: data.Accel_X, accelY: data.Accel_Y, accelZ: data.Accel_Z,
          gyroX: data.Gyro_X, gyroY: data.Gyro_Y, gyroZ: data.Gyro_Z,
          temp: data.Temperature, behavior: behaviorRef.current 
        };

        setChartData((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].time === timeLabel) {
            const updated = [...prev]; updated[updated.length - 1] = newDataPoint; return updated;
          } else {
            const updated = [...prev, newDataPoint]; return updated.length > 20 ? updated.slice(1) : updated;
          }
        });

        setFullHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].time === timeLabel) {
            const updated = [...prev]; updated[updated.length - 1] = newDataPoint; return updated;
          } else { return [...prev, newDataPoint]; }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Lắng nghe AI
  useEffect(() => {
    const aiRef = ref(database, 'AI_Prediction/Current');
    const unsubscribe = onValue(aiRef, (snapshot) => {
      const aiData = snapshot.val();
      if (aiData && aiData.Behavior) setCurrentBehavior(aiData.Behavior);
    });
    return () => unsubscribe();
  }, []);

  const exportToCSV = () => {
    if (fullHistory.length === 0) { alert("Chưa có dữ liệu để xuất!"); return; }
    const headers = ["Ngày", "Thời gian", "Gia tốc X", "Gia tốc Y", "Gia tốc Z", "Góc quay X", "Góc quay Y", "Góc quay Z", "Nhiệt độ", "Hành vi"];
    const csvContent = [
      headers.join(","),
      ...fullHistory.map(row => `${row.date},${row.time},${row.accelX},${row.accelY},${row.accelZ},${row.gyroX},${row.gyroY},${row.gyroZ},${row.temp},${row.behavior}`)
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", `DuLieu_${new Date().getTime()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getBehaviorUI = (behavior) => {
    const norm = behavior ? behavior.toLowerCase() : "";
    if (norm === "walking") return { bg: "from-green-500 to-teal-600", text: "🐕 Đi dạo (Walking)" };
    if (norm === "standing") return { bg: "from-amber-500 to-orange-600", text: "🦮 Đứng yên (Standing)" };
    if (norm === "sitting") return { bg: "from-blue-500 to-indigo-600", text: "🐕‍🦺 Ngồi (Sitting)" };
    if (norm === "body shake") return { bg: "from-red-500 to-rose-600", text: "📳 Lắc mình (Body Shake)" };
    if (norm === "lying down") return { bg: "from-slate-500 to-gray-600", text: "💤 Nằm (Lying down)" };
    return { bg: "from-purple-500 to-pink-600", text: `🐾 Đang nạp dữ liệu... (${behavior})` };
  };

  const currentUI = getBehaviorUI(currentBehavior);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center drop-shadow-sm">🐾 Dashboard Theo Dõi Hành Vi Thú Cưng</h1>

        {/* 🌟 THANH ĐIỀU HƯỚNG TAB 🌟 */}
        <div className="flex justify-center gap-4 mb-8 bg-white p-2 rounded-xl shadow-sm max-w-sm mx-auto border border-gray-200">
          <button 
            onClick={() => setCurrentTab('realtime')}
            className={`flex-1 font-bold py-2.5 px-4 rounded-lg transition-all duration-200 ${currentTab === 'realtime' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            🔴 Trực Tuyến
          </button>
          <button 
            onClick={() => setCurrentTab('statistics')}
            className={`flex-1 font-bold py-2.5 px-4 rounded-lg transition-all duration-200 ${currentTab === 'statistics' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            📈 Thống Kê Lớn
          </button>
        </div>

        {/* 🌟 ĐIỀU KIỆN RENDER GIAO DIỆN 🌟 */}
        {currentTab === 'realtime' ? (
          /* ================= GIAO DIỆN TRỰC TUYẾN ================= */
          <div className="animate-fade-in-up">
            <div className="flex justify-end mb-4">
              <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300">
                📥 Xuất CSV ({fullHistory.length} dòng)
              </button>
            </div>

            <div className={`bg-gradient-to-r ${currentUI.bg} p-8 rounded-2xl shadow-xl text-white mb-8 text-center`}>
              <p className="text-xs uppercase tracking-widest font-bold opacity-80">Trạng thái hành vi trực tuyến (Realtime AI)</p>
              <h2 className="text-5xl font-extrabold mt-3 drop-shadow-md">{currentUI.text}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500"><p className="text-sm text-gray-500 font-semibold">Gia tốc X</p><p className="text-2xl font-bold text-blue-600">{currentData.Accel_X?.toFixed(2) || 0}</p></div>
              <div className="bg-white p-4 rounded-xl shadow border-l-4 border-cyan-500"><p className="text-sm text-gray-500 font-semibold">Gia tốc Y</p><p className="text-2xl font-bold text-cyan-600">{currentData.Accel_Y?.toFixed(2) || 0}</p></div>
              <div className="bg-white p-4 rounded-xl shadow border-l-4 border-sky-500"><p className="text-sm text-gray-500 font-semibold">Gia tốc Z</p><p className="text-2xl font-bold text-sky-600">{currentData.Accel_Z?.toFixed(2) || 0}</p></div>
              <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500"><p className="text-sm text-gray-500 font-semibold">Nhiệt độ (°C)</p><p className="text-2xl font-bold text-orange-600">{currentData.Temperature?.toFixed(1) || 0}</p></div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow mt-6">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Biểu đồ chuyển động (Thời gian thực)</h2>
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accelX" stroke="#3b82f6" name="Gia tốc X" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="accelY" stroke="#06b6d4" name="Gia tốc Y" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="accelZ" stroke="#0ea5e9" name="Gia tốc Z" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          /* ================= GIAO DIỆN THỐNG KÊ LỚN ================= */
          <div className="animate-fade-in-up">
             <Statistic />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;