export default function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </select>
  );
}