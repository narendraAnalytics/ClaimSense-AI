import type { LucideIcon } from "lucide-react";
import {
  Scale,
  Activity,
  FileText,
  Users,
  Mic,
  GraduationCap,
  Calendar,
  Wallet,
  Image as ImageIcon,
  Newspaper,
  Camera,
  Eye,
} from "lucide-react";

export type Project = {
  name: string;
  category: string;
  description: string;
  stack: string;
  icon: LucideIcon;
  color: string;
  tint: string;
};

export const projects: Project[] = [
  {
    name: "Vaakya",
    category: "Legal AI",
    description:
      "Autonomous multi-agent platform eliminating the legal document bottleneck for Indian SMBs — drafting, contract review, redlining, risk detection.",
    stack: "Python · FastAPI · Supabase · LangGraph · Next.js 16",
    icon: Scale,
    color: "#0ea77a",
    tint: "rgba(16,185,129,.14)",
  },
  {
    name: "Navajeevana Ortho",
    category: "Healthcare AI",
    description:
      "AI-powered customer ticketing system resolving patient queries in under 3 seconds, with appointment booking.",
    stack: "Python · FastAPI · LangGraph · Neon · Next.js 16",
    icon: Activity,
    color: "#e11d48",
    tint: "rgba(251,113,133,.14)",
  },
  {
    name: "NivedanAI",
    category: "Agentic AI",
    description:
      "Autonomous multi-agent SaaS transforming how agencies, freelancers, and sales teams respond to RFPs — end-to-end proposal intelligence.",
    stack: "Next.js 15 · Google ADK · Neon · Inngest · Tavily MCP",
    icon: FileText,
    color: "#0891b2",
    tint: "rgba(34,211,238,.14)",
  },
  {
    name: "PratibhaAI",
    category: "Recruiting AI",
    description:
      "Multi-agent SaaS that autonomously screens resumes, validates GitHub profiles, detects fraud, scores candidates, and delivers explainable hiring reports.",
    stack: "Next.js 16 · Google ADK · Neon · Drizzle ORM · Resend",
    icon: Users,
    color: "#d97706",
    tint: "rgba(245,158,11,.15)",
  },
  {
    name: "Viswasethu",
    category: "Voice AI",
    description:
      "Voice-first language learning for migrant workers — job-specific foreign-language communication taught from native Indian languages.",
    stack: "Next.js 16 · Neon · Google ADK · Vercel",
    icon: Mic,
    color: "#db2777",
    tint: "rgba(219,39,119,.14)",
  },
  {
    name: "TutorTalk",
    category: "Ed-Tech AI",
    description:
      "AI-powered voice learning SaaS putting a personal tutor and exam conductor in every student's pocket.",
    stack: "Next.js 16 · Neon · Clerk · Gemini Voice",
    icon: GraduationCap,
    color: "#0a6b55",
    tint: "rgba(10,107,85,.14)",
  },
  {
    name: "ActaFlow",
    category: "Meeting AI",
    description:
      "AI meeting intelligence converting recordings into action items, assignments, and automated attendee summaries.",
    stack: "Next.js 16 · Neon · Inngest · Cloudinary · Resend",
    icon: Calendar,
    color: "#0ea77a",
    tint: "rgba(16,185,129,.14)",
  },
  {
    name: "DueMate",
    category: "Fintech AI",
    description:
      "AI payment-reminder SaaS — Gemini extracts invoice data, Inngest schedules multi-channel reminders, Resend delivers them automatically.",
    stack: "Gemini 3.1 · Inngest · Resend · PostgreSQL",
    icon: Wallet,
    color: "#d97706",
    tint: "rgba(245,158,11,.15)",
  },
  {
    name: "Thumbl",
    category: "Creative AI",
    description:
      "Viral thumbnails with perfect text, zero design skills needed — turns ideas into click-worthy visuals instantly.",
    stack: "Next.js 16 · Gemini Pro Vision · Neon · ImageKit.io",
    icon: ImageIcon,
    color: "#f472b6",
    tint: "rgba(244,114,182,.16)",
  },
  {
    name: "NewsPulseAI",
    category: "Automation",
    description:
      "Monitors YouTube channels and delivers designed email digests at 6 AM, fully automated.",
    stack: "Next.js · Gemini · Cron · Resend",
    icon: Newspaper,
    color: "#0891b2",
    tint: "rgba(34,211,238,.14)",
  },
  {
    name: "Professional Lifestyle Shoot",
    category: "Generative AI",
    description:
      "Full-stack app leveraging AI to generate, customize, and manage professional lifestyle photoshoots.",
    stack: "Next.js · AI Imaging · GCP · TypeScript",
    icon: Camera,
    color: "#e11d48",
    tint: "rgba(251,113,133,.14)",
  },
  {
    name: "QuickSpot",
    category: "Brain Training",
    description:
      "AI-powered brain training platform generating unlimited spot-the-difference puzzles to sharpen observation and focus.",
    stack: "Next.js 16 · Google Gemini · Neon · Tailwind CSS",
    icon: Eye,
    color: "#0a6b55",
    tint: "rgba(10,107,85,.14)",
  },
];
