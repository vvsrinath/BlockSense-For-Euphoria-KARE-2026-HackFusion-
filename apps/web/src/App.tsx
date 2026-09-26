import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppLoadingScreen } from './components/layout/AppLoadingScreen';
import { ThemedToaster } from './components/layout/ThemedToaster';
import { PublicLayout } from './components/public/PublicLayout';
import { DocsLayout } from './components/public/DocsLayout';
import { SettingsProvider } from './stores/SettingsProvider';
import { WatchlistProvider } from './stores/WatchlistProvider';

/* Public site */
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Features = lazy(() => import('./pages/public/Features').then((m) => ({ default: m.Features })));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const Chains = lazy(() => import('./pages/public/Chains').then((m) => ({ default: m.Chains })));
const UseCases = lazy(() => import('./pages/public/UseCases').then((m) => ({ default: m.UseCases })));
const Pricing = lazy(() => import('./pages/public/Pricing').then((m) => ({ default: m.Pricing })));
const About = lazy(() => import('./pages/public/About').then((m) => ({ default: m.About })));
const Scope = lazy(() => import('./pages/public/Scope').then((m) => ({ default: m.Scope })));
const Roadmap = lazy(() => import('./pages/public/Roadmap').then((m) => ({ default: m.Roadmap })));
const Security = lazy(() => import('./pages/public/Security').then((m) => ({ default: m.Security })));
const Contact = lazy(() => import('./pages/public/Contact').then((m) => ({ default: m.Contact })));
const Status = lazy(() => import('./pages/public/Status').then((m) => ({ default: m.Status })));
const Changelog = lazy(() => import('./pages/public/Changelog').then((m) => ({ default: m.Changelog })));

/* Docs */
const Docs = lazy(() => import('./pages/public/docs/Docs').then((m) => ({ default: m.Docs })));
const ApiReference = lazy(() => import('./pages/public/docs/ApiReference').then((m) => ({ default: m.ApiReference })));
const Sdk = lazy(() => import('./pages/public/docs/Sdk').then((m) => ({ default: m.Sdk })));
const Architecture = lazy(() => import('./pages/public/docs/Architecture').then((m) => ({ default: m.Architecture })));
const Contributing = lazy(() => import('./pages/public/docs/Contributing').then((m) => ({ default: m.Contributing })));

/* Application */
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
const Alerts = lazy(() => import('./pages/public/Alerts').then((m) => ({ default: m.Alerts })));
const ApiConsole = lazy(() => import('./pages/ApiConsole').then((m) => ({ default: m.ApiConsole })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Help = lazy(() => import('./pages/Help').then((m) => ({ default: m.Help })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

/**
 * Wrap a marketing page in the public shell.
 *
 * A tiny wrapper rather than inline elements, because a layout route with many
 * children would render all of them eagerly and defeat the lazy loading.
 */
function publicPage(element: React.ReactNode) {
  return <PublicLayout>{element}</PublicLayout>;
}

function docsPage(active: string, element: React.ReactNode) {
  return <PublicLayout><DocsLayout active={active}>{element}</DocsLayout></PublicLayout>;
}

export function App() {
  return (
    <SettingsProvider>
      <WatchlistProvider>
        <BrowserRouter>
          <Suspense fallback={<AppLoadingScreen />}>
            <Routes>
              {/* Public site */}
              <Route path="/" element={publicPage(<Landing />)} />
              <Route path="/features" element={publicPage(<Features />)} />
              <Route path="/how-it-works" element={publicPage(<HowItWorks />)} />
              <Route path="/chains" element={publicPage(<Chains />)} />
              <Route path="/use-cases" element={publicPage(<UseCases />)} />
              <Route path="/pricing" element={publicPage(<Pricing />)} />
              <Route path="/about" element={publicPage(<About />)} />
              <Route path="/scope" element={publicPage(<Scope />)} />
              <Route path="/roadmap" element={publicPage(<Roadmap />)} />
              <Route path="/security" element={publicPage(<Security />)} />
              <Route path="/contact" element={publicPage(<Contact />)} />
              <Route path="/status" element={publicPage(<Status />)} />
              <Route path="/changelog" element={publicPage(<Changelog />)} />

              {/* Documentation */}
              <Route path="/docs" element={docsPage('/docs', <Docs />)} />
              <Route path="/docs/api" element={docsPage('/docs/api', <ApiReference />)} />
              <Route path="/docs/sdk" element={docsPage('/docs/sdk', <Sdk />)} />
              <Route path="/docs/architecture" element={docsPage('/docs/architecture', <Architecture />)} />
              <Route path="/docs/contributing" element={docsPage('/docs/contributing', <Contributing />)} />

              {/* Application */}
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
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/console" element={<ApiConsole />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          <ThemedToaster />
        </BrowserRouter>
      </WatchlistProvider>
    </SettingsProvider>
  );
}
