import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Views
import Dashboard from './views/Dashboard';
import ClientsList from './views/clients/ClientsList';
import ClientDetail from './views/clients/ClientDetail';
import ProduitsList from './views/produits/ProduitsList';
import StockOverview from './views/stock/StockOverview';
import CommandesList from './views/commandes/CommandesList';
import CommandeDetail from './views/commandes/CommandeDetail';
import CommandeCreate from './views/commandes/CommandeCreate';
import LivraisonsList from './views/livraisons/LivraisonsList';
import LivraisonDetail from './views/livraisons/LivraisonDetail';
import BonLivraison from './views/livraisons/BonLivraison';
import PaiementsList from './views/paiements/PaiementsList';
import RapportsList from './views/rapports/RapportsList';
import BilansList from './views/bilans/BilansList';
import Parametres from './views/Parametres';

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Atlas Distribution" />
        <main className="page">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              
              <Route path="/produits" element={<ProduitsList />} />
              <Route path="/stock" element={<StockOverview />} />
              
              <Route path="/commandes" element={<CommandesList />} />
              <Route path="/commandes/nouveau" element={<CommandeCreate />} />
              <Route path="/commandes/:id" element={<CommandeDetail />} />
              
              <Route path="/livraisons" element={<LivraisonsList />} />
              <Route path="/livraisons/:id" element={<LivraisonDetail />} />
              <Route path="/livraisons/:id/bon" element={<BonLivraison />} />
              
              <Route path="/paiements" element={<PaiementsList />} />
              
              <Route path="/rapports" element={<RapportsList />} />
              
              <Route path="/bilans" element={<BilansList />} />
              
              <Route path="/parametres" element={<Parametres />} />
            </Routes>
          </Layout>
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}
