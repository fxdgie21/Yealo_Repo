import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ProductsProvider } from './context/ProductsContext.tsx';
import { RidersProvider } from './context/RidersContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ProductsProvider>
        <RidersProvider>
          <App />
        </RidersProvider>
      </ProductsProvider>
    </LanguageProvider>
  </StrictMode>,
);
