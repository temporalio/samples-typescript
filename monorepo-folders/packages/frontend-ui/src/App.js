import './App.css';
import React from 'react';

function App() {
  const [data, setData] = React.useState(null);
  function onClick() {
    setData('loading...');
    fetch('/api/workflow')
      .then((res) => res.json())
      .then((x) => setData(x));
  }
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button style={{ fontSize: '2rem', padding: '1rem' }} onClick={onClick}>
          Click me
        </button>
        <pre style={{ textAlign: 'left', background: 'black', padding: 2 }}>{JSON.stringify(data, null, 2)}</pre>
      </header>
    </div>
  );
}

export default App;
