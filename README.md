# AI-Powered Candidate Sourcing

An intelligent application that helps recruiters and hiring managers find qualified candidates on GitHub based on job descriptions. The app uses OpenAI's GPT API to analyze job requirements and GitHub's API to match candidates with relevant skills and experience.

## Features

- 🤖 AI-powered job description analysis
- 🔍 Smart candidate matching based on GitHub profiles
- 💡 Automatic skill extraction and matching
- 🎯 Intelligent candidate scoring and ranking
- ⚡ Real-time candidate suggestions
- 📱 Responsive and modern UI
- 🔄 Drag-and-drop candidate organization

## Prerequisites

Before running this application, you'll need:

1. An OpenAI API key
2. A GitHub Personal Access Token
3. Node.js 18 or higher

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GITHUB_TOKEN=your_github_token
```

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/candidate-sourcing-app.git

# Navigate to the project directory
cd candidate-sourcing-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Enter a job description in the text area
2. Click "Find Candidates" to start the search
3. Review candidate profiles
4. Swipe right or click the check button to accept candidates
5. Swipe left or click the X button to reject candidates
6. Reorder accepted candidates using drag and drop

## Technical Details

- Built with React + TypeScript
- Uses Vite for blazing fast development
- Styled with Tailwind CSS
- Animations powered by Framer Motion
- OpenAI GPT for intelligent analysis
- GitHub API for candidate sourcing

## Token Usage Optimization

The application implements several optimizations to manage API token usage:

- Uses GPT-3.5-turbo for less critical operations
- Caches processed candidates
- Implements tiered search strategy
- Sets daily token limits
- Optimizes prompt lengths

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.