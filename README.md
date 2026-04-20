# 🪝 Hookly

**Hookly** is an AI-powered social media intelligence and creative strategy platform. It allows marketers, creators, and brands to scrape competitor data from top social platforms (TikTok, Instagram, Meta Ads), run deep AI-driven analysis on videos and comments, and automatically generate visual proposals and creative briefs based on proven viral hooks.

---

## ✨ Features

### 📁 Workspace & Project Management
* **Project Silos:** Organize your research, scraping jobs, and creative briefs by product, campaign, or client.
* **Secure Authentication:** Email and password authentication backed by Supabase Auth.

### 🕷️ Advanced Scraping Engine
* **Keyword & Account Tracking:** Search specific keywords or monitor competitor handles across multiple platforms.
* **Meta Ad Library Integration:** Direct integration with the Facebook Ads Library (via Apify) to extract current running ads, impressions, and transparency data.
* **TikTok & IG Reels:** Pull in high-performing organic videos, metrics, and engagement statistics.

### 🧠 AI Post & Comment Analysis
* **Visual Hook Extraction:** AI automatically identifies the opening visual hook of successful posts.
* **"Undeniable Proof" Spotting:** Highlights how successful creators prove their claims in the video.
* **Comment Pain-Point Analysis:** Aggregates hundreds of comments to summarize audience sentiment, recurring questions, and hidden pain points.

### 🎯 Creative Evolution Engine
* **Visual Proposals:** Transforms competitor insights into localized, brand-specific visual themes.
* **Script & Brief Generator:** Automatically writes structured social media video scripts (Visuals paired with Voiceover/Text) that address the exact pain points found in competitor comments.

### 📊 Reporting
* **Report Builder:** Curate top-performing posts, their hooks, and the newly generated creative briefs into a consolidated view for easy sharing.
* **Search History & Data Grids:** Easily trace back previous scrape jobs and view raw scraped content.

### 🎨 Design & UI
* **Hookly Brand Identity:** A sleek, focused dark theme accented with Hookly's signature aesthetic yellow (`#F5C518`).
* Responsive layouts built meticulously with Tailwind CSS and Radix UI primitives.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 18, TypeScript, Vite
* **Routing:** React Router v6
* **State Management:** Zustand
* **Styling:** Tailwind CSS, shadcn/ui
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security)
* **Data Extraction:** Apify SDK

---

## 🚀 Getting Started

### 1. Prerequisites
You will need the following accounts/services set up to run Hookly locally:
* **Node.js** (v18+ recommended)
* **Supabase** account (Create a new project to get your URL and Anon Key)
* **Apify** account (Generate an API token for your scraping calls)

### 2. Clone and Install
```bash
git clone https://github.com/your-username/hookly.git
cd hookly
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
APIFY_API_TOKEN=your_apify_api_token
```

### 4. Database Setup (Supabase)
Run the provided `supabase/schema.sql` (or equivalent migration file) in your Supabase SQL Editor. This will set up the necessary tables:
* `projects`
* `scrape_jobs`
* `raw_posts`
* Plus, the required Row Level Security (RLS) policies.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 📁 Project Structure 

```text
├── src/
│   ├── components/      # Reusable UI components (shadcn ui, layouts)
│   ├── lib/             # Utility functions and Supabase client config
│   ├── pages/           # Route components
│   │   ├── auth/        # Login, Signup
│   │   └── dashboard/   # Dashboard views (Home, Analysis, Builder)
│   ├── store/           # Zustand state stores (authStore.ts)
│   ├── App.tsx          # Main React Router setup
│   └── main.tsx         # App entry point
├── supabase/            # Database schema and SQL migrations
├── index.html           # HTML template
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies and scripts
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE.md file for details.


<img width="1883" height="835" alt="image" src="https://github.com/user-attachments/assets/86cd7bb3-3556-4f5b-8035-e30f35da77dd" />

<img width="910" height="847" alt="image" src="https://github.com/user-attachments/assets/a18a5b33-8dd6-4404-8b53-f0fdee024c5a" />

<img width="1599" height="845" alt="image" src="https://github.com/user-attachments/assets/eadb9440-9d80-4dfa-81ae-fc3ad79d2710" />

<img width="1872" height="829" alt="image" src="https://github.com/user-attachments/assets/3bcbce27-66cf-4d06-80c0-048ca36007fb" />



