import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppLoadingScreen } from './components/layout/AppLoadingScreen';
import { ThemedToaster } from './components/layout/ThemedToaster';
import { SettingsProvider } from './stores/SettingsContext';
import { WatchlistProvider } from './stores/WatchlistContext';

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Analyze = lazy(() => import('./pages/Analyze').then((m) => ({ default: m.Analyze })));
const TransactionDetails = lazy(() => import('./pages/TransactionDetails').then((m) => ({ default: m.TransactionDetails })));
const WalletAnalysis = lazy(() => import('./pages/WalletAnalysis').then((m) => ({ default: m.WalletAnalysis })));
const NetworkGraphPage = lazy(() => import('./pages/NetworkGraph').then((m) => ({ default: m.NetworkGraphPage })));
const Assets = lazy(() => import('./pages/Assets').then((m) => ({ default: m.Assets })));
const TokenDetails = lazy(() => import('./pages/TokenDetails').then((m) => ({ default: m.TokenDetails })));
const Watchlist = lazy(() => import('./pages/Watchlist').then((m) => ({ default: m.Watchlist })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const ReportDetails = lazy(() => import('./pages/ReportDetails').then((m) => ({ default: m.ReportDetails })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Help = lazy(() => import('./pages/Help').then((m) => ({ default: m.Help })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

export function App() {
  return (
    <SettingsProvider>
      <WatchlistProvider>
        <BrowserRouter>
          <Suspense fallback={<AppLoadingScreen />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route element={<AppLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/analyze/tx/:hash" element={<TransactionDetails />} />
                <Route path="/wallet" element={<WalletAnalysis />} />
                <Route path="/wallet/:address" element={<WalletAnalysis />} />
                <Route path="/network" element={<NetworkGraphPage />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/assets/:id" element={<TokenDetails />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/:id" element={<ReportDetails />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          <ThemedToaster />
        </BrowserRouter>
      </WatchlistProvider>
    </SettingsProvider>);

}