# MediGen Project Overview for Gemini CLI

This `GEMINI.md` file provides essential context and guidelines for the Gemini CLI when interacting with the MediGen project. Its purpose is to ensure that generated code and responses align with the project's established conventions and architecture.

## 1. Project Overview

MediGen is an AI-powered web application designed to assist medical professionals and students with provisional diagnoses, clinical question answering, and medical content generation. It leverages Google Gemini via Genkit for its core AI capabilities.

*   **Frontend**: Next.js (React), TypeScript, Tailwind CSS, Radix UI (via Shadcn UI).
*   **Backend**: Next.js API Routes, Genkit AI flows.
*   **Data & Auth**: Firebase (Firestore, Cloud Storage, Authentication).
*   **Document Generation**: Client-side PDF (`jspdf`) and DOCX (`docx`) generation.

## 2. Coding Conventions and Style

*   **Language**: Primarily TypeScript (`.ts`, `.tsx`). All new code should be strongly typed.
*   **Framework**: React functional components with Hooks.
*   **Styling**: Utility-first approach using Tailwind CSS classes. Prefer existing Shadcn UI components.
*   **Naming**: Use `camelCase` for variables and functions, `PascalCase` for components and types.
*   **Imports**: Absolute imports from `src/` are preferred (e.g., `@/components/Button`).
*   **Comments**: Add comments sparingly, focusing on *why* complex logic is implemented, not *what* it does.

## 3. Architectural Patterns

*   **Full-stack Next.js**: UI and API routes coexist within the Next.js application.
*   **AI Flows (Genkit)**: AI logic is encapsulated in Genkit flows (`src/ai/flows/`). These flows define structured inputs and outputs for AI model interactions.
*   **Firebase Integration**: Data persistence (Firestore) and file storage (Cloud Storage) are handled via Firebase. Authentication is also Firebase-based.
*   **Client-Side Document Generation**: PDF and Word document generation occurs in the browser, not on the server.

## 4. Development Workflow and Commands

*   **Development Server**: `npm run dev` (starts Next.js app)
*   **Genkit Dev Server**: `npm run genkit:dev` or `npm run genkit:watch` (essential for AI flows)
*   **Build**: `npm run build`
*   **Linting**: `npm run lint`
*   **Type Checking**: `npm run typecheck`

## 5. Key Directories to Understand

*   **`src/app/`**: Contains all Next.js pages (UI) and API routes (backend endpoints).
*   **`src/ai/flows/`**: Definitions of all AI-powered functionalities.
*   **`src/components/`**: Reusable React UI components, including Shadcn UI extensions.
*   **`src/lib/`**: Utility functions, Firebase configuration, and design tokens.
*   **`src/types/`**: TypeScript type definitions and Zod schemas for data structures.

## 6. Important Considerations

*   **Error Handling**: Implement robust error handling, especially for API calls and AI interactions.
*   **Authentication**: Ensure all sensitive operations are protected by Firebase Authentication.
*   **Responsiveness**: UI should be fully responsive across desktop, tablet, and mobile devices.
*   **Accessibility**: Adhere to accessibility best practices (ARIA attributes, keyboard navigation, color contrast).

