export function NaverIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#03C75A" />
      <path
        fill="#ffffff"
        d="M13.37 12.27 10.36 7H7v10h3.63v-5.27L13.64 17H17V7h-3.63z"
      />
    </svg>
  );
}
