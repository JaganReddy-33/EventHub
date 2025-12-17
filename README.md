# Mini Event Platform - MERN Stack Application

A full-stack web application for creating, viewing, and managing events with RSVP functionality. Built with MongoDB, Express.js, React.js, and Node.js.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration and login with JWT token-based authentication
- **Event Management**: Full CRUD operations for events
  - Create events with title, description, date/time, location, capacity, and image upload
  - View all upcoming events on the main dashboard
  - Edit and delete events (only by the creator)
- **RSVP System**: 
  - Join and leave events with capacity enforcement
  - Robust concurrency handling to prevent overbooking
  - No duplicate RSVPs per user per event
- **Responsive Design**: Fully responsive UI that works seamlessly on Desktop, Tablet, and Mobile

### Bonus Features (Optional Enhancements)
- ✨ **AI Integration**: Auto-generate event descriptions using AI
- 🔍 **Search & Filtering**: Search events by title, description, or location. Filter by date range
- 📊 **User Dashboard**: Personal dashboard showing created events and events you're attending
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 🎨 **Modern UI/UX**: Beautiful animations, smooth transitions, and polished interface

## 📋 Prerequisites

- Node.js 
- MongoDB Atlas account (or local MongoDB instance)
- npm package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd repository-name
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eventdb?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=*******
CLOUDINARY_API_KEY=******
CLOUDINARY_API_SECRET=*****
OPENAI_API_KEY=************
# Optional, defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The client will run on `http://localhost:5173`

## 🏗️ Project Structure

```
Fission-Infotech_assignment/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React contexts (Auth, Theme)
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & error middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Server entry point
│   ├── uploads/            # Uploaded images
│   ├── package.json
│   └── .env               # Environment variables
│
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Events
- `GET /api/events` - Get all events (with optional search/filter)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (protected)
- `PUT /api/events/:id` - Update event (protected, owner only)
- `DELETE /api/events/:id` - Delete event (protected, owner only)
- `POST /api/events/:id/rsvp` - RSVP to event (protected)
- `POST /api/events/:id/cancel` - Cancel RSVP (protected)
- `GET /api/events/mine` - Get user's events (protected)
- `POST /api/events/generate-description` - Generate AI description (protected)

## 🔒 RSVP Concurrency Handling - Technical Explanation

The RSVP system implements robust concurrency handling to prevent race conditions when multiple users attempt to RSVP simultaneously for the last available spot. Here's the strategy used:

### Strategy: Atomic MongoDB Operations with Conditional Updates

The solution uses MongoDB's atomic `findOneAndUpdate` operation combined with conditional expressions to ensure thread-safe RSVP operations.

#### Implementation Details:

```javascript
const updated = await Event.findOneAndUpdate(
  {
    _id: eventId,
    attendees: { $ne: userId },                    // User not already in attendees
    $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }  // Capacity check
  },
  { $addToSet: { attendees: userId } },          // Atomic add operation
  { new: true }
);
```

#### How It Works:

1. **Atomic Operation**: `findOneAndUpdate` is atomic at the database level, ensuring only one operation can modify a document at a time.

2. **Conditional Update**: The query includes three conditions that must ALL be true:
   - Event exists (`_id: eventId`)
   - User is not already attending (`attendees: { $ne: userId }`)
   - Event has available capacity (`$expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }`)

3. **Race Condition Prevention**: 
   - When multiple requests arrive simultaneously, MongoDB processes them sequentially
   - The first request that passes all conditions succeeds
   - Subsequent requests fail the condition check (capacity exceeded) and return `null`
   - The application then checks the failure reason and returns appropriate error messages

4. **Error Handling**: If the update returns `null`, the code fetches the current event state to determine the exact reason:
   - Event doesn't exist → 404
   - User already attending → 400
   - Capacity exceeded → 409 (Conflict)

#### Why This Approach?

- **No Locks Required**: MongoDB's document-level atomicity eliminates the need for application-level locking
- **Performance**: Single database operation is faster than transactions for this use case
- **Scalability**: Works efficiently even under high concurrent load
- **Reliability**: Database-level guarantees ensure data consistency

#### Alternative Approaches Considered:

1. **MongoDB Transactions**: Would work but adds overhead for a single-document operation
2. **Application-Level Locking**: Complex and doesn't scale well
3. **Optimistic Locking**: Requires version fields and retry logic

The chosen approach balances simplicity, performance, and reliability perfectly for this use case.

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. Push your code to GitHub
2. Connect your repository to Render/Railway
3. Set environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (your frontend URL)
   - `PORT` (usually auto-set)
4. Set build command: `npm install`
5. Set start command: `npm start`

### Frontend Deployment (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build directory: `client`
3. Set build command: `cd client && npm install && npm run build`
4. Set environment variable:
   - `VITE_API_URL` (your backend API URL)
5. Deploy

### Database Setup

Use MongoDB Atlas (cloud-hosted MongoDB):
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGO_URI` in your backend `.env`

## 🧪 Testing the Application

1. **Register a new account**
2. **Create an event** with all required fields
3. **View events** on the main dashboard
4. **RSVP to events** (test capacity limits)
5. **Edit/Delete** your own events
6. **Use search and filters** to find events
7. **Check your dashboard** for created and attending events
8. **Toggle dark mode** to see the theme switcher

## 📝 Features Implemented

### Required Features ✅
- [x] User Authentication (Sign Up & Login with JWT)
- [x] Event CRUD Operations
- [x] Image Upload for Events
- [x] RSVP System with Capacity Enforcement
- [x] Concurrency Handling for RSVP
- [x] Responsive Design (Desktop, Tablet, Mobile)
- [x] Edit/Delete Restrictions (Owner Only)

### Optional Enhancements ✅
- [x] AI Integration (Description Generation)
- [x] Search & Filtering (Title, Description, Location, Date Range)
- [x] User Dashboard (Created & Attending Events)
- [x] Dark Mode Toggle
- [x] Polished UI/UX (Animations, Transitions, Modern Design)

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Multer (file uploads)
- CORS

### Frontend
- React.js
- React Router DOM
- Axios (HTTP client)
- Tailwind CSS (styling)
- date-fns (date formatting)
- Vite (build tool)

## 📄 License

This project is created as part of a technical screening assignment.

## 👤 Author

Created as a MERN Stack Intern Technical Screening Assignment

---

**Note**: Make sure to update all environment variables with your actual credentials before deploying to production.



