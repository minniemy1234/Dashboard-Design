import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import EmploymentPage from "./pages/EmploymentPage";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import StudentPage from "./pages/StudentPage";
import FacultyPage from "./pages/FacultyPage";
import SummaryPage from "./pages/SummaryPage";
import StudentStatus from "./pages/StudentStatus";
import EvaluationPage from "./pages/EvaluationPage";
import GraduateQualityPage from "./pages/GraduateQualityPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/upload"
          element={<UploadPage />}
        />

       <Route
          path="/employment"
          element={<EmploymentPage />}
       />
       <Route
          path="/students"
          element={<StudentPage />}
       />
       <Route
         path="/faculty"
         element={<FacultyPage />}
       />

      <Route
        path="/summary"
        element={<SummaryPage />}

      />
      <Route 
       path="/student-status" 
       element={<StudentStatus />} 
      />

      <Route 
       path="/evaluation" 
       element={<EvaluationPage />} 
      />

      <Route 
       path="/graduate-quality" 
       element={<GraduateQualityPage />}
      />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
