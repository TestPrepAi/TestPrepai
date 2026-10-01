import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import DailyTask from "@/pages/DailyTask";
import CreateTest from "@/pages/CreateTest";
import TakeTest from "@/pages/TakeTest";
import Result from "@/pages/Result";
import Analytics from "@/pages/Analytics";
import History from "@/pages/History";
import Pricing from "@/pages/Pricing";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/daily-task" element={<ProtectedRoute><DailyTask /></ProtectedRoute>} />
            <Route path="/create-test" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
            <Route path="/test/:id" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
