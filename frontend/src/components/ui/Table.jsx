export default function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}