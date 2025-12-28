# reliable-nutrition-contract

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
or
bun start
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

### Assumptions

- The given payloads represents all the possible contract drifts;
- All macros are in grams;
- Entries calories are estimate values and may be slightly different from the computed value based on macros data;
- Not every entry is inconsistent, so I used the most coherent to test my validation logic;
- Once it shouldn’t mask any uncertainty and inconsistency, it will keep values as is but and have a dedicated property to highlight the issues;

### Decisions & Trade-offs

- Stack
    - Used `bun` which was already minimally settled on `server.ts`
    - Split the API and Frontend with Bun [workspaces](https://bun.com/docs/pm/workspaces)
    - Used Bun react template and most of its structure to kickoff the frontend
- Used Cursor Agent to kickoff the parsing logic and the API schema
- Added validations for macros, serving units and calories only
- Calories validation
    - After researching on how to validate the caloric value based on macros, I decided to use the 4-4-9 rule, where: `calories = ((protein * 4) + (carbs * 4) + (fat * 9))`
    - I focused on macros and calories for calculations disregard serving or any other info.
    - To handle estimate calories inconsistencies, I defined a variation of a third from the given values and the macros based calculations.

### What I Didn’t Build (and why)

- Mostly anything that wasn’t explicitly required to save time.
- Additional computations and conversions over other properties once my nutrition knowledge is limited to what I learned from this assessment.
- No fancy UI at all: it usually takes time to have something that really stands out, once I really enjoy it, I would probably spend more time than I should.

### What I’d Do Next

- Definitely dig deeper on nutrition essentials for better insights! 😅
- Finish projects setup with additional SDLC tools to enhance DX, lke linters and pipelines;
- Make sure data and calculations are reliable and write tests to keep consistency.
- Further UI/UX focused tweaks to enrich product value, like useful processed data and filters.