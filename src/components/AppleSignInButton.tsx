/* "Continue with Apple" - Apple's own style: white button, black Apple logo.
   Shown on iPhone wherever Google sign-in is offered (App Review 4.8). */
export default function AppleSignInButton({ onClick, className = 'py-3' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold cursor-pointer bg-white text-black ${className}`}
    >
      <svg viewBox="0 0 17 20" width="15" height="18" aria-hidden="true" fill="currentColor">
        <path d="M14.1 10.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8C3.8 4.9 2.2 5.9 1.3 7.4c-1.8 3.2-.5 7.9 1.3 10.4.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.8-4.4zM11.6 3.2c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
      </svg>
      Continue with Apple
    </button>
  );
}
