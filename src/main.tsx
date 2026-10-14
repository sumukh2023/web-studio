import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
// packs:imports (starter packs add their imports below this line)

// packs:boot (starter packs add code that must run before the first render)

/** Wrappers around <App />, innermost first (providers, global widgets). */
const providers: ((app: ReactNode) => ReactNode)[] = [];
// packs:wrap (starter packs add e.g. providers.push((app) => <Provider>{app}</Provider>);)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{providers.reduce<ReactNode>((app, wrap) => wrap(app), <App />)}</StrictMode>
);
