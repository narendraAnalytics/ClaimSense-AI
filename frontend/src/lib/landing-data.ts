import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  Network,
  CheckCircle2,
  Loader2,
  Brain,
  Activity,
  FileText,
  Sparkles,
  Workflow,
  Search,
  Lock,
  Gauge,
  CreditCard,
  Database,
} from "lucide-react";

export const navLinks = ["AI Agents", "Solutions", "Pricing", "Contact"];

export type AgentCard = {
  name: string;
  model: string;
  icon: LucideIcon;
  stateIcon: LucideIcon;
  color: string;
  color2: string;
  tint: string;
  progress: string;
  status: string;
};

export const agentCards: AgentCard[] = [
  {
    name: "Intake Supervisor",
    model: "Sarvam-30B",
    icon: Bot,
    stateIcon: CheckCircle2,
    color: "#0ea77a",
    color2: "#34d399",
    tint: "rgba(16,185,129,.14)",
    progress: "100%",
    status: "Workspace created · agents dispatched",
  },
  {
    name: "Policy Coverage",
    model: "Sarvam-30B",
    icon: ShieldCheck,
    stateIcon: CheckCircle2,
    color: "#0891b2",
    color2: "#22d3ee",
    tint: "rgba(34,211,238,.14)",
    progress: "100%",
    status: "Eligible · 98% coverage confirmed",
  },
  {
    name: "Fraud Detection",
    model: "Sarvam-30B",
    icon: ShieldAlert,
    stateIcon: Loader2,
    color: "#e11d48",
    color2: "#fb7185",
    tint: "rgba(251,113,133,.14)",
    progress: "72%",
    status: "Risk scoring · patterns clean so far",
  },
  {
    name: "Historical Similarity",
    model: "Qdrant Vector DB",
    icon: Network,
    stateIcon: Loader2,
    color: "#d97706",
    color2: "#fbbf24",
    tint: "rgba(245,158,11,.15)",
    progress: "58%",
    status: "Semantic search across 48K claims",
  },
];

export type FloatIcon = {
  icon: LucideIcon;
  top: string;
  left: string;
  color: string;
  duration: string;
  depth: number;
};

export const floatIcons: FloatIcon[] = [
  { icon: Brain, top: "-8%", left: "12%", color: "#0ea77a", duration: "6s", depth: 1.1 },
  { icon: Activity, top: "6%", left: "104%", color: "#e11d48", duration: "7s", depth: 1.8 },
  { icon: FileText, top: "62%", left: "105%", color: "#d97706", duration: "6.5s", depth: 1.4 },
  { icon: Sparkles, top: "96%", left: "58%", color: "#db2777", duration: "5.8s", depth: 2.0 },
  { icon: Workflow, top: "108%", left: "16%", color: "#0891b2", duration: "7.2s", depth: 1.2 },
];

export type TrustBadge = {
  icon: LucideIcon;
  label: string;
};

export const trustBadges: TrustBadge[] = [
  { icon: Bot, label: "9 AI Agents" },
  { icon: Brain, label: "Sarvam AI Powered" },
  { icon: Workflow, label: "LangGraph Orchestrated" },
  { icon: Search, label: "Qdrant Semantic Search" },
  { icon: Lock, label: "Enterprise Security" },
  { icon: Gauge, label: "95% Faster Claims Processing" },
  { icon: CreditCard, label: "Razorpay Secure Payments" },
  { icon: Database, label: "Convex Cloud Storage" },
];
