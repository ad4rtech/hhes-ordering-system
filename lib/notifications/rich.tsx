export function Rich({ text, strong = "font-semibold text-ink" }: { text: string; strong?: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 === 1 ? <strong key={i} className={strong}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
}