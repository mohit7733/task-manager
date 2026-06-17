import axios from "axios";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://task-manager-i8ui.onrender.com/api"
});

export default publicClient;
