import Head from 'next/head';
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function fetchAPI(str, obj?: RequestInit) {
  return fetch(str, obj)
    .then(async (res) => {
      console.log(res);
      if (res.ok) return res.json();
      try {
        const { message, errorCode } = await res.json();
        throw new Error(errorCode + ': ' + message);
      } catch (err) {
        throw new Error(res.status + ': ' + res.statusText);
      }
    })
    .catch((err) => {
      console.error(err);
      toast.error(err, {
        position: 'top-right',
        autoClose: 5000,
        closeOnClick: true,
        draggable: true,
      });
      // throw err
    });
}

export default function Bones() {
  return (
    <div className="pt-8 pb-80 sm:pt-12 sm:pb-40 lg:pt-24 lg:pb-48">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <Head>
          <title>Temporal + Next.js Example</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header className="relative overflow-hidden">
          <div className="sm:max-w-lg">
            <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Temporal.io + Next.js One Click Purchase Demo
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Buy something, then change your mind. Or maybe not. Whatever you decide, Temporal makes it easy to add
              async processes with high reliability.
            </p>
          </div>
        </header>
        <ToastContainer />
        <ProductList />
        <p className="mt-4 text-xl text-gray-500">
          Find more{' '}
          <a className="text-blue-400" href="https://github.com/temporalio/samples-node">
            Node SDK samples
          </a>{' '}
          or{' '}
          <a className="text-blue-400" href="https://temporal.io/node">
            browse our docs
          </a>
          .
        </p>
      </div>
    </div>
  );
}

const products = [
  {
    id: 1,
    name: 'Fusion',
    category: 'Icon set',
    href: '#',
    price: '$49',
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-01.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 2,
    name: 'Icons',
    category: 'Icon set',
    href: '#',
    price: '$49',
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-02.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 3,
    name: 'Scaffold',
    category: 'Icon set',
    href: '#',
    price: '$49',
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-03.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 4,
    name: 'Bone',
    category: 'Icon set',
    href: '#',
    price: '$49',
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-04.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
];

function ProductList() {
  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4">
          {products.map((product) => (
            <Product product={product} key={product.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

type ITEMSTATE = 'NEW' | 'SENDING' | 'ORDERED' | 'CONFIRMED' | 'CANCELLING' | 'ERROR';

function Product({ product }) {
  const itemId = product.id;
  const [state, setState] = React.useState<ITEMSTATE>('NEW');
  const [workflowId, setWFID] = React.useState(null);
  const toastId = React.useRef(null);
  function buyProduct() {
    setState('SENDING');
    fetchAPI('/api/startBuy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId }),
    })
      .then((x) => setWFID(x.workflowId))
      .then(() => {
        setState('ORDERED');
        toastId.current = toast.success('Purchased! Cancel if you change your mind', {
          position: 'top-right',
          autoClose: 5000,
          closeOnClick: true,
          draggable: true,
          onClose: () => {
            console.log({ state });
            if (state === 'NEW') setState('CONFIRMED');
          },
          // onClose: () => {setState('CONFIRMED')}
        });
      });
  }
  // function getState() {
  //   if (workflowId) {
  //     setState('SENDING');
  //     fetchAPI('/api/getBuyState?id=' + workflowId).then((x) => setState(x.purchaseState))
  //       .catch(err => setState(err))
  //   }
  // }
  function cancelBuy() {
    if (workflowId && state === 'ORDERED') {
      setState('CANCELLING');
      fetchAPI('/api/cancelBuy?id=' + workflowId)
        .then(() => setState('NEW'))
        .catch((err) => {
          setState('ERROR');
          toast.error(err, {
            position: 'top-right',
            autoClose: 5000,
            closeOnClick: true,
            draggable: true,
          });
        });
      toast.dismiss(toastId.current);
    }
  }
  return (
    <div key={product.id} className="relative group">
      <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
        <img src={product.imageSrc} alt={product.imageAlt} className="object-center object-cover" />
        <div className="flex items-end p-4" aria-hidden="true">
          {
            {
              NEW: (
                <button
                  onClick={buyProduct}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Buy Now
                </button>
              ),
              SENDING: (
                <div className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Sending...
                </div>
              ),
              ORDERED: (
                <button
                  onClick={cancelBuy}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Click to Cancel
                </button>
              ),
              CONFIRMED: (
                <div className="w-full  opacity-100 bg-white bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Purchased!
                </div>
              ),
              CANCELLING: (
                <div className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Cancelling...
                </div>
              ),
              ERROR: (
                <button
                  onClick={buyProduct}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Error! Click to Retry
                </button>
              ),
            }[state]
          }
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-base font-medium text-gray-900 space-x-8">
        <h3>{product.name}</h3>
        <p>{product.price}</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
    </div>
  );
}
