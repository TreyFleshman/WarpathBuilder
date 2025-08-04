import './styles/main.scss';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import UnitsListPage from './pages/UnitsListPage';
import UnitsPage from './pages/UnitsPage';
import OfficersPage from './pages/OfficersPage';
import PassiveSkillsPage from './pages/PassiveSkillsPage';
import UnitDetailPage from './pages/UnitDetailPage';
import BuildsListPage from './pages/BuildsListPage';
import BuildCreatorPage from './pages/BuildCreatorPage';

function App() {
  return (
    <div className="App">
      <Router>
        <Navigation />
        <div className="page-with-nav">
          <Routes>
            <Route path="/" element={<UnitsPage />} />
            <Route path="/officers" element={<OfficersPage />} />
            <Route path="/passive-skills" element={<PassiveSkillsPage />} />
            <Route path="/units-old" element={<UnitsListPage />} />
            <Route path="/unit/:unitId" element={<UnitDetailPage />} />
            <Route path="/builds" element={<BuildsListPage />} />
            <Route path="/builds/:buildId" element={<BuildCreatorPage />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
