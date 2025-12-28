import { useRef, useState, type FormEvent } from "react";

import {useQuery} from '@tanstack/react-query'

const API_PATH = 'http://localhost:3000'
const SOURCES = ['a', 'b', 'c', 'd'];
const DEFAULT_SOURCE = 'a';


export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [source, setSource] = useState(DEFAULT_SOURCE);

  const { refetch } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch(`${API_PATH}/${source}`).then(async (res) => {
      const resBody = await res.json()
      const formattedResponse = JSON.stringify(resBody, null, 2);
      responseInputRef.current!.value = formattedResponse;
      return formattedResponse;
    }
  ),
  });

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedSource = new FormData(formRef.current!).get("source") as string;
    setSource(() => selectedSource);
    setTimeout(() => {
      refetch();
    }, 0)
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
          className="bg-[#fbf0df] text-[#1a1a1a] py-2 px-4 border-r-8 border-transparent rounded-lg font-bold text-sm min-w-0 cursor-pointer hover:bg-[#f3d5a3] transition-colors duration-100 uppercase text-center ml-auto"
        >
          {SOURCES.map((v) => (
            <option key={`select-value-${v}`} value={v} className="py-1 text-center uppercase">{v}</option>)
          )}
        </select>
      </form>
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className="w-full min-h-96 bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"/>
    </div>
  );
}
