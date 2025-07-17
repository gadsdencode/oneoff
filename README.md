# Azure AI Chat Application

A modern, futuristic chat interface powered by Azure AI with real-time streaming responses.

## Features

- **Azure AI Integration**: Real-time chat with Azure AI models
- **Streaming Responses**: See AI responses as they're generated
- **Modern UI**: Beautiful, futuristic chat interface with particles and animations
- **Error Handling**: Graceful error handling with user feedback
- **Configuration**: Easy setup through environment variables

## Getting Started

### Prerequisites

1. Node.js (v16 or higher)
2. Azure AI Model Deployment

### Azure AI Setup

1. **Deploy your model in Azure AI Studio:**
   - Go to Azure AI Studio
   - Deploy a model (e.g., Ministral-3B)
   - Get your endpoint URL and API key from the Deployments page

2. **Configure environment variables:**
   ```bash
   cp env.template .env
   ```
   
   Update `.env` with your Azure AI credentials:
   ```bash
   VITE_AZURE_AI_ENDPOINT=https://ai-foundryv1.services.ai.azure.com/models
   VITE_AZURE_AI_API_KEY=your_actual_api_key_here
   VITE_AZURE_AI_MODEL_NAME=Ministral-3B
   ```

### Installation & Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Architecture

- **React 18** with TypeScript
- **Azure AI Inference SDK** for chat completions
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Vite** for development and building

## Configuration

The application uses environment variables for Azure AI configuration:

- `VITE_AZURE_AI_ENDPOINT`: Your Azure AI endpoint URL
- `VITE_AZURE_AI_API_KEY`: Your Azure AI API key
- `VITE_AZURE_AI_MODEL_NAME`: The model name (defaults to Ministral-3B)

## Usage

1. Start the application
2. Check the settings modal to verify Azure AI connection
3. Start chatting with the AI assistant
4. Toggle streaming mode in settings for different response experiences