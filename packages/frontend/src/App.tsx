import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import "./index.css";

import { APITester } from "./APITester";

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <div className="max-w-7xl mx-auto p-8 text-center relative z-10">
      <h1 className="text-4xl font-bold my-4 leading-tight">
        Reliable Nutrition Contract&nbsp;
        <figure className='inline-block scale-90' aria-label='broccoli and apple emojis'>🥦🍎</figure>
      </h1>
      <APITester />
    </div>
    </QueryClientProvider>
  );
}

export default App;
