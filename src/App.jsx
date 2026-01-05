import { BrowserRouter as Router } from "react-router-dom";
import AppRoute from "./routes/AppRoute";
import "./App.css";
import { App as AntdApp } from "antd";
function App() {
  return (
    <Router>
      <AppRoute />
    </Router>
  );
}

export default App;
