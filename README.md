# CalmSpace - AI-Powered Journaling Platform

![CalmSpace Logo](frontend/public/logo.jpeg)

A full-stack MERN application that provides an intelligent journaling experience with emotion analysis, mood tracking, and personalized support using AI/ML technologies.

## 🌟 Features

- **User Authentication**: Secure registration and login with OTP verification
- **AI-Powered Journaling**: Emotion analysis and mood tracking using fine-tuned ML models
- **Personalized Support**: AI-generated support messages based on your emotional state
- **Profile Management**: User profiles with image upload capabilities
- **Responsive Design**: Modern, mobile-friendly UI built with React
- **Real-time Analysis**: Instant emotion detection and mood insights

## 🏗️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling and responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email services

### AI/ML Service
- **Python** - ML runtime
- **FastAPI** - API framework
- **Uvicorn** - ASGI server
- **Transformers** - Hugging Face models
- **PyTorch** - Deep learning framework
- **LangChain** - AI/ML orchestration
- **Fine-tuned Emotion Model** - Custom trained model for emotion analysis

## 📁 Project Structure

```
CalmSpace/
├── frontend/                    # React frontend application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── css/               # Stylesheets
│   │   └── api.js             # API configuration
│   └── package.json
├── backend/                    # Node.js backend API
│   ├── config/                # Database configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions
│   └── uploads/               # File uploads
├── ml_service/                # Python ML service
│   ├── app.py                 # FastAPI application
│   ├── pipeline.py            # ML pipeline
│   └── requirements.txt       # Python dependencies
├── fine_tuned_emotion_model_revised/  # Fine-tuned emotion analysis model
│   ├── model.safetensors      # Model weights (255MB)
│   ├── config.json            # Model configuration
│   ├── tokenizer.json         # Tokenizer configuration
│   ├── tokenizer_config.json  # Tokenizer settings
│   ├── vocab.txt              # Vocabulary file
│   ├── special_tokens_map.json # Special tokens mapping
│   └── training_args.bin      # Training arguments
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/dharamshiyash/CalmSpace.git
cd CalmSpace
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=ClusterName
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
COOKIE_NAME=token

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="CalmSpace <your_email@gmail.com>"
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 4. ML Service Setup

```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=token
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="CalmSpace <your_email@gmail.com>"
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:5001
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - OTP verification
- `POST /api/auth/logout` - User logout
- `GET /api/auth/protected` - Protected route test

### Journal
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry
- `GET /api/journal/summary` - Get journal summary

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/image` - Upload profile image
- `DELETE /api/profile/image` - Remove profile image

### AI/ML
- `POST /api/emotion` - Analyze emotion from text
- `POST /api/emotion/support` - Get AI support based on mood

## 🎨 Features Overview

### 1. User Authentication
- Secure registration with email verification
- JWT-based authentication
- Password hashing with bcrypt
- Session management

### 2. Journal Management
- Create, read, update, delete journal entries
- Rich text journaling experience
- Automatic emotion analysis
- Mood tracking and insights

### 3. AI-Powered Analysis
- **Fine-tuned Emotion Model**: Custom trained model for accurate emotion detection
- Real-time emotion analysis from journal text
- Personalized support messages based on emotional state
- Mood pattern analysis and insights
- Intelligent recommendations and support

### 4. Fine-tuned Emotion Model
- **Model Type**: Custom fine-tuned transformer model
- **Size**: 255MB (model.safetensors)
- **Capabilities**: 
  - Emotion classification (happy, sad, angry, anxious, etc.)
  - Sentiment analysis
  - Mood detection
  - Contextual understanding
- **Integration**: Seamlessly integrated with journaling experience

### 5. Profile Management
- User profile customization
- Image upload functionality
- Personal information management

## 🚀 Deployment

### Free Hosting Options

#### 1. Vercel (Frontend) + Railway (Backend) + MongoDB Atlas

**Frontend on Vercel:**
1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Add environment variable: `REACT_APP_API_BASE_URL=https://your-backend-url.railway.app`

**Backend on Railway:**
1. Connect your GitHub repository to Railway
2. Set root directory: `backend`
3. Add environment variables from your `.env` file
4. Deploy automatically

#### 2. Netlify (Frontend) + Render (Backend) + MongoDB Atlas

**Frontend on Netlify:**
1. Connect GitHub repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/build`
4. Add environment variable: `REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com`

**Backend on Render:**
1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set root directory: `backend`
4. Add environment variables
5. Deploy

#### 3. Heroku (Full Stack)

**Deploy both frontend and backend:**
1. Create two Heroku apps (one for frontend, one for backend)
2. Use buildpacks for Node.js
3. Set up environment variables
4. Deploy both applications

### ML Service Deployment

**Option 1: Railway**
- Deploy Python service on Railway
- Set root directory to `ml_service`
- Add environment variables

**Option 2: Render**
- Deploy as Web Service on Render
- Set Python runtime
- Configure build and start commands

## 🛠️ Development

### Running in Development Mode

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Start ML Service:**
   ```bash
   cd ml_service
   python app.py
   ```

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

**ML Service:**
- `uvicorn app:app --reload --port 8000` - Start FastAPI server with uvicorn

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yash Dharamshi**
- GitHub: [@dharamshiyash](https://github.com/dharamshiyash)
- Email: dharamshiyash1810@gmail.com

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database service
- Hugging Face for pre-trained models
- FastAPI for the ML service framework
- All open-source contributors

## 📞 Support

If you have any questions or need help, please:
1. Open an issue on GitHub
2. Contact the author via email
3. Check the documentation

---

**Made with ❤️ for better mental health and journaling experience**