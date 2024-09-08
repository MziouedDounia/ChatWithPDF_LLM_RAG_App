// ChatbotAPI.js
import axios from 'axios';

// Create an instance of axios with the base URL for the API
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Replace with your actual API endpoint
});

// Function to get chatbot response
export const getChatbotResponse = async (message) => {
  try {
    const response = await api.post('/chat',{message:message});// Adjust endpoint and payload as needed
    return response.data.answer; // Adjust based on the response structure of your API
  } catch (error) {
    console.error("Error fetching chatbot response:", error);
    throw error;
  }
};

  