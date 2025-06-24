# Genesis Heritage Pro

**Genesis Heritage Pro** is a revolutionary platform designed for the [Bolt.new Hackathon](https://bolt.new). It seamlessly fuses deep cultural heritage with powerful business automation, empowering users to honor their past while building their future.

[![Genesis Heritage Pro Demo](./docs/demo_screenshot.png)](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
_Click to watch a demo of the platform in action._

---

## ✨ Core Features

- **Advanced AI Chat:** A multi-provider AI assistant (OpenAI, Gemini, Anthropic) with long-term memory, powered by a semantic knowledge base and circuit-breaker resilience.
- **Cultural-Business Fusion:** Uncover actionable business insights from cultural traditions, stories, and historical data.
- **Intelligent Automation Hub:** Automate business processes with a voice-activated workflow engine.
- **Predictive Analytics:** Forecast business trends and user engagement with our built-in analytics engine.
- **Deep Heritage Tools:** Explore your ancestry with DNA insights, voice cloning for family stories, and an interactive family tree visualizer.
- **Enterprise-Grade Backend:** Built on Supabase with a robust schema, Row Level Security, and optimized RPC functions for performance and scalability.

---

## 🚀 Technical Architecture

Our platform is built on a modern, scalable stack designed for performance and rapid development.

```mermaid
graph TD
    A[Frontend: React/Vite] --> B{Supabase};
    B --> C[Auth];
    B --> D[Postgres Database];
    B --> E[Storage];
    B --> F[Edge Functions];
    
    F --> G[AI Router];
    G --> H[OpenAI];
    G --> I[Gemini];
    G --> J[Anthropic];

    D -- RLS --> K[User Data];
    D -- pg_vector --> L[Knowledge Base];
    
    A -- REST --> F;
    A -- Realtime --> D;

    subgraph "Frontend"
        A
    end

    subgraph "Backend (Supabase on Bolt.new)"
        B C D E F
    end

    subgraph "AI Providers"
      G H I J
    end
```

- **Frontend:** React with Vite for a lightning-fast development experience.
- **Backend:** Supabase handles authentication, database (Postgres), file storage, and serverless Edge Functions.
- **Database:** Leverages advanced Postgres features like RLS for security and `pg_vector` for semantic search.
- **AI Integration:** A custom AI router with a circuit breaker intelligently queries multiple top-tier AI models for optimal results.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn / pnpm
- Supabase Account
- API keys for OpenAI, Gemini, and/or Anthropic

### Local Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/genesis-heritage-pro.git
    cd genesis-heritage-pro
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Supabase:**
    - Create a new project on [Supabase](https://supabase.com).
    - In the SQL Editor, run the schema from `supabase/market_ready_schema.sql`.
    - (Optional) Run the seed script from `supabase/seed.sql`.
    - Run the RPC functions script from `supabase/rpc_functions.sql`.

4.  **Configure Environment Variables:**
    - Create a `.env` file in the root of the project.
    - Copy the contents of `.env.example` (if available) or add the following:
      ```env
      VITE_SUPABASE_URL=your-supabase-project-url
      VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
      
      VITE_OPENAI_API_KEY=your-openai-key
      VITE_GEMINI_API_KEY=your-gemini-key
      VITE_ANTHROPIC_API_KEY=your-anthropic-key
      ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The app should now be running on `http://localhost:5173`.

### Deploying Supabase Functions

- Install the Supabase CLI: `npm install -g supabase`
- Log in: `supabase login`
- Link your project: `supabase link --project-ref <your-project-id>`
- Deploy a function: `supabase functions deploy <function-name>`

---

## 🏆 Hackathon Focus: "Why Bolt.new?"

We leveraged the **Bolt.new** platform to its fullest:
- **Rapid Prototyping:** Supabase's all-in-one backend allowed us to build secure, complex features in record time.
- **Scalable AI:** Easy integration with serverless Edge Functions enabled us to build a sophisticated, multi-provider AI router without managing our own infrastructure.
- **Advanced Database Features:** Direct access to Postgres and extensions like `pg_vector` was critical for implementing our innovative semantic search and knowledge base features.

Bolt.new was not just a platform; it was an accelerator that enabled us to focus on our unique vision of fusing culture and business.