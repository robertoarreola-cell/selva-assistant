export default function EmbedLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Asistente Cannabis Selva</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              height: 100vh;
              overflow: hidden;
            }
            * { 
              box-sizing: border-box; 
            }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-1 { flex: 1; }
            .h-full { height: 100%; }
            .bg-white { background-color: white; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-green-100 { background-color: #dcfce7; }
            .bg-green-600 { background-color: #16a34a; }
            .text-white { color: white; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-500 { color: #6b7280; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .p-4 { padding: 1rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-x-1 > * + * { margin-left: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-full { border-radius: 50%; }
            .border { border-width: 1px; }
            .border-t { border-top-width: 1px; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-green-100 { border-color: #dcfce7; }
            .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .overflow-y-auto { overflow-y: auto; }
            .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
            .from-green-50 { --tw-gradient-from: #f0fdf4; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(240, 253, 244, 0)); }
            .to-green-100 { --tw-gradient-to: #dcfce7; }
            .justify-end { justify-content: flex-end; }
            .justify-start { justify-content: flex-start; }
            .justify-center { justify-content: center; }
            .items-center { align-items: center; }
            .text-center { text-align: center; }
            .max-w-xs { max-width: 20rem; }
            .w-2 { width: 0.5rem; }
            .h-2 { height: 0.5rem; }
            .animate-bounce { animation: bounce 1s infinite; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .hover\\:bg-green-700:hover { background-color: #15803d; }
            .focus\\:outline-none:focus { outline: none; }
            .focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5); }
            .focus\\:ring-green-500:focus { --tw-ring-color: #22c55e; }
            .disabled\\:opacity-50:disabled { opacity: 0.5; }
            .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
            .transition-colors { transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out; }
            
            @keyframes bounce {
              0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
              50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
            }
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}