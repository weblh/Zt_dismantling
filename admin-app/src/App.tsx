import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { MenuAccessProvider } from '@/contexts/MenuAccessContext';

const basename = (() => {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return undefined;
  return base.replace(/\/$/, '');
})();

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <MenuAccessProvider>
        <Router />
      </MenuAccessProvider>
    </BrowserRouter>
  );
}
