import * as React from 'react';
import { createRoot } from 'react-dom/client';

const App: React.FunctionComponent = () => (<div>Your App goes here</div>);

function bootstrapApplication() {
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<App />);
}

bootstrapApplication();

if (module.hot) {
  module.hot.accept();
}
