import axios from 'axios';

// Create an instance of axios with the base URL for the API
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Replace with your actual API endpoint
});

// Function to get chatbot response
export const getChatbotResponse = async (message) => {
  try {
    // Get the session ID from localStorage (if available)
    let sessionId = localStorage.getItem('chatbotSessionId');

    // If no session ID, create a new session
    if (!sessionId) {
      sessionId = await createNewSession();
      // Save the new session ID in localStorage for future use
      localStorage.setItem('chatbotSessionId', sessionId);
    }

    // Send the message along with the session ID to the API
    const response = await api.post('/chat', {
      message: message,
      session_id: sessionId, // Include the session ID in the request payload
    });

    // Check if session has expired and handle it
    if (response.data.status === 'session_expired') {
      console.warn("Session expired, creating a new session...");

      // Clear expired session ID
      localStorage.removeItem('chatbotSessionId');
      
      // Create a new session
      sessionId = await createNewSession();
      
      // Save the new session ID in localStorage
      localStorage.setItem('chatbotSessionId', sessionId);
      
      // Retry the request with the new session ID
      const retryResponse = await api.post('/chat', {
        message: message,
        session_id: sessionId,
      });

      return retryResponse.data.answer;
    }

    return response.data.answer; // Adjust based on the response structure of your API
  } catch (error) {
    console.error("Error fetching chatbot response:", error);
    throw error;
  }
};

// Function to create a new session
const createNewSession = async () => {
  try {
    const response = await api.post('/start_session');
    return response.data.session_id; // Assuming the session_id is returned from the API
  } catch (error) {
    console.error("Error creating new session:", error);
    throw error;
  }
};
