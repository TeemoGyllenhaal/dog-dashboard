import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Dán cấu hình Firebase của bạn vào đây (Chỉ cần API Key và Database URL là đủ)
const firebaseConfig = {
  apiKey: "AIzaSyAqP1J-wJzBjs5o4ZFXU4L26X46dtS9zRw",
  databaseURL: "https://iot-catdog-behavior-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Khởi tạo app và xuất đối tượng database
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);