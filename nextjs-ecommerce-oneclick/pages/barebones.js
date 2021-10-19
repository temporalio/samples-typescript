import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function fetchAPI(str, obj) {
  return fetch(str, obj)
    .then((res) => res.json())
    .catch((err) => console.error(err) || toast(err));
}

export default function Bones() {
  const [itemId, setItemId] = React.useState('item123');
  const [state, setState] = React.useState('null');
  const [workflowId, setWFID] = React.useState(null);
  function onClick() {
    setState('sending...');
    fetchAPI('/api/startBuy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId }),
    })
      .then((x) => setWFID(x.workflowId))
      .then(() => setState('Purchased! Cancel if you change your mind'));
  }
  function getState() {
    if (workflowId) {
      setState('fetching state...');
      fetchAPI('/api/getBuyState?id=' + workflowId).then((x) => setState(x.purchaseState));
      // .catch(err => setState('something went wrong ' + err))
    }
  }
  function cancelBuy() {
    fetchAPI('/api/cancelBuy?id=' + workflowId).then(getState);
  }

  return (
    <header className="relative overflow-hidden">
      <ToastContainer />
      <div className="pt-8 pb-80 sm:pt-12 sm:pb-40 lg:pt-24 lg:pb-48">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
          <div className="sm:max-w-lg">
            <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Temporal.io + Next.js One Click Purchase Demo
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Buy something, then change your mind. Or maybe not. Whatever you decide, Temporal makes it easy to add
              async processes with high reliability.
            </p>
          </div>
          <div>
            <div className="mt-10 w-64 flex flex-col lg:flex-row space-y-4 space-x-8">
              <pre className="font-mono bg-gray-50 p-4">
                {JSON.stringify(
                  {
                    state,
                    itemId,
                    workflowId,
                  },
                  null,
                  2
                )}
              </pre>
              <button
                onClick={onClick}
                className="inline-block text-center bg-indigo-600 border border-transparent rounded-md py-3 px-8 font-medium text-white hover:bg-indigo-700"
              >
                Buy {itemId}
              </button>
              <button
                disabled={!workflowId}
                onClick={getState}
                className="inline-block text-center disabled:opacity-50 bg-indigo-600 border border-transparent rounded-md py-3 px-8 font-medium text-white hover:bg-indigo-700"
              >
                Get State
              </button>
              <button
                disabled={!workflowId}
                onClick={cancelBuy}
                className="inline-block text-center disabled:opacity-50 bg-red-800 hover:wiggle border border-transparent rounded-md py-3 px-8 font-medium text-white"
              >
                Cancel Buy
              </button>
            </div>
            <p className="mt-4 text-xl text-gray-500">
              Find more{' '}
              <a className="text-blue-400" href="https://github.com/temporalio/samples-node">
                Node SDK samples
              </a>{' '}
              or
              <a className="text-blue-400" href="https://temporal.io/node">
                browse our docs
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  };
}
