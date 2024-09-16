import axios from 'axios';

// Create an instance of axios with the base URL for the API
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Replace with your actual API endpoint
});

// Function to start a new session
export const startSession = async () => {
  try {
    const response = await api.post('/start_session');
    return response.data.session_id;
  } catch (error) {
    console.error("Error starting session:", error);
    throw error;
  }
};

// Function to get chatbot response
export const getChatbotResponse = async (message, sessionId) => {
  try {
    const response = await api.post('/chat', { 
      message: message,
      session_id: sessionId
    });
    return response.data.answer; // Adjust based on the response structure of your API
  } catch (error) {
    console.error("Error fetching chatbot response:", error);
    throw error;
  }
};