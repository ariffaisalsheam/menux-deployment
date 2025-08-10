---
type: "always_apply"
---

Menu.X AI & Development Guidelines
This document provides the official rules and best practices for developing the Menu.X application. Following these guidelines will ensure the project is secure, maintainable, and built to a professional standard.

1. AI Integration Rules (Google Gemini)
This section covers the rules for using the Google Gemini API for the "Pro" features in Menu.X.

1.1. API Key Security is Critical
NEVER write your Gemini API key directly in the code (e.g., in a .java or .tsx file).

Backend: The API key must be loaded from an environment variable. In the application.yml file, use the placeholder ${GEMINI_API_KEY}.

Frontend: For local testing, the key should be stored in the .env.local file, which is included in .gitignore and will not be committed to GitHub.

1.2. Defined AI Features
The AI will be used for two specific features available only to "Pro" subscribers:

AI Description Writer: Automatically generates creative and appealing descriptions for menu items.

AI Feedback Analyzer: Analyzes customer feedback to provide sentiment analysis and actionable insights.

1.3. Standardized AI Prompts
To ensure consistent and high-quality results from the Gemini API, use the following prompts when building the features.

For Menu Item Descriptions:

"You are an expert food writer for a restaurant menu. Generate a creative and appealing one-sentence description for the following menu item: [Menu Item Name]. The description should be brief, enticing, and make the customer want to order it."

For Feedback Analysis:

"You are an AI assistant for a restaurant manager. Analyze the following customer feedback and provide a one-sentence summary of the overall sentiment (Positive, Negative, or Neutral) and list the key points or suggestions mentioned by the customer. Feedback: '[Customer Feedback Text]'"

1.4. Error Handling
Your backend code must gracefully handle situations where the Gemini API might be unavailable or return an error. The application should not crash. Instead, it should return a user-friendly message like, "The AI service is temporarily unavailable. Please try again later."

2. General Development Best Practices
2.1. Version Control (Git)
Commit Frequently: Save your work with git commit often, after completing a small, logical change.

Clear Commit Messages: Write clear messages that explain what you changed and why. (e.g., feat: Add user registration API endpoint).

Use Feature Branches: For new features, create a new branch (e.g., git checkout -b feature/user-login). This keeps your main branch clean and stable.

2.2. Configuration Management (Spring Boot)
Use Profiles: Keep your local development and production configurations separate using application-dev.yml and application-prod.yml.

Environment Variables for Secrets: All sensitive data (database passwords, API keys, JWT secrets) must be loaded from environment variables in the production profile.

2.3. API Design (Backend)
Use a Layered Architecture: Structure your backend into Controller, Service, and Repository layers to keep your code organized.

Use DTOs (Data Transfer Objects): Never expose your database entities directly in your API. Create separate DTO classes for API requests and responses to control exactly what data is sent and received.

Handle Errors Gracefully: Use a global exception handler (@ControllerAdvice) to provide clear and consistent error messages to the frontend.

2.4. Security (Backend)
Handle Authentication in the Backend: Use Spring Security with JWT to manage user login, registration, and session management.

Secure Endpoints: Use role-based security to protect your API endpoints. Ensure that only a Restaurant Owner can manage their menu and only a Super Admin can manage users.

2.5. Styling (Frontend)
Use Tailwind CSS: Use Tailwind's utility classes for all styling. This keeps your styling consistent and your CSS files small.

Use shadcn/ui for Components: For UI components like buttons, forms, and dialogs, use the npx shadcn-ui@latest add command to add them to your project. This gives you full control over their appearance and behavior. https://ui.shadcn.com/docs