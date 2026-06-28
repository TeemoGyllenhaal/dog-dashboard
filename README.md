# 🐶 Dog Dashboard (Giao diện Yếm Thông minh IoT cho Chó)

Một trang web dashboard hiện đại, hiệu năng cao được xây dựng để theo dõi, trực quan hóa và phân tích dữ liệu từ các thiết bị yếm IoT cho chó (hướng tới các thiết kế phần cứng nhỏ gọn, tối ưu mức tiêu thụ điện năng thấp). Ứng dụng này cung cấp thông tin theo thời gian thực về các hoạt động của thú cưng, ứng dụng học máy (Machine Learning) để phân loại và theo dõi các mẫu hành vi một cách chính xác.

## ✨ Tính năng nổi bật

- **Theo dõi hoạt động:** Trực quan hóa các mức độ hoạt động hàng ngày (ngủ, đi bộ, chạy, sủa) được ghi nhận bởi các cảm biến trên yếm.
- **Phân tích dự đoán:** Tích hợp mô hình Học máy Random Forest để phân loại chính xác các mẫu hành vi phức tạp của chó.
- **Giao diện:** Thiết kế gọn gàng, thân thiện với người dùng, được tối ưu hóa cho cả trải nghiệm trên máy tính.
- **Tốc độ phát triển cực nhanh:** Cấu hình bằng Vite mang lại khả năng cập nhật module nóng (Hot Module Replacement - HMR) với tốc độ cao.

## 🛠️ Công nghệ sử dụng

- **Framework:** [React](https://react.dev/)
- **Trình đóng gói (Build Tool):** [Vite](https://vitejs.dev/)
- **Định dạng giao diện:** Tailwind CSS
- **Machine Learning:** Scikit-learn / Joblib (Mô hình Random Forest)

## 🧠 Huấn luyện Mô hình (Model Training)

Mã nguồn phục vụ cho quá trình khởi tạo, xử lý dữ liệu và huấn luyện mô hình học máy (Random Forest) được lưu trữ tách biệt khỏi giao diện người dùng. Bạn có thể tham khảo chi tiết các file code này tại đường dẫn sau:

🔗 **[Thư mục chứa Code Huấn luyện Mô hình (Google Drive)](https://drive.google.com/drive/folders/11OuBusf9dOXbK2M_wjNLVJ8mNedT0FEH?usp=sharing)**

*(Lưu ý: Do giới hạn về kích thước tệp của GitHub, file model đã được huấn luyện `.joblib` không được đẩy trực tiếp lên repository này. Vui lòng tải model về thư mục `src/` trước khi chạy dự án cục bộ).*

## 🚀 Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống

Đảm bảo rằng máy tính của bạn đã được cài đặt [Node.js](https://nodejs.org/).

### Các bước cài đặt

1. Clone repository về máy:
   ```bash
   git clone [https://github.com/TeemoGyllenhaal/dog-dashboard.git](https://github.com/TeemoGyllenhaal/dog-dashboard.git)
   ```


2. Di chuyển vào thư mục dự án:

    ```bash
    cd dog-dashboard
    ```
3. Cài đặt các thư viện phụ thuộc cho Node.js:

    ```bash
    npm install
    ```
4. Khởi chạy hệ thống:
Để ứng dụng hoạt động đầy đủ, bạn cần chạy song song cả giao diện web và script nhận diện hành vi. Vui lòng mở 2 cửa sổ Terminal riêng biệt và chạy lần lượt các lệnh sau:

- **Terminal 1 (Khởi chạy Giao diện Web):**

    ```bash
    npm run dev
    ```
- **Terminal 2 (Khởi chạy Script Nhận diện AI):**

    ```bash
    python run_detect.py
    ```


## Video minh họa

![Video minh họa](./doc/project_gau-gau-gau.mp4)

