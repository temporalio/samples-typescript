module.exports = {
  content: [
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-yellow-100',
    'bg-yellow-800',
    'bg-red-100',
    'bg-red-800',
    'bg-green-100',
    'bg-green-800',
    'bg-gray-100',
    'bg-gray-800',
    'bg-indigo-100',
    'bg-indigo-800',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          600: '#185856',
        },
      },
    },
  },
  plugins: [],
}
