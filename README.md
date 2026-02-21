# OR Tambo Premium Parking — Management System

A full-stack parking management platform built for **OR Tambo Premium Parking (South Africa)**, replacing a legacy Excel-based workflow with an automated, data-driven solution. The system handles everything from booking intake to revenue analytics, with AI-powered admin tooling built in.
<!--  -->
---

OR Tambo Premium Parking had been operating for years with a fully manual workflow, leading to:

- Untracked cancellations and lost leads
- Manual conversion of bookings from inquiries
- Frequent revenue loss due to unmonitored overstays
- Manual invoice and confirmation generation
- No marketing data or customer interaction tracking
- Time-consuming manual revenue reporting

---

## Key Features

### Booking & Operations

- **Automated booking pipeline** — inquiries are converted and confirmed without manual intervention
- **Automated check-in & check-out** — reduces front-desk overhead and human error
- **Overstay tracking** — real-time detection and logging to prevent revenue leakage
- **Cancellation & lead tracking** — every stage of the customer lifecycle is recorded
- **CSV import** — bulk-import bookings from spreadsheets with automatic deduplication
- **Google Sheets webhook** — live intake from external booking forms

### Communications & Documents

- **Automated confirmation emails** via **Brevo API** — sent on every booking
- **Auto-generated invoices and receipts** — PDF generation with no manual document creation
- **Customer interaction tracking** — every touchpoint captured for future marketing use

### Analytics & Reporting

- **Revenue statistics dashboard** — calculated automatically, no more spreadsheets
- **Customer analytics** — general statistics surfaced from booking and interaction data

### AI-Powered Admin Tooling

- **Conversational chatbot** — admins can query booking data in plain English using the **Gemini API**
- **Voice interface** — admins can speak queries instead of typing, powered by **ElevenLabs** speech-to-text

### Authentication & Security

- **JWT-based authentication** — secure admin login with token-based sessions
- **Audit logging** — every booking state change is recorded with actor and timestamp

---

## Tech Stack

| Layer              | Technology                                              |
| ------------------ | ------------------------------------------------------- |
| **Frontend**       | React, TypeScript, Vite, Tailwind CSS, shadcn/ui        |
| **State & Data**   | TanStack Query, React Hook Form, Zod                    |
| **Backend**        | Python, FastAPI, SQLAlchemy, Pydantic                    |
| **Database**       | PostgreSQL (via Supabase)                                |
| **Auth**           | JWT (python-jose), bcrypt                                |
| **AI / NLP**       | Google Gemini API                                        |
| **Voice**          | ElevenLabs API                                           |
| **Email**          | Brevo API                                                |
| **Infrastructure** | Docker, DigitalOcean                                     |
| **Code quality**   | CodeScene                                                |


## License

This project was developed for **OR Tambo Premium Parking** and is proprietary. All rights reserved.
