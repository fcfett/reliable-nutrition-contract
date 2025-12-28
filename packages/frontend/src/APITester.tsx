import { useRef, useState, type FormEvent } from "react";

const API_PATH = 'http://localhost:3000'
const sources = ['a', 'b', 'c', 'd'];


export function APITester() {
  const [hasData, setHasData] = useState(false)
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const form = formRef.current!;
      const formData = new FormData(form);
      const selectedSource = formData.get("source") as string;
      const res = await fetch(`${API_PATH}/${selectedSource}`);
      const resBody = await res.json();
      responseInputRef.current!.value = JSON.stringify(resBody, null, 2);
      setHasData(true);
    } catch (error) {
      responseInputRef.current!.value = String(error);
    }
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
      <form
        ref={formRef}
        onSubmit={testEndpoint}
        className="flex items-center gap-2 bg-[#1a1a1a] p-3 rounded-xl font-mono border-2 border-[#fbf0df] transition-colors duration-300 focus-within:border-[#f3d5a3] w-full"
      >
        <label htmlFor="source">Data source: </label>
        <select
          onChange={() => formRef.current?.requestSubmit()}
          name="source"
          id="source"
          className="bg-[#fbf0df] text-[#1a1a1a] py-2 px-4 border-r-8 border-transparent rounded-lg font-bold text-sm min-w-0 cursor-pointer hover:bg-[#f3d5a3] transition-colors duration-100 uppercase text-center"
        >
          {sources.map((v) => (
            <option key={`select-value-${v}`} value={v} className="py-1 text-center uppercase">{v}</option>)
          )}
        </select>
        
        <button
          disabled={hasData}
          type="submit"
          className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer whitespace-nowrap ml-auto"
        >
          Load
        </button>
      </form>
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className="w-full min-h-96 bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
      />
    </div>
  );
}
