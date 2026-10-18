import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Video,
  Code2,
  Github,
  Mail,
  MessageSquare,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Send,
  Leaf,
  Rocket,
  AlertCircle,
  Lightbulb,
  Users,
} from 'lucide-react';

export const HelpSupportView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSuccess, setContactSuccess] = useState(false);

  const faqs = [
    {
      q: 'What is GridHeal and what problem does it solve?',
      a: 'GridHeal is a closed-loop, software-defined microgrid digital twin that predicts energy imbalances, autonomously reallocates available battery and EV resources, and verifies critical load recovery. It solves the vulnerability of renewable microgrids to sudden faults, cloud covers, and demand spikes without relying on dirty fossil generators.',
    },
    {
      q: 'How do I run a simulation?',
      a: 'Navigate to Overview or Microgrid Twin and click "Run Simulation" or "Start Simulation". You can observe live power flows across solar arrays, battery storage (BESS), EV chargers, and critical hospital circuits.',
    },
    {
      q: 'What types of faults can I simulate?',
      a: 'The Fault Simulation Studio supports 6 edge disturbances: Sudden Solar Generation Loss (e.g. 50% cloud cover), Severe Demand Surge (+40 kW), Battery Inverter Trip, EV Fleet Peak Demand, Main Utility Grid Outage (Islanding), and SCADA Communication Degradation.',
    },
    {
      q: 'How does the recovery process work?',
      a: 'GridHeal executes an automated 4-step loop: 1. DETECT (identifies power imbalance via telemetry rules), 2. PREDICT (short-horizon ML forecast estimates shortfall 45 min ahead), 3. REALLOCATE (Mixed-Integer Linear Optimizer schedules battery discharge and defers non-urgent EV charging), 4. VERIFY (recomputes Kirchhoff nodal balance, confirms zero critical load shed, and checks physical invariants).',
    },
    {
      q: 'Can I change the microgrid configuration?',
      a: 'Yes! The Settings page allows operators and researchers to configure solar nameplate capacity, battery BESS kWh, C-rate, minimum state of charge (SoC), EV charger power, and penalty weights.',
    },
    {
      q: 'Is this project a real-world controller?',
      a: 'GridHeal is a software-defined digital twin simulation designed for research, testbed verification, and hackathon evaluation. Its control models and Pareto optimization algorithms are directly portable to real industrial SCADA / microgrid controllers.',
    },
    {
      q: 'Where can I find the dataset and models used?',
      a: 'The Prediction Centre employs physics-informed time-series models (Hybrid ARIMA + LSTM) trained on deterministic high-resolution solar irradiance and smart-meter load curves.',
    },
    {
      q: 'How do I export results and reports?',
      a: 'You can export complete SQLite-backed audit trails and benchmark evaluation metrics in CSV format by clicking "Export CSV" or "Export Report" on the Overview, Benchmark, or Event Logs pages.',
    },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Help & Support
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Find answers, get assistance, and make the most of GridHeal.
        </p>
      </div>

      {/* Need Immediate Help Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">Need immediate help?</div>
            <div className="text-[11px] text-slate-600">
              Our support team is here to help you. Reach out anytime.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setContactSuccess(true);
            setTimeout(() => setContactSuccess(false), 2500);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#2E7D32] px-4 py-2 text-xs font-bold text-white hover:bg-[#256829] shadow-xs transition-colors shrink-0"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>{contactSuccess ? 'Support Request Sent!' : 'Contact Support'}</span>
        </button>
      </div>

      {/* Top 4 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documentation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Documentation</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete guides, feature explanations and technical reference.
            </p>
          </div>
          <button
            onClick={() => setOpenFaq(0)}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <span>View Docs</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Video Tutorials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Video Tutorials</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Step-by-step walkthroughs for all major features.
            </p>
          </div>
          <a
            href="#faq"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <span>Watch Now</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* API Reference */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">API Reference</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Explore endpoints and integration details (Python + SQLite).
            </p>
          </div>
          <a
            href="#faq"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <span>View API Docs</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* GitHub Repository */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-3">
              <Github className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">GitHub Repository</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Source code, issues, and contribution guidelines.
            </p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <span>View on GitHub</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left 9 cols (FAQ Accordion + Contact Support) & Right 3 cols (System Status + Quick Links + Quote) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Frequently Asked Questions Accordion (8 cols) */}
            <div id="faq" className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Frequently Asked Questions
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">View All FAQs &gt;</span>
              </div>

              <div className="space-y-2">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100/60 bg-white">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Support Options (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Mail className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contact Support
                </h2>
              </div>
              <p className="text-xs text-slate-500">Choose the best way to reach us</p>

              <div className="space-y-3 text-xs">
                {/* Email */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-emerald-600" />
                      Email Us
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      support@gridheal.in
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      We&apos;ll respond within 24 hours.
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1" />
                </div>

                {/* Live Chat */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      Live Chat
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Available Mon – Fri, 9:00 AM – 6:00 PM
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Chat with our support team.
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1" />
                </div>

                {/* Documentation */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      Documentation
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Read our detailed guides and FAQs for quick answers.
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1" />
                </div>

                {/* GitHub Issues */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Github className="h-3.5 w-3.5 text-emerald-600" />
                      GitHub Issues
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Report bugs or suggest features.
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      Open an issue &rarr;
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Support Resources */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Support Resources</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Rocket className="h-4 w-4 text-emerald-600" /> Getting Started
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Quick setup and first run guide.
                </p>
                <div className="text-[10px] font-bold text-emerald-700 pt-1">View Guide &rarr;</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Common Issues
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Solutions for frequently reported problems.
                </p>
                <div className="text-[10px] font-bold text-emerald-700 pt-1">View Issues &rarr;</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Lightbulb className="h-4 w-4 text-emerald-600" /> Best Practices
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tips for optimal simulation and analysis.
                </p>
                <div className="text-[10px] font-bold text-emerald-700 pt-1">View Tips &rarr;</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Users className="h-4 w-4 text-blue-500" /> Community
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Join our developer community and share your ideas.
                </p>
                <div className="text-[10px] font-bold text-emerald-700 pt-1">Join Now &rarr;</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* System Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
            <span className="font-bold text-slate-900 block">System Status</span>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 text-emerald-950 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>All Systems Operational</span>
            </div>
            <div className="text-[10px] text-slate-500">
              GridHeal services are running normally.
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-slate-600">
                <span>Simulation Engine</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Database (SQLite)</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Forecasting Module</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Recovery Controller</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Web Application</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span>Last updated: May 4, 2025 11:42 AM</span>
              <button className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800">
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
            <span className="font-bold text-slate-900 block">Quick Links</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-800 text-[11px]">
                    Project Presentation Guide
                  </div>
                  <div className="text-[10px] text-slate-400">Tips for demo and evaluation</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-800 text-[11px]">
                    Troubleshooting Guide
                  </div>
                  <div className="text-[10px] text-slate-400">Common issues and solutions</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-800 text-[11px]">Feature Roadmap</div>
                  <div className="text-[10px] text-slate-400">Planned improvements and future work</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Quote Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs flex items-start gap-2.5">
            <Leaf className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <blockquote className="text-xs text-emerald-950 font-medium italic leading-relaxed">
              &ldquo;Better decisions today. A cleaner, more resilient tomorrow.&rdquo;
              <span className="block text-[10px] text-emerald-700 not-italic mt-1">— GridHeal Team</span>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};
