import joblib

# 1. Load mô hình
model = joblib.load('random_forest_model.joblib')

# 2. Lấy danh sách các tính năng
try:
    expected_features = model.feature_names_in_
    print("Mô hình Scikit-learn mong đợi các cột sau (theo đúng thứ tự):")
    for i, col in enumerate(expected_features):
        print(f"{i}: {col}")
        
    # Chuyển thành list nếu bạn muốn dùng để kiểm tra DataFrame đầu vào
    feature_cols = list(expected_features)
    
except AttributeError:
    print("Mô hình này được huấn luyện bằng Numpy Array, không có tên cột được lưu lại.")