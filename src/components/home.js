import { Link } from "react-router-dom";

export function Home() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center space-y-4 p-6">
      <div class="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 w-8/12">
        <Link
          class="text-2xl font-bold px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition w-full text-wrap"
          to="/display"
        >
          <button>Go to Display</button>
        </Link>
        <Link
          class="text-2xl font-bold px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition w-full text-wrap"
          to="/controller"
        >
          <button>Go to Controller</button>
        </Link>
      </div>
    </div>
  );
}
