import { APITester } from "./APITester";
import "./index.css";

export function App() {
  return (
    <div className="max-w-7xl mx-auto p-8 text-center relative z-10">
      <h1 className="text-4xl font-bold my-4 leading-tight">Reliable Nutrition Contract</h1>
      <APITester />
    </div>
  );
}

export default App;
