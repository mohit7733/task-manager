import axios from "axios";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://meetingmanager.aimantra.info/api"
});

export default publicClient;
