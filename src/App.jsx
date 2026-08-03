import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import Spinner from "./components/ui/Spinner";
import PageHeader from "./components/ui/PageHeader";
import EmptyState from "./components/ui/EmptyState";
import Button from "./components/ui/Button";
import DashboardPage from "./pages/Dashboard";
import CharactersPage from "./pages/Characters";
import LootPage from "./pages/Loot";
import InventoryPage from "./pages/Inventory";
import ShoppingPage from "./pages/Shopping";
import BuffProfilesPage from "./pages/BuffProfiles";
import RaidsPage from "./pages/Raids";
import RestedXpPage from "./pages/RestedXp";
import SettingsPage from "./pages/Settings";
import AdminPage from "./pages/Admin";
import WarriorSimPage from "./pages/WarriorSim";
import RogueSimPage from "./pages/RogueSim";
import MageSimPage from "./pages/MageSim";

function App() {
  const { user, loading, hasFirebaseConfig, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </Layout>
    );
  }

  if (!hasFirebaseConfig) {
    return (
      <Layout>
        <PageHeader title="Configuration Required" />
        <EmptyState
          title="Firebase env vars are missing"
          description="Copy .env.example into .env.local and fill in your Firebase project config."
        />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <PageHeader title="Sign In Required" />
        <EmptyState
          title="Sign in with Google"
          description="Sign in to track your characters, raids, and loot."
          action={
            <Button variant="primary" onClick={signInWithGoogle}>
              Sign In with Google
            </Button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/raids" element={<RaidsPage />} />
        <Route path="/loot" element={<LootPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/buff-profiles" element={<BuffProfilesPage />} />
        <Route path="/rested" element={<RestedXpPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/sim/warrior" element={<WarriorSimPage />} />
        <Route path="/sim/rogue" element={<RogueSimPage />} />
        <Route path="/sim/mage" element={<MageSimPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
