# Exceler A

Exceler A is a self-directed learning workspace built around the Brooklyn College computer science degree path. It combines structured teaching, real practice, course progress, and a visual degree map in one focused interface.

The project is built by Daniel Lezhanskiy and is currently centered on CISC 1115: Introduction to Programming Using Java.

## What It Includes

- A 24-chapter CISC 1115 course with prerequisite-safe sequencing
- Detailed lessons, worked examples, edge cases, reviews, and cumulative practice
- Checked exercises with hints, attempts, difficulty levels, and completion states
- Course progress based on meaningful chapter completion rather than estimated time
- A visual Brooklyn College computer science degree map
- Local DegreeWorks PDF import for updating a private degree view
- Browser-local progress saving with portable export and import backups
- A contextual AI tutor in the private local workspace

## Privacy and the Public Site

The public site starts with a clean, anonymous profile. A visitor's learning progress stays in that visitor's browser and does not expose Daniel's personal GPA, DegreeWorks audit, or course history.

DegreeWorks imports are processed for the local experience and are not included in this repository. The AI tutor is also disabled on the public deployment so an unrestricted visitor cannot use the project's private OpenAI API key.

## Run Locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev -- --port 1300
```

Then open [http://localhost:1300](http://localhost:1300).

The learning workspace works without an API key. To enable the private AI tutor, create a `.env.local` file:

```bash
OPENAI_API_KEY=your_key_here
```

Never commit that file or paste the key into client-side code.

## Validate the Project

```bash
npm run build
npm test
npm run audit:continuity
```

## Status

Exceler A is an independent student-built project. It is not an official Brooklyn College product and does not replace the college catalog or academic advising. Requirements can change, so degree-planning information should be confirmed with official college sources.

The course library will expand beyond CISC 1115 as the project develops.

## Author

Built by Daniel Lezhanskiy.
