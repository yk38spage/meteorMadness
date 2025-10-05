import axios from 'axios';

// const API_BASE = 'http://127.0.0.1:8000/api'; // Vite proxy kullanacağız
const API_BASE = import.meta.env.VITE_API_URL; // Vite proxy kullanacağız

export const fetchAsteroids = async () => {
  try {
    const response = await axios.get(`${API_BASE}/asteroids`);
    return response.data;
  } catch (error) {
    console.error('Error fetching asteroids:', error);
    throw error;
  }
};

export const simulateImpact = async (params) => {
  try {
    const response = await axios.post(`${API_BASE}/simulate`, params);
    return response.data;
  } catch (error) {
    console.error('Error simulating impact:', error);
    throw error;
  }
};

export const evaluateMitigation = async (params) => {
  try {
    const response = await axios.post(`${API_BASE}/mitigate`, params);
    return response.data;
  } catch (error) {
    console.error('Error evaluating mitigation:', error);
    throw error;
  }
};
