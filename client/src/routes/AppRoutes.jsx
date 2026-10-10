// client/src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';

// Pages publiques
import Accueil from '../pages/public/Accueil.jsx';
import VerifierNINTI from '../pages/public/VerifierNINTI.jsx';
import NotFound from '../pages/public/NotFound.jsx';

// Auth
import Connexion from '../pages/auth/Connexion.jsx';
import Inscription from '../pages/auth/Inscription.jsx';
import InscriptionTechnicien from '../pages/auth/InscriptionTechnicien.jsx';

// Routes protégées
import ProtectedRoute from './ProtectedRoute.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';

// Admin
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminGestionTechniciens from '../pages/admin/GestionTechniciens.jsx';
import AdminGestionEntreprises from '../pages/admin/GestionEntreprises.jsx';
import AdminRegistreNINTI from '../pages/admin/RegistreNINTI.jsx';
import AdminGestionQuestions from '../pages/admin/GestionQuestions.jsx';
import AdminGestionLitiges from '../pages/admin/GestionLitiges.jsx';
import AdminStatistiques from '../pages/admin/Statistiques.jsx';

// Technicien
import TechnicienDashboard from '../pages/technicien/Dashboard.jsx';
import TechnicienMonProfil from '../pages/technicien/MonProfil.jsx';
import TechnicienPasserTest from '../pages/technicien/PasserTest.jsx';
import TechnicienMonNINTI from '../pages/technicien/MonNINTI.jsx';
import TechnicienMesDemandes from '../pages/technicien/MesDemandes.jsx';
import TechnicienMesMissions from '../pages/technicien/MesMissions.jsx';
import TechnicienMaMessagerie from '../pages/technicien/MaMessagerie.jsx';
import TechnicienMesAvis from '../pages/technicien/MesAvis.jsx';

// Entreprise
import EntrepriseDashboard from '../pages/entreprise/Dashboard.jsx';
import EntrepriseMonAbonnement from '../pages/entreprise/MonAbonnement.jsx';
import EntrepriseAnnuaire from '../pages/entreprise/Annuaire.jsx';

function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route path="/" element={<Accueil />} />
      <Route path="/verifier/:numero?" element={<VerifierNINTI />} />

      {/* ===== AUTH ===== */}
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/inscription/technicien" element={<InscriptionTechnicien />} />
      <Route path="/inscription/entreprise" element={<Inscription />} />
      <Route path="/inscription/particulier" element={<Inscription />} />

      {/* ===== ADMIN ===== */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="techniciens" element={<AdminGestionTechniciens />} />
          <Route path="entreprises" element={<AdminGestionEntreprises />} />
          <Route path="nintis" element={<AdminRegistreNINTI />} />
          <Route path="questions" element={<AdminGestionQuestions />} />
          <Route path="litiges" element={<AdminGestionLitiges />} />
          <Route path="statistiques" element={<AdminStatistiques />} />
        </Route>
      </Route>

      {/* ===== TECHNICIEN ===== */}
      <Route element={<ProtectedRoute roles={['technicien']} />}>
        <Route path="/technicien" element={<DashboardLayout />}>
          <Route index element={<TechnicienDashboard />} />
          <Route path="dashboard" element={<TechnicienDashboard />} />
          <Route path="profil" element={<TechnicienMonProfil />} />
          <Route path="test" element={<TechnicienPasserTest />} />
          <Route path="ninti" element={<TechnicienMonNINTI />} />
          <Route path="demandes" element={<TechnicienMesDemandes />} />
          <Route path="missions" element={<TechnicienMesMissions />} />
          <Route path="messages" element={<TechnicienMaMessagerie />} />
          <Route path="avis" element={<TechnicienMesAvis />} />
        </Route>
      </Route>

      {/* ===== ENTREPRISE ===== */}
      <Route element={<ProtectedRoute roles={['entreprise']} />}>
        <Route path="/entreprise" element={<DashboardLayout />}>
          <Route index element={<EntrepriseDashboard />} />
          <Route path="dashboard" element={<EntrepriseDashboard />} />
          <Route path="annuaire" element={<EntrepriseAnnuaire />} />
          <Route path="abonnement" element={<EntrepriseMonAbonnement />} />
        </Route>
      </Route>

      {/* ===== 404 ===== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;