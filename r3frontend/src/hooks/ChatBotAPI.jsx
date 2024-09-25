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
    // Extract only the answer and detected language from the response
    const { answer, detected_language } = response.data;
    // Return an object with just the answer and language
    return {
      answer,
      language: detected_language
    };
  } catch (error) {
    console.error("Error fetching chatbot response:", error);
    // Provide a generic error message
    throw new Error("Failed to get chatbot response. Please try again.");
  }
};

export const welcomeUser = async (name, sessionId) => {
  try {
    const response = await api.post('/welcome_user', { 
      name: name || null,  // Envoyez null si le nom n'est pas fourni
      session_id: sessionId
    });
    // Extrayez le message de bienvenue et la langue détectée de la réponse
    const { welcome_message } = response.data;
    console.log("message received in chatbot api is ",welcome_message);
    return { message: welcome_message };
  } catch (error) {
    console.error("Error fetching welcome message:", error);
    // Fournissez un message d'erreur générique
    throw new Error("Failed to get welcome message. Please try again.");
  }
};