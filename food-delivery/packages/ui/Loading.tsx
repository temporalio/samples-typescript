export default function Loading() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-600"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      ></path>
    </svg>
  )
}
