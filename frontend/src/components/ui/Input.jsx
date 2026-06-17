export default function Input(props) {
  return (
    <input
      {...props}
      className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
    />
  );
}