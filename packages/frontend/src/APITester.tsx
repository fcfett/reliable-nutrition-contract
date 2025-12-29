import { useRef, useState, Fragment, type FormEvent } from "react";

import {useQuery} from '@tanstack/react-query'
import {twMerge} from 'tailwind-merge'

const API_PATH = 'http://localhost:3000'
const SOURCES = ['a', 'b', 'c', 'd', 'x', 'y'];
const DEFAULT_SOURCE = SOURCES[0];

import type {NormalizedEntry} from '../../api/normalize'

export function APITester() {
  const formRef = useRef<HTMLFormElement>(null);
  const [source, setSource] = useState(DEFAULT_SOURCE);

  const { refetch, data, isError, isLoading, isRefetching, error } = useQuery({
    queryKey: ['data'],
    retry: false,
    queryFn: () => fetch(`${API_PATH}/${source}`).then(async (res) => {
      const resBody = await res.json()

      if(!resBody.data) {
        throw new Error(`${resBody.statusText} (${resBody.status})`, resBody);
      }

      return resBody
    }).catch(e => { throw e })
  });

  const isLoadingData = isLoading || isRefetching;

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedSource = new FormData(formRef.current!).get("source") as string;
    setSource(() => selectedSource);
    setTimeout(() => {
      refetch();
    }, 0)
  };

  return (
    <section className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
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
          disabled={isLoading || isRefetching}
          className="bg-[#fbf0df] text-[#1a1a1a] py-2 px-4 border-r-8 border-transparent rounded-lg font-bold text-sm min-w-0 cursor-pointer hover:bg-[#f3d5a3] transition-colors duration-100 uppercase text-center ml-auto"
        >
          {SOURCES.map((v) => (
            <option key={`select-value-${v}`} value={v} className="py-1 text-center uppercase">{v}</option>)
          )}
        </select>
      </form>
      
      
      {!isLoadingData && isError ? (
        <textarea
          readOnly
          placeholder="Response will appear here..."
          className="w-full min-h-[228px] bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
          value={error.stack}
        />
      ) : (
        <ul className="flex gap-4">
          {isLoadingData && (
            <>
              {Array.from({length: 2}).map((_, i) => (
                <li 
                  key={`loading-placeholder-${i + 1}`}
                  style={{animationDelay: `${i * 750}ms`}}
                  className="flex flex-col flex-1 border-2 rounded-xl min-h-[228px] animate-pulse"
                />
              ))}
            </>
          )}
          {!isLoadingData && data?.data?.map((entry: NormalizedEntry) => {
            const invalidProps = entry.issues?.invalid ?? [];
            const inconsitentProps = entry.issues?.inconsistent ?? [];
            const hasInvalidServing = invalidProps.includes('serving');
            const hasInvalidCalories = invalidProps.includes('calories');
            const hasInvalidMacros = invalidProps.includes('calories');
            const hasInconsistentCalories = inconsitentProps.includes('calories');
            
            const inconsistentStyle = {
              text: 'text-amber-500 font-black',
              border: 'border-amber-500'
            }
            
            const invalidStyle = {
              text: 'text-red-500/80 font-black',
              border: 'border-red-500/80'
            };
            
            const unknownStyle = {
              text: 'text-stone-500 font-black',
              border: 'border-stone-500'
            };

            return (
              <li key={entry.id} className={twMerge(
                'flex flex-col flex-1 border-2 rounded-xl p-4 gap-4',
                entry.issues?.unknown && unknownStyle.border,
                entry.issues?.inconsistent && inconsistentStyle.border,
                entry.issues?.invalid && invalidStyle.border
              )}>
                <h2 className="text-2xl font-bold">{entry.foodName}</h2>
                <ul className="flex flex-col text-sm gap-1">
                  <li>
                    <strong>Serving:</strong>&nbsp;
                    <span className={twMerge(hasInvalidServing && invalidStyle.text)}>{entry.serving.amount}{!['g', 'ml'].includes(entry.serving.unit) && ' '}{entry.serving.unit}</span>
                  </li>
                  <li>
                    <strong>Calories:</strong>&nbsp;
                    <span className={twMerge(!entry.calories && unknownStyle.text, hasInvalidCalories && invalidStyle.text, hasInconsistentCalories && inconsistentStyle.text)}>
                      {entry.calories ? `${entry.calories} kcal` : 'unknown'}
                    </span>
                  </li>
                </ul>
                <section className="flex flex-col text-sm gap-1">
                  <h3 className="font-black">Macros</h3>
                  <ul className="list-disc pl-4">
                    {Object.entries(entry.macros).map(([k,v]) => (
                      <li key={`${entry.id}-${k}`}>
                        <strong className="capitalize">{k}:</strong>&nbsp;
                        <span className={twMerge(hasInvalidMacros && invalidStyle.text)}>{v}g</span>
                      </li>
                    ))}
                  </ul>
                </section>
                {entry.issues && (
                  <section className="flex flex-col text-sm gap-1">
                    <h3 className="font-black">Issues</h3>
                    <ul className="list-disc pl-4">
                    {Object.entries(entry.issues).map(([k,v]) => {
                      const key = `${entry.id}-issues-${k}`; 
                      
                      return (
                        <li key={key}>
                          <span className="capitalize">{k}</span> on&nbsp;
                          {v.map((issue, i, arr) => (
                            <Fragment key={`${key}-${k}-${issue}`}>
                              <strong className={twMerge(
                                {
                                  'inconsistent': inconsistentStyle.text,
                                  'invalid' : invalidStyle.text,
                                  'unknown': unknownStyle.text
                                }[k]
                              )}>{issue}</strong>
                              {i === arr.length - 1 ? ';' : i === arr.length - 2 ? ' and ' : ', '}
                            </Fragment>
                          ))}
                        </li>
                      )
                    })}
                    </ul>
                  </section>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  );
}
