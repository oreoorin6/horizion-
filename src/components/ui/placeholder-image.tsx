export const PlaceholderSVG = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="100%" 
    height="100%" 
    viewBox="0 0 100 100" 
    preserveAspectRatio="xMidYMid slice"
  >
    <rect width="100" height="100" fill="#1f2937" />
    <path
      d="M30,40 L70,40 L70,70 L30,70 Z M50,20 L70,40 M30,40 L50,20"
      stroke="#4b5563"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="45" cy="50" r="5" fill="#4b5563" />
    <circle cx="60" cy="50" r="5" fill="#4b5563" />
    <path
      d="M40,60 C43,65 57,65 60,60"
      stroke="#4b5563"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const PlaceholderComponent = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-800">
    <div className="w-16 h-16 text-gray-500">
      <PlaceholderSVG />
    </div>
  </div>
);

export default PlaceholderComponent;