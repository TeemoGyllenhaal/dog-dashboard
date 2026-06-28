import time
import collections
import lightgbm as lgb
import pandas as pd
import numpy as np
import firebase_admin
from firebase_admin import credentials, db

# ==========================================
# 1. CẤU HÌNH FIREBASE ADMIN SDK & MÔ HÌNH
# ==========================================
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://iot-catdog-behavior-default-rtdb.asia-southeast1.firebasedatabase.app'
})

import joblib

print("Đang nạp mô hình bằng joblib...")
model = joblib.load('random_forest_model.joblib') # Đổi lại tên file cho đúng


label_mapping = {
    0: "body shake",
    1: "lying down",
    2: "sitting",
    3: "standing",
    4:"walking",
}


feature_cols = [
    'Back.Acc.X', 'Back.Acc.Y', 'Back.Acc.Z',
    'Back.Gyr.X', 'Back.Gyr.Y', 'Back.Gyr.Z',
]

# ==========================================
# 2. HÀM CHUẨN BỊ DỮ LIỆU CHO 1 FRAME
# ==========================================
def prepare_frame_features(sensor_data):
    """
    Kết hợp 1 khung dữ liệu cảm biến thô và hồ sơ tĩnh thành 1 dòng 38 cột.
    """
    # 1. Đổi tên các trục cảm biến cho khớp với model
    mapped_sensor = {
        'Back.Acc.X': sensor_data.get('Accel_X', 0.0),
        'Back.Acc.Y': sensor_data.get('Accel_Y', 0.0),
        'Back.Acc.Z': sensor_data.get('Accel_Z', 0.0),
        'Back.Gyr.X': sensor_data.get('Gyro_X', 0.0),
        'Back.Gyr.Y': sensor_data.get('Gyro_Y', 0.0),
        'Back.Gyr.Z': sensor_data.get('Gyro_Z', 0.0)
    }
    
    # 2. Gộp cảm biến và dữ liệu tĩnh (static_profile)
    # Lưu ý: Giả định static_profile là 1 dictionary chứa 32 thông số còn lại.
    final_input = {**mapped_sensor}
    
    # 3. Chuyển thành DataFrame 1 dòng với đúng thứ tự cột
    df_final = pd.DataFrame([final_input], columns=feature_cols)
    
    # Fill NaN bằng 0 để tránh lỗi model
    df_final = df_final.fillna(0)
    
    return df_final

# ==========================================
# 3. VÒNG LẶP XỬ LÝ THEO THỜI GIAN THỰC
# ==========================================
print("Bắt đầu theo dõi dữ liệu từ Firebase và Bầu chọn (Voting)...")

VOTE_SIZE = 5  # Số lượng dự đoán cần gom để bầu chọn
vote_buffer = [] 
push_id_buffer = [] # 🌟 [MỚI] Thêm bộ đệm để lưu lại mã ID của 5 khung dữ liệu
last_processed_id = None

while True:
    try:
        # Lấy 10 bản ghi mới nhất
        snapshot = db.reference('Sensor').order_by_key().limit_to_last(10).get()
        
        if snapshot:
            for push_id, sensor_data in snapshot.items():
                if last_processed_id and push_id <= last_processed_id:
                    continue
                
                last_processed_id = push_id
                
                # 1. Trích xuất đặc trưng
                df_input = prepare_frame_features(sensor_data)
                
                # 2. Model dự đoán
                predictions = model.predict(df_input)
                predicted_numeric_label = int(predictions[0])
                behavior = label_mapping.get(predicted_numeric_label, "Unknown")
                
                # 3. Đưa kết quả và ID vào bộ đệm
                vote_buffer.append(behavior)
                push_id_buffer.append(push_id) # 🌟 [MỚI] Lưu lại push_id của dòng này
                
                # 4. KIỂM TRA BẦU CHỌN
                if len(vote_buffer) >= VOTE_SIZE:
                    vote_counts = collections.Counter(vote_buffer)
                    final_behavior = vote_counts.most_common(1)[0][0]
                    
                    print(f"[*] [Bầu chọn {VOTE_SIZE} frames] AI: {final_behavior}")
                    
                    # 4.1 Cập nhật kết quả Realtime
                    db.reference('AI_Prediction/Current').set({
                        'Behavior': final_behavior,
                        'Timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                    })
                    
                    # 🌟 4.2 [MỚI] LƯU NHÃN HÀNH VI VÀO LỊCH SỬ CẢM BIẾN
                    # Tạo một gói cập nhật để gắn nhãn cho cả 5 dòng dữ liệu cùng lúc
                    updates = {}
                    for pid in push_id_buffer:
                        updates[f"{pid}/Behavior"] = final_behavior
                    
                    # Gửi lệnh update lên Firebase
                    db.reference('Sensor').update(updates)
                    
                    # 4.3 Xóa bộ đệm để bắt đầu chu kỳ mới
                    vote_buffer.clear()
                    push_id_buffer.clear() # 🌟 [MỚI] Xóa buffer ID

    except Exception as e:
        print(f"[!] Lỗi: {e}")

    time.sleep(0.1)