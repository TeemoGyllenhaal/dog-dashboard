import { useState } from 'react';
import { database } from './firebase';
import { ref, get, query, limitToLast } from 'firebase/database';
// Bổ sung import BarChart, Bar, Cell từ recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Bảng màu cho biểu đồ hành vi
const COLORS = {
  "walking": "#10b981", // Xanh ngọc
  "standing": "#f59e0b", // Vàng cam
  "sitting": "#3b82f6", // Xanh dương
  "body shake": "#ef4444", // Đỏ
  "lying down": "#64748b", // Xám
  "N/A": "#cbd5e1" // Xám nhạt cho dữ liệu trống
};

function Statistic() {
  const [statsData, setStatsData] = useState([]);
  const [behaviorChartData, setBehaviorChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedRange, setSelectedRange] = useState('all'); // Giữ bộ lọc số lượng dòng
  const [timeFilter, setTimeFilter] = useState('all'); // BỘ LỌC MỚI: Theo ngày
  
  const [analytics, setAnalytics] = useState({
    total: 0, avgTemp: 0, maxAccelX: 0, maxAccelY: 0, maxAccelZ: 0,
  });

  const calculateAnalyticsAndBehaviors = (dataArray, filterDays) => {
    if (dataArray.length === 0) return;

    // 1. LỌC DỮ LIỆU THEO NGÀY (Nếu người dùng chọn)
    let filteredData = dataArray;
    if (filterDays !== 'all') {
      const now = new Date();
      const daysToSubtract = parseInt(filterDays);
      const pastDate = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
      
      filteredData = dataArray.filter(item => {
        // Chuyển chuỗi "2026-06-14" thành Date object để so sánh
        const itemDate = new Date(item.date);
        return itemDate >= pastDate;
      });
    }

    // 2. TÍNH TOÁN CÁC CHỈ SỐ NHANH
    const total = filteredData.length;
    let sumTemp = 0; let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
    const behaviorCounts = {}; // Biến đếm hành vi

    filteredData.forEach(item => {
      sumTemp += item.temp || 0;
      if (item.accelX > maxX) maxX = item.accelX;
      if (item.accelY > maxY) maxY = item.accelY;
      if (item.accelZ > maxZ) maxZ = item.accelZ;

      // 🌟 [ĐÃ CHỈNH SỬA] Đếm số lượng hành vi và BỎ QUA "n/a"
      const bhv = item.behavior ? item.behavior.toLowerCase() : "n/a";
      if (bhv !== "n/a") {
        behaviorCounts[bhv] = (behaviorCounts[bhv] || 0) + 1;
      }
    });

    setAnalytics({
      total: total,
      avgTemp: total > 0 ? (sumTemp / total).toFixed(1) : 0,
      maxAccelX: maxX !== -Infinity ? maxX.toFixed(2) : 0,
      maxAccelY: maxY !== -Infinity ? maxY.toFixed(2) : 0,
      maxAccelZ: maxZ !== -Infinity ? maxZ.toFixed(2) : 0,
    });

    // 3. ĐỊNH DẠNG DỮ LIỆU CHO BIỂU ĐỒ CỘT HÀNH VI
    const chartDataFormatted = Object.keys(behaviorCounts).map(key => ({
      name: key,
      count: behaviorCounts[key]
    })).sort((a, b) => b.count - a.count); // Sắp xếp từ cao xuống thấp

    setBehaviorChartData(chartDataFormatted);
  };

  const loadStatisticsData = async () => {
    setLoading(true);
    try {
      const sensorRef = ref(database, 'Sensor');
      let dataQuery = selectedRange === 'all' ? sensorRef : query(sensorRef, limitToLast(parseInt(selectedRange)));
      const snapshot = await get(dataQuery);

      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const formattedData = Object.keys(rawData).map(key => {
          const item = rawData[key];
          let timeLabel = "N/A"; let dateLabel = "N/A";
          if (item.Time && typeof item.Time === 'string') {
            const parts = item.Time.split(" ");
            if (parts.length === 2) { dateLabel = parts[0]; timeLabel = parts[1]; }
          }
          return {
            id: key, date: dateLabel, time: timeLabel,
            accelX: item.Accel_X || 0, accelY: item.Accel_Y || 0, accelZ: item.Accel_Z || 0,
            gyroX: item.Gyro_X || 0, gyroY: item.Gyro_Y || 0, gyroZ: item.Gyro_Z || 0,
            temp: item.Temperature || 0, 
            behavior: item.Behavior || "N/A" // Lấy trường Behavior từ Firebase
          };
        });
        
        setStatsData(formattedData);
        calculateAnalyticsAndBehaviors(formattedData, timeFilter); // Gọi hàm tính toán
      } else {
        alert("Không tìm thấy dữ liệu trên Firebase!");
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe sự thay đổi của bộ lọc thời gian để tính toán lại biểu đồ ngay lập tức
  const handleTimeFilterChange = (e) => {
    const newVal = e.target.value;
    setTimeFilter(newVal);
    if (statsData.length > 0) {
      calculateAnalyticsAndBehaviors(statsData, newVal);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow mt-4 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">📊 Phân Tích Lịch Sử & Hành Vi</h2>
      
      {/* KHU VỰC ĐIỀU KHIỂN KÉP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700 text-sm">Lấy dữ liệu:</label>
            <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} className="border-gray-300 rounded text-sm p-1.5 focus:ring-indigo-500">
              <option value="1000">1.000 dòng mới nhất</option>
              <option value="5000">5.000 dòng mới nhất</option>
              <option value="all">Toàn bộ database</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700 text-sm">Lọc theo thời gian:</label>
            <select value={timeFilter} onChange={handleTimeFilterChange} className="border-indigo-300 bg-indigo-50 text-indigo-700 font-bold rounded text-sm p-1.5 focus:ring-indigo-500">
              <option value="1">1 Ngày qua</option>
              <option value="2">2 Ngày qua</option>
              <option value="3">3 Ngày qua</option>
              <option value="all">Toàn thời gian</option>
            </select>
          </div>
        </div>

        <button onClick={loadStatisticsData} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md shadow transition duration-200 w-full md:w-auto">
          {loading ? '⏳ Đang kết xuất...' : '🚀 Chạy phân tích'}
        </button>
      </div>

      {/* THẺ THỐNG KÊ NHANH */}
      {statsData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-blue-50 p-3 rounded text-center border border-blue-100"><p className="text-xs text-gray-500 font-bold mb-1">MẪU HỢP LỆ</p><p className="text-xl font-black text-blue-700">{analytics.total}</p></div>
          <div className="bg-orange-50 p-3 rounded text-center border border-orange-100"><p className="text-xs text-gray-500 font-bold mb-1">NHIỆT ĐỘ TB</p><p className="text-xl font-black text-orange-700">{analytics.avgTemp} °C</p></div>
          <div className="bg-gray-50 p-3 rounded text-center border border-gray-200"><p className="text-xs text-gray-500 font-bold mb-1">MAX ACCEL X</p><p className="text-xl font-black text-gray-700">{analytics.maxAccelX}</p></div>
          <div className="bg-gray-50 p-3 rounded text-center border border-gray-200"><p className="text-xs text-gray-500 font-bold mb-1">MAX ACCEL Y</p><p className="text-xl font-black text-gray-700">{analytics.maxAccelY}</p></div>
          <div className="bg-gray-50 p-3 rounded text-center border border-gray-200"><p className="text-xs text-gray-500 font-bold mb-1">MAX ACCEL Z</p><p className="text-xl font-black text-gray-700">{analytics.maxAccelZ}</p></div>
        </div>
      )}

      {/* HAI BIỂU ĐỒ ĐẶT CẠNH NHAU KHI MÀN HÌNH LỚN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: BIỂU ĐỒ HÀNH VI (Chiếm 1/3) */}
        <div className="bg-gray-50 rounded-lg p-4 border lg:col-span-1 shadow-inner">
          <h3 className="font-bold text-gray-700 mb-4 text-center">Tần suất hành vi ({timeFilter === 'all' ? 'Toàn thời gian' : `${timeFilter} ngày qua`})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {behaviorChartData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={behaviorChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip cursor={{fill: '#e2e8f0'}} formatter={(value) => [`${value} lần`, 'Tần suất']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {behaviorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS["N/A"]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu hành vi</div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: BIỂU ĐỒ SENSOR (Chiếm 2/3) */}
        <div className="bg-gray-50 rounded-lg p-4 border lg:col-span-2 shadow-inner">
          <h3 className="font-bold text-gray-700 mb-4 text-center">Biến thiên thông số cảm biến</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {statsData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" hide={statsData.length > 200} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accelX" stroke="#3b82f6" name="Gia tốc X" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="accelY" stroke="#06b6d4" name="Gia tốc Y" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="accelZ" stroke="#0ea5e9" name="Gia tốc Z" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Bấm "Chạy phân tích" để xem</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Statistic;