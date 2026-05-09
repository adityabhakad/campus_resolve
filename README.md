# 🏛️ Campus Resolve

**Campus Resolve** is a modern, full-stack college management and issue resolution platform designed to streamline communication between students, staff, and administration. It provides a secure, intuitive environment for reporting campus issues, tracking their resolution in real-time, and managing academic infrastructure efficiently.

## ✨ Key Features

- **Role-Based Portals**: Dedicated, secure dashboards tailored for Students, Staff (Faculty, Wardens, Librarians, etc.), and System Administrators.
- **Advanced Complaint Management**: Submit issues with categorization, multi-image evidence uploads, and priority levels.
- **Automated GPS Tagging**: Automatically extracts and attaches precise GPS coordinates from uploaded image metadata (EXIF).
- **Anonymous Reporting**: Built-in option for students to submit complaints anonymously while keeping track of the resolution.
- **Real-Time Timeline & Chat**: Transparent complaint timelines with integrated messaging between students and assigned staff.
- **Data-Driven Analytics**: Administrative dashboard featuring interactive charts to track resolution rates, category volume, and staff performance.
- **Premium UI/UX**: A highly responsive, modern aesthetic built with Tailwind CSS, featuring smooth micro-animations and a high-contrast charcoal and warm yellow color system.

## 🛠️ Tech Stack

### Frontend
- **React.js** (via Vite)
- **Tailwind CSS** (for styling and responsive design)
- **Zustand** (for lightweight, scalable state management)
- **Lucide React** (for premium iconography)
- **Recharts** (for data visualization)
- **Exifr** (for extracting GPS metadata from images)

### Backend
- **Node.js & Express.js**
- **MongoDB & Mongoose** (for NoSQL database architecture)
- **JSON Web Tokens (JWT)** (for secure authentication & authorization)
- **Multer** (for handling image uploads)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account and connection string (or a local MongoDB instance)
- [Git](https://git-scm.com/) installed on your machine

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/campus-resolve.git
   cd campus-resolve
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory with the following variables:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key_here
     NODE_ENV=development
     ```
   - Start the backend server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   - Start the frontend development server:
     ```bash
     npm run dev
     ```

4. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`

## 🛡️ Access Control & Roles

Upon registering via the frontend, new users are automatically assigned the `student` role. 

To create an `admin` account for initial setup:
1. Register a standard account via the frontend.
2. Manually update that user document's `role` field to `"admin"` directly within your MongoDB Atlas database collection.
3. Log in with your new admin account to seamlessly provision additional staff members directly from the Admin Hub.

---
*Built with modern web standards for a smarter, faster campus experience.*
