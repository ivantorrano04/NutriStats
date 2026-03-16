# **App Name**: NutriScan AI

## Core Features:

- User Authentication & Profile Management: Secure user registration, login, and profile management to store personal data like weight, height, age, activity level, and calorie goals. Data will be stored in a relational database.
- AI Meal Analysis Tool: Utilize a generative AI tool to analyze uploaded or captured food images to estimate nutritional information (calories, protein, carbs, fats). This feature handles Groq API calls with robust error handling, allowing manual data entry upon AI failure.
- Meal Logging & Daily Tracking: Enable users to log meals with details like date, name, estimated nutrients, and an optional image (base64 URI). Display a daily overview of consumed meals and macro-nutrients against set goals.
- Nutritional Dashboard: Provide a comprehensive dashboard displaying daily summaries, including 'Macros del Día' and 'Comidas de Hoy'. Incorporate interactive elements for meal review and quick actions.
- Statistical Data Visualization: Visualize nutritional progress through charts and graphs in the 'Estadísticas' tab, showing 'Calorías vs. Meta' and 'Registro Semanal' for calories and macro trends over time.
- Meal History and Editing: Access and review a history of logged meals. Provide functionality through modal interfaces to edit or delete previous meal entries, retaining the associated image and analysis data.
- Full Spanish Localization: All application text, including onboarding flows, dashboard elements, and profile settings, will be localized in Spanish to ensure a fully native user experience.

## Style Guidelines:

- Overall Color Scheme: Dark theme, using a base background of a very deep neutral gray (#121212) to create a professional and calm user interface.
- Primary Color: A professional, deep violet-blue (#333399), used for key interactive elements, headings, and accents, ensuring high contrast with the dark background.
- Accent Color: A bright and clean sky blue (#59B8F7), providing visual pop for calls-to-action, highlights, and important notifications, complementing the primary color without clashing.
- Surface/Card Color: Dark charcoal gray (#1E1E1E) for card backgrounds and content containers, offering subtle differentiation from the main background while maintaining the dark aesthetic.
- Headline font: 'Space Grotesk' (sans-serif) for its modern, tech-inspired aesthetic, suitable for clear and impactful titles and section headings.
- Body font: 'Inter' (sans-serif) for excellent legibility across various screen sizes, making it ideal for detailed nutritional information, logs, and general body text.
- Main Navigation: Implement a clear and accessible navigation structure (e.g., persistent top or side navigation bar on desktop, or a responsive bottom navigation for mobile viewports) to facilitate switching between Home, Log, Statistics, and Profile sections.
- Loading States: Utilize 'skeleton loading' (shimmer effect) for lists and data-heavy components to provide a smooth user experience during data fetching.