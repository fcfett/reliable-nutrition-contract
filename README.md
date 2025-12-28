# Unreliable Nutrition Contract

**Timebox:** 2 hours (hard stop)  
**Expected state:** incomplete, but coherent

---

## Overview

You are building a small React application that displays nutrition log entries coming from multiple sources.

Each source claims to follow a “nutrition entry” contract. In practice, the contract drifts.

Your task is to design and implement a strategy to fetch, parse, validate, normalise, and render these entries in a way that is honest about uncertainty and inconsistency.

This is not a UI challenge.  
This is not a completeness challenge.  
This is a decision-making challenge.

You will not finish everything. That is expected.

---

## Tech constraints

You must use:
- TypeScript  
- React  
- TanStack Query  

You are expected to think schema-first.

UI can be minimal.  
Tests are explicitly not required.

---

## The problem

The API returns nutrition log entries from multiple sources.

Each source may differ in latency, reliability, and completeness; loading and error states should be handled per-source.

Each source uses a slightly different shape.  
Some fields are missing, renamed, retyped, or expressed in different units.  
Sources vary in reliability and internal consistency.

At least one entry contains calories that do not align with its macros.

You must choose how to handle this.

There is no single correct answer.  
There are defensible answers and indefensible ones.

---

## What to build

- A small React app that fetches nutrition entries via the provided API  
- A schema or parsing layer that converts raw payloads into an internal model  
- A minimal UI that renders entries without crashing or lying  
- Clear handling of invalid, unknown, or inconsistent data  

---

## What we care about

We are evaluating:
- How you decompose the problem  
- The trade-offs you make (and don’t make)  
- How you reason under uncertainty  
- Whether your solution is coherent given the constraints  
- Whether you stop intentionally rather than run out of time accidentally  

---

## What we do not care about

- Visual polish  
- Feature completeness  
- Perfect coverage of edge cases  
- Tests  

---

## Submission requirements

Submit the repo as-is at the 2-hour mark.

We may review your commit history as part of the evaluation. Atomic, intentional commits are encouraged.

Your README must contain **exactly** these sections (no more, no less):

- Assumptions  
- Decisions & Trade-offs  
- What I Didn’t Build (and why)  
- What I’d Do Next  

You may fail this task and still pass the process.  
You may “finish” this task and still fail the process.

Clarity of thinking matters more than output.

---

## API notes

This folder contains a tiny mock API used by the frontend.

You may modify it if you wish, but you do not have to.

**Endpoint:**

`GET /entries?source=a|b|c|d`

Each source returns nutrition log entries with a different payload shape.