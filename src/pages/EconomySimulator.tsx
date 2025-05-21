import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Fireworks } from 'fireworks-js';
import { getLeaderboard, addToLeaderboard, type LeaderboardEntry } from '../api/leaderboard';

function formatNumber(value: number) {
  return value.toLocaleString('ru-RU');
}

function getInitialMetrics() {
  return {
    AvPrice: 20, // 40
    COGS: 15, // 30
    C1: 10, // %
    Users: 200,
    CPUser: 20, // 25
    FixCosts: 3000,
    Margin: 0.25,
    AMPPU: 5,
    AMPU: 2,
    Profit: 1000,
    ProfitNet: -6900, // -19000
  };
}

type Metrics = ReturnType<typeof getInitialMetrics>;

type Initiative = {
  title: string;
  description: string;
  apply: (m: Metrics) => Metrics;
  successChance: number;
  partialEffect?: (m: Metrics) => Metrics;
  risk?: { chance: number; effect: (m: Metrics) => Metrics; message: string };
};

type Department = 'acquisition' | 'product' | 'onboarding' | 'admin';

const DEPARTMENTS: { key: Department; label: string; icon: string; desc: string }[] = [
  { key: 'acquisition', label: 'Acquisition', icon: '📈', desc: 'CPUsers↓ from -4$ to -17$\nUsers↑ from 100 to 10,000' },
  { key: 'product', label: 'Product', icon: '🛠️', desc: 'COGS↓ from -3$ to -10$\nAvPrice↑ from $2 to $30' },
  { key: 'onboarding', label: 'Onboarding', icon: '🎓', desc: 'C1↑ from 15% to 120%' },
  { key: 'admin', label: 'Admin', icon: '🏢', desc: 'FixCosts↓ from -900$\nto -20,000$' },
];

const INITIATIVES: Record<Department, Initiative[]> = {
  acquisition: [
    { title: 'Implement Neural Network SEO Text Generator', description: 'Users +100, CPUser -$10', apply: m => recalcMetrics({...m, Users: m.Users + 100, CPUser: Math.max(m.CPUser - 10, 0)}), successChance: 0.7, risk: {chance: 0.25, effect: m => recalcMetrics({...m, C1: m.C1 - 5}), message: 'Over-optimization → C1 -5%'}},
    { title: 'Launch Blog Content Strategy', description: 'Users +300, CPUser -$17, FixCost +$2500 ', apply: m => recalcMetrics({...m, Users: m.Users + 300, CPUser: Math.max(m.CPUser - 17, 0), FixCosts: m.FixCosts + 2500}), successChance: 0.7, risk: {chance: 0.7, effect: m => recalcMetrics({...m, C1: m.C1 - 10}), message: 'Non-targeted traffic → C1 -10%'}},
    { title: 'Launch Media Advertising (PR)', description: 'Users +3000, FixCosts +$25,000', apply: m => recalcMetrics({...m, Users: m.Users + 3000, FixCosts: m.FixCosts + 25000}), successChance: 0.55, risk: {chance: 0.7, effect: m => recalcMetrics({...m, C1: m.C1 - 10}), message: 'Non-targeted traffic → C1 -10%'}},
    { title: 'Scale Working Campaigns', description: 'Users +1,000, CPUser +$2', apply: m => recalcMetrics({...m, Users: m.Users + 500, CPUser: Math.max(m.CPUser + 2, 0)}), successChance: 0.65},
    { title: 'Buy More Contextual Traffic', description: 'Users +5,000, CPUser +$3', apply: m => recalcMetrics({...m, Users: m.Users + 1000, CPUser: Math.max(m.CPUser + 3, 0)}), successChance: 0.65},
    { title: 'Purchase Traffic Across Channels', description: 'Users +10,000, CPUser +$6', apply: m => recalcMetrics({...m, Users: m.Users + 3000, CPUser: Math.max(m.CPUser + 6, 0)}), successChance: 0.65},
    { title: 'Optimize Successful Campaign Budgets', description: 'CPUser -$7', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 7, 0)}), successChance: 0.72, risk: {chance: 0.3, effect: m => recalcMetrics({...m, Users: m.Users - 100}), message: 'Optimization reduced traffic → Users -100'}},
    { title: 'Implement Automated Display Strategies', description: 'CPUser -$4, C1 +1%', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 4, 0), C1: m.C1 + 1}), successChance: 0.75, risk: {chance: 0.2, effect: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser + 1, 0)}), message: 'Learning algorithms → CPUser +1$'}},
    { title: 'Conduct Agency Audit', description: 'CPUser -$5', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 5, 0)}), successChance: 0.7},
    { title: 'Purchase Influencer Advertising', description: 'Users +8000, FixCosts +$75,000', apply: m => recalcMetrics({...m, Users: m.Users + 8000, FixCosts: m.FixCosts + 75000}), successChance: 0.4, risk: {chance: 0.2, effect: m => recalcMetrics({...m, C1: m.C1 - 15}), message: 'Fraud → C1 -15%'}},
    { title: 'Sync Omnichannel Funnel', description: 'CPUser -$6, Users +200', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 6, 0), Users: m.Users + 200}), successChance: 0.7}
  ],
  product: [
    { title: 'Optimize CDN Caching for AI Responses', description: 'COGS -$7', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 7, 1)}), successChance: 0.65 },
    { title: 'Consolidate APIs & Reduce Paid Requests', description: 'COGS -$10', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 10, 1), AvPrice: m.AvPrice + 0}), successChance: 0.8 },
    { title: 'Implement Brotli Data Compression', description: 'COGS -$4', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 4, 1), C1: Math.min(Math.round(m.C1 * 1.0), 100)}), successChance: 0.75 },
    { title: 'Automate Support Requests', description: 'COGS -$3', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 3, 1), FixCosts: m.FixCosts + 0}), successChance: 0.6 },
    { title: 'Migrate Old Emails to Cheap Storage', description: 'COGS -$5', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 5, 1), FixCosts: m.FixCosts + 0}), successChance: 0.6 },
    { title: 'Implement Tier Propensity Models', description: 'AvPrice +$5, C1 +18%', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 5, C1: Math.min(Math.round(m.C1 * 1.18), 100)}), successChance: 0.67 },
    { title: 'Expand Premium Subscription Features', description: 'C1 +18%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.08), 100), COGS: Math.max(m.COGS + 0, 1)}), successChance: 0.63 },
    { title: 'Optimize Tiered Pricing', description: 'C1 +8%, AvPrice +$5', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.08), 100), AvPrice: m.AvPrice + 5}), successChance: 0.7 },
    { title: 'Improve Low CSI Features', description: 'AvPrice +$2, C1 +2%', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 2, C1: Math.min(Math.round(m.C1 * 1.02), 100)}), successChance: 0.67 },
    { title: 'Enhance Brand Archetype Mechanics', description: 'AvPrice +$10, C1 +15%', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 10, C1: Math.min(Math.round(m.C1 * 1.15), 100)}), successChance: 0.67 },
    { title: '🔥 Integrate Crypto Payments via Email', description: 'AvPrice +$30, Users +1500', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 30, Users: m.Users + 1500}), successChance: 0.75 }
  ],
  onboarding: [
    { title: 'Launch Segmented Demo Scenarios', description: 'C1 +35%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.35), 100)}), successChance: 0.62 },
    { title: '🔥 Implement Adaptive Onboarding Quiz', description: 'C1 +80%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.80), 100)}), successChance: 0.68, risk: { chance: 0.3, effect: m => recalcMetrics({...m, Users: m.Users - 400}), message: 'Long quiz → Users -400' } },
    { title: 'Optimize Registration Form', description: 'C1 +25%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.25), 100)}), successChance: 0.55 },
    { title: 'Launch Triggered Tooltips', description: 'C1 +30%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.30), 100)}), successChance: 0.65 },
    { title: 'Add Social Proof Elements', description: 'C1 +60%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.6), 100)}), successChance: 0.68 },
    { title: 'Implement Onboarding Progress Bar', description: 'C1 +20%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.20), 100)}), successChance: 0.9 },
    { title: 'Add Aha-Moment Animation', description: 'C1 +40%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.40), 100)}), successChance: 0.55 },
    { title: 'Implement Live Feature Tags', description: 'C1 +25%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.25), 100)}), successChance: 0.7 },
    { title: 'Launch FAQ Chat Bot', description: 'C1 +15%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.15), 100)}), successChance: 0.72 },
    { title: '🔥 Add Quick-Start Templates', description: 'C1 +120%', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 2.20), 100)}), successChance: 0.8 }
  ],
  admin: [
    { title: 'Outsource Legal Services', description: 'FixCosts -$20,000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 20000, 1000)}), successChance: 0.3, risk: {chance: 0.4, effect: m => recalcMetrics({...m, COGS: m.COGS + 5000}), message: 'Legal errors → COGS +$5000' }},
    { title: 'Optimize Rent Payments', description: 'FixCosts -$15,000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 15000, 1000)}), successChance: 0.55, risk: {chance: 0.35, effect: m => recalcMetrics({...m, Users: m.Users - 500}), message: 'Location downgrade → Users -500' }},
    { title: 'Switch to Remote Work', description: 'FixCosts -$11,000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 11000, 1000)}), successChance: 0.65, risk: {chance: 0.4, effect: m => recalcMetrics({...m, C1: Math.round(m.C1 * 0.90)}), message: 'Loss of control → C1 -10%' }},
    { title: 'Automate Document Flow', description: 'FixCosts -$7,500', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 7500, 1000)}), successChance: 0.75 },
    { title: 'Negotiate Pay-As-You-Go Rates', description: 'FixCosts -$4,800', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 4800, 1000)}), successChance: 0.6 },
    { title: 'Reduce Corporate Events', description: 'FixCosts -$3,200', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 3200, 1000)}), successChance: 0.7 },
    { title: 'Review Billing Contracts', description: 'FixCosts -$2,100', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 2100, 1000)}), successChance: 0.68 },
    { title: 'Optimize Software Licenses', description: 'FixCosts -$900', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 900, 1000)}), successChance: 0.8 }
  ],
};

function recalcMetrics(m: Metrics): Metrics {
  const Margin = (m.AvPrice - m.COGS) / m.AvPrice;
  const AMPPU = m.AvPrice - m.COGS;
  const AMPU = AMPPU * (m.C1 / 100);
  const Profit = (AMPU - m.CPUser) * m.Users;
  const ProfitNet = Profit - m.FixCosts;
  return { ...m, Margin, AMPPU, AMPU, Profit, ProfitNet };
}

type OnboardingStep = {
  title: string;
  content: React.ReactNode;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "InboxMind: Revolution in Work Communications",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p>You are the CEO of a startup creating the first AI-powered email service at SuperHuman level for businesses.</p>
        <p>Your product - InboxMind - is not just an email client but a digital secretary with AI that:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✉️ <b>Automates routine:</b> sorts emails, generates responses, highlights urgent tasks</li>
          <li>🤖 <b>Predicts actions:</b> suggests templates, reminds of deadlines, detects conflicts</li>
          <li>💼 <b>Analyzes style:</b> adapts email tone to corporate culture</li>
          <li>🔒 <b>Prevents errors:</b> blocks emails with typos or confidential data</li>
        </ul>
        <p style={{ fontStyle: 'italic', marginTop: 16 }}>But InboxMind is just a draft of the future. Your startup is teetering on the brink of failure...</p>
      </div>
    )
  },
  {
    title: "Startup Problems",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>Dark clouds over FutureInbox:</p>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>💸 Loss per client:</p>
          <p>COGS = $15 (AI servers + encryption) with subscription price $20</p>
          <p>ARPU = -$3 (you're paying for users instead of earning!)</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>📉 Trust crisis:</p>
          <p>Only 500 corporate clients vs Outlook and Gmail</p>
          <p>Complex interface scares HR directors</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>☠️ Giant threat:</p>
          <p>Microsoft testing Copilot for Outlook. They'll crush the market in 15 months...</p>
        </div>
      </div>
    )
  },
  {
    title: "Your Mission",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 16 }}>Within 15 months (turns):</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 12 }}>🔥 <b>Fix economics:</b> Reduce COGS to $5, raise price to $50</li>
          <li style={{ marginBottom: 12 }}>🚀 <b>Capture niche:</b> 5,000 users - must-have for business</li>
          <li>💎 <b>Create legend:</b> Become "ChatGPT for business correspondence"</li>
        </ul>
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>This is not a game — it's war:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>🎲 Every 3 months — breakthrough or collapse: leaks, investor revolts</li>
            <li>⚡ Balance innovation and survival</li>
            <li>⏳ Race against Microsoft</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Starting Conditions",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>You start here:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <p>🏢 <b>Office:</b></p>
            <p>Co-working space with rented GPU servers</p>
          </div>
          <div>
            <p>👥 <b>Team:</b></p>
            <p>6 developers and a neurolinguist</p>
          </div>
          <div>
            <p>💰 <b>Budget:</b></p>
            <p>$30,000 (last funding round)</p>
          </div>
          <div>
            <p>📊 <b>Metrics:</b></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>Users = 200</li>
              <li>AvPrice = $20</li>
              <li>COGS = $15</li>
              <li>ARPU-CPUsers = -$18</li>
            </ul>
          </div>
        </div>
        <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#0369a1' }}>🌟 Success scenario:</p>
          <p>"Microsoft acquired InboxMind for $5B. Your AI became Outlook's standard!"</p>
        </div>
        <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, color: '#dc2626' }}>💀 Failure scenario:</p>
          <p>"Your code was absorbed by NeuroTech AI. Case study 'How to Kill a Startup'"</p>
        </div>
      </div>
    )
  },
  {
    title: "Tactics: Win Through Unit Economics",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 12 }}>This game will develop your unit economics skills.</p>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 12 }}>
          <li>• Multiple unit levels — make them profitable sequentially</li>
          <li>• First level unit (ARPPU) is profitable, crucial to make 2nd level (ARPU - CPUser) positive</li>
          <li>• While units are negative — each new user brings loss</li>
          <li>• For 3rd level growth (Profit Net) — use hints and optimize costs</li>
        </ul>
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 15, marginTop: 16 }}>
          <b>General tactics:</b> <br />
          1. First make units 1 and 2 profitable<br />
          2. Then scale users and optimize unit 3<br />
          3. Follow hints — they'll help reach profitability!<br />
          <div style={{ marginTop: 14, background: '#fffbe6', color: '#b45309', borderRadius: 6, padding: '8px 12px', fontWeight: 600, fontSize: 16, border: '1px solid #fde68a' }}>
            Your first task — <span style={{ color: '#d97706' }}>reduce CPUsers to $4</span>
          </div>
        </div>
      </div>
    )
  }
];

function VictoryModal({ onRestart, metrics }: { onRestart: () => void; metrics: Metrics }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        transform: show ? 'scale(1)' : 'scale(0.9)',
        opacity: show ? 1 : 0,
        transition: 'all 0.5s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Victory!
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
          You've successfully turned InboxMind into a profitable company!
        </p>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            💰 Profit Net: ${formatNumber(Math.round(metrics.ProfitNet))}
          </div>
         
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            🚀 Goal achieved: Profit Net ≥ $50,000
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            💎 Company ready for scaling
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            🏆 You became a Silicon Valley legend
          </div>
        </div>
        <button
          onClick={onRestart}
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Start New Game
        </button>
      </div>
    </div>
  );
}

function DefeatModal({ onRestart, metrics }: { onRestart: () => void; metrics: Metrics }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        transform: show ? 'translateY(0)' : 'translateY(100vh)',
        opacity: show ? 1 : 0,
        transition: 'all 0.5s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>😔</div>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>Not this time...</h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
          But you gained valuable experience! Now you know more about:
        </p>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            💰 Profit Net: ${formatNumber(Math.round(metrics.ProfitNet))}
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            📈 Product metric management
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            🎯 Balancing risks and opportunities
          </div>
        </div>
        <button
          onClick={onRestart}
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (metrics: Metrics, prevMetrics: Metrics | null, turn: number) => boolean;
  achieved?: boolean;
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_profit',
    title: 'First Profit',
    description: 'Achieve positive Profit Net',
    icon: '💰',
    condition: (m) => m.ProfitNet > 0
  },
  {
    id: 'users_1000',
    title: 'Growing Community',
    description: 'Reach 1000 users',
    icon: '👥',
    condition: (m) => m.Users >= 1000
  },
  {
    id: 'users_5000',
    title: 'Popular Product',
    description: 'Reach 5000 users',
    icon: '🌟',
    condition: (m) => m.Users >= 5000
  },
  {
    id: 'margin_50',
    title: 'Efficient Business',
    description: 'Achieve 50% margin',
    icon: '📈',
    condition: (m) => m.Margin >= 0.5
  },
  {
    id: 'profit_10k',
    title: 'Path to Success',
    description: 'Achieve $10,000 Profit Net',
    icon: '💎',
    condition: (m) => m.ProfitNet >= 10000
  },
  {
    id: 'profit_25k',
    title: 'Steady Growth',
    description: 'Achieve $25,000 Profit Net',
    icon: '🚀',
    condition: (m) => m.ProfitNet >= 25000
  },
  {
    id: 'c1_40',
    title: 'Conversion Master',
    description: 'Achieve 40% conversion',
    icon: '🎯',
    condition: (m) => m.C1 >= 40
  },
  {
    id: 'low_costs',
    title: 'Optimizer',
    description: 'Reduce COGS by 30% from initial value',
    icon: '✂️',
    condition: (m) => m.COGS <= 10.5 // 30 * 0.7
  },
  {
    id: 'quick_growth',
    title: 'Fast Start',
    description: 'Reach 2000 users within first 5 turns',
    icon: '⚡',
    condition: (m, _, turn) => m.Users >= 2000 && turn <= 5
  },
  {
    id: 'perfect_balance',
    title: 'Perfect Balance',
    description: 'Achieve positive values in all key metrics',
    icon: '⚖️',
    condition: (m) => m.ProfitNet > 0 && m.AMPU > 0 && m.Margin > 0 && m.C1 > 20
  }
];











function AchievementNotification({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      opacity: show ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        transform: show ? 'scale(1)' : 'scale(0.9)',
        transition: 'transform 0.3s ease',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎊</div>
        <h3 style={{ 
          fontSize: '24px', 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          New Achievement Unlocked!
        </h3>
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
          color: 'white',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>
            {achievement.icon}
          </div>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '8px',
            fontSize: '18px'
          }}>
            {achievement.title}
          </div>
          <div style={{ 
            fontSize: '14px',
            opacity: 0.8
          }}>
            {achievement.description}
          </div>
        </div>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 500,
            width: '100%',
            transition: 'transform 0.2s ease, opacity 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function AchievementsModal({ achievements, onClose }: { achievements: Achievement[]; onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        transform: show ? 'scale(1)' : 'scale(0.9)',
        opacity: show ? 1 : 0,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Achievements</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: achievement.achieved ? 'linear-gradient(135deg, #000000 0%, #333333 100%)' : '#f5f5f7',
                color: achievement.achieved ? 'white' : '#1d1d1f',
                opacity: achievement.achieved ? 1 : 0.7
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {achievement.icon}
              </div>
              <div style={{ 
                fontWeight: 600, 
                marginBottom: '4px',
                fontSize: '16px'
              }}>
                {achievement.title}
              </div>
              <div style={{ 
                fontSize: '14px',
                opacity: 0.8
              }}>
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}









// Add at the top of the file, after imports
const styles = {
  button: {
    padding: '12px 28px',
    borderRadius: 24,
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.8)',
    fontSize: 17,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  } as const,
  buttonDark: {
    padding: '12px 28px',
    borderRadius: 24,
    border: 'none',
    background: '#000',
    color: '#fff',
    fontSize: 17,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  } as const
};

type MetricKey = keyof Metrics;

const METRIC_LABELS: Record<MetricKey, string> = {
  AvPrice: 'Average Price',
  COGS: 'Cost of Goods Sold',
  C1: 'C1',
  Users: 'Users',
  CPUser: 'Cost per User',
  FixCosts: 'Fixed Costs',
  Margin: 'Margin',
  AMPPU: 'Average Monthly Profit per User',
  AMPU: 'Average Monthly Profit per User',
  Profit: 'Profit',
  ProfitNet: 'Net Profit'
};

const REVERSE_METRIC_LABELS: Record<string, MetricKey> = Object.entries(METRIC_LABELS)
  .reduce((acc, [key, value]) => ({
    ...acc,
    [value]: key as MetricKey
  }), {} as Record<string, MetricKey>);

function getMetricKeyFromLabel(label: string): MetricKey {
  return REVERSE_METRIC_LABELS[label] ?? 'ProfitNet';
}

function getMetricValue(metrics: Metrics, label: string): number {
  const key = getMetricKeyFromLabel(label);
  return metrics[key as keyof Metrics];
}

function isMetricKey(key: string): key is keyof Metrics {
  return [
    'AvPrice',
    'COGS',
    'C1',
    'Users',
    'CPUser',
    'FixCosts',
    'Margin',
    'AMPPU',
    'AMPU',
    'Profit',
    'ProfitNet'
  ].includes(key);
}

const METRIC_DISPLAY_MAP: Record<string, keyof Metrics> = {
  'Fix Costs': 'FixCosts',
  'Users': 'Users',
  'AvPrice': 'AvPrice',
  'COGS': 'COGS',
  'C1': 'C1',
  'CPUser': 'CPUser'

};

function StepNotification({ message, profitChangeMessage, onClose, metrics, balance, showHints, turn }: { message: string; profitChangeMessage: string; onClose: () => void; metrics: Metrics; balance: number; showHints: boolean; turn: number }) {
  const [show, setShow] = useState(false);
  const isPositive = profitChangeMessage.includes('вырос');

  useEffect(() => {
    setShow(true);
  }, []);

  // Определяем поясняющий текст в зависимости от типа сообщения
  const getExplanationText = (metrics: Metrics, balance: number, turn: number) => {
    const unit1 = metrics.AMPPU;
    const unit2 = metrics.AMPU - metrics.CPUser;
    const unit3 = metrics.ProfitNet;
    const cpUser = metrics.CPUser;
    const fixCost = metrics.FixCosts;
    const c1 = metrics.C1;
    const cogs = metrics.COGS;
    const U = metrics.Users;
    const d1_1 = (c1*unit1-(cpUser-6))*(U+10000)-fixCost;
    const d1_2 = (c1*unit1-(cpUser))*(U+8000)-(fixCost+75000);
    const d2 = (c1*((metrics.AvPrice+30-metrics.COGS))-(cpUser))*(U+1500)-(fixCost);
    const d3 = (c1*1.2*unit1-(cpUser))*(U)-fixCost;
    const d4 = (c1*unit1-(cpUser))*(U)-(fixCost-250000);








    
    if (turn <= 12) {
      if (unit2 < 0 && cpUser > 4) {
        return 'Pay attention to Unit 2: CPUser exceeds ARPU. Reduce CPUsers to $4.';
      }
      if (unit2 < 0 && cpUser <= 4) {
        return 'Unit 2 needs attention: lets make it positive together! Try setting CPUsers = $0';
      }
      if (unit1 > 0 && unit2 > 0 && unit3 < 0 && -3 * unit3 > balance && fixCost > 2900) {
        return 'Optimize FixCosts: otherwise youll soon run out of money.';
      }
      if (unit1 > 0 && unit2 > 0 && c1 < 40 && -3 * unit3 < balance) {
        return 'We recommend improving first user experience: increase C1 to 40%.';
      }
      if (unit1 > 0 && unit2 > 0  && c1 > 40 && cogs > 5 && cogs/unit1 > 0.3) {
        return 'Time to work on costs: try negotiating with suppliers or optimize production to reduce COGS to $5.';
      }
      if (unit1 > 0 && unit2 > 0 && unit3 > 0 && c1 > 40 && cogs <= 5 && unit1 >= 50) {
        return 'Great metrics! Now you can safely scale - increase Users to 100,000.';
      }
      if (unit1 > 0 && unit2 > 0 && unit3 > 0 && c1 > 40 && cogs/unit1 < 0.3 && unit1 < 50) {
        return 'We recommend increasing product value: raise AvPrice to $100.';
      }
      return 'Every choice affects company growth. Analyze metrics and dont be afraid to experiment!';
    }
    
    if (turn > 12) {
      const maxVal = Math.max(d1_1, d1_2, d2, d3, d4);
    
      if (maxVal === d1_1 || maxVal === d1_2) {
        return 'Final stretch! Use accumulated knowledge for large-scale promotion.';
      } 
      if (maxVal === d2) {
        return 'Last push! Focus on product improvement (ARPPU) - add the most awaited feature.';
      }
      if (maxVal === d3) {
        return 'Final stage! Improve onboarding (C1) - optimize new user adaptation process.';
      }
      return 'Final phase! Check operational costs (FixCosts) - maybe you can reduce expenses without quality loss.';
    }
    
    return 'Remember: even small changes can have significant impact. Track metrics and keep improving!';
    };
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          transform: show ? 'scale(1)' : 'scale(0.9)',
          opacity: show ? 1 : 0,
          transition: 'all 0.5s ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div style={{ 
            fontSize: '20px',
            color: '#1f2937',
            marginBottom: '16px',
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            {message}
          </div>
          <div style={{ 
            fontSize: '16px',
            color: isPositive ? '#34c759' : '#ff3b30',
            marginBottom: '24px',
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            {profitChangeMessage}
          </div>
          {showHints && (
            <div style={{ 
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              marginBottom: '24px',
              textAlign: 'left',
              border: '1px solid rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                color: '#1d1d1f',
                fontWeight: 600,
                fontSize: '15px'
              }}>
                <span style={{ fontSize: '18px' }}>💡</span>
                Hint
              </div>
              <div style={{ 
                color: '#4b5563',
                fontSize: '14px',
                lineHeight: 1.5
              }}>
                {getExplanationText(metrics, balance, turn)}
              </div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-60%',
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(2px)',
                  animation: 'shimmer-acq 1.2s linear 0s 1',
                }} />
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  




  function HintsPreferenceModal({ onSelect }: { onSelect: (showHints: boolean) => void }) {
    const [show, setShow] = useState(false);
  
    useEffect(() => {
      setTimeout(() => setShow(true), 100);
    }, []);
  
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          transform: show ? 'scale(1)' : 'scale(0.9)',
          opacity: show ? 1 : 0,
          transition: 'all 0.5s ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>💡</div>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            Do you want to receive hints?
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
            After each turn you'll receive advice on improving metrics and achieving goals
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => {
                setShow(false);
                setTimeout(() => onSelect(false), 300);
              }}
              style={{
                flex: 1,
                background: 'white',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.1)',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              No, I'm a pro
            </button>
            <button
              onClick={() => {
                setShow(false);
                setTimeout(() => onSelect(true), 300);
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Yes, please
            </button>
          </div>
        </div>
      </div>
    );
  }





// Добавить тип LeaderboardEntry, если его нет

export default function EconomySimulator() {
  const [metrics, setMetrics] = useState<Metrics>(getInitialMetrics());
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [profitChangeMessage, setProfitChangeMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [currentInitiatives, setCurrentInitiatives] = useState<Initiative[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showHintsPreference, setShowHintsPreference] = useState(false);
  const departmentMeta = department ? DEPARTMENTS.find(dep => dep.key === department) : null;
  const [initiativeChances, setInitiativeChances] = useState<number[]>([]);
  const [balance, setBalance] = useState(30000);
  const [usersBelow100, setUsersBelow100] = useState(0);
  const [profitNetHistory, setProfitNetHistory] = useState<number[]>([metrics.ProfitNet]);
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showStepNotification, setShowStepNotification] = useState(false);
  const [stepNotificationMessage, setStepNotificationMessage] = useState<string | null>(null);
  const [stepNotificationProfitChange, setStepNotificationProfitChange] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [shimmerKey, setShimmerKey] = useState(0);
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [pendingVictory, setPendingVictory] = useState(false);
  const [pendingProfitNet, setPendingProfitNet] = useState<number | null>(null);
  const [pendingVictoryMetrics, setPendingVictoryMetrics] = useState<Metrics | null>(null);
  const [nickname, setNickname] = useState('');
  const fireworksRef = useRef<HTMLDivElement | null>(null);
  const fireworksInstance = useRef<any>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backToDepartmentsUsed, setBackToDepartmentsUsed] = useState(false);
  const [refreshInitiativesUsed, setRefreshInitiativesUsed] = useState(false);
  const [setAllChancesUsed, setSetAllChancesUsed] = useState(false);
  const [allChancesAre100, setAllChancesAre100] = useState(false);

  useEffect(() => {
    if (turn === 1) {
      const interval = setInterval(() => setShimmerKey(k => k + 1), 2000);
      return () => clearInterval(interval);
    }
  }, [turn]);

  useEffect(() => {
    if (showNicknameModal && fireworksRef.current) {
      fireworksInstance.current = new Fireworks(fireworksRef.current, {
        rocketsPoint: { min: 20, max: 80 },
        hue: { min: 0, max: 360 },
        delay: { min: 15, max: 30 },
        // speed: 2, // удалено для устранения ошибки
        acceleration: 1.02,
        friction: 0.96,
        gravity: 1.5,
        particles: 90,
        // trace: 5, // удалено для устранения ошибки
        explosion: 6,
        autoresize: true,
        brightness: { min: 50, max: 80 },
        decay: { min: 0.015, max: 0.03 },
        mouse: { click: false, move: false, max: 0 }
      });
      fireworksInstance.current.start();
      return () => {
        fireworksInstance.current && fireworksInstance.current.stop();
      };
    } else if (!showNicknameModal && fireworksInstance.current) {
      fireworksInstance.current.stop();
    }
  }, [showNicknameModal]);

  function getRandomInitiatives(initiatives: Initiative[], count: number): Initiative[] {
    const shuffled = [...initiatives].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function handleDepartmentSelect(dep: Department) {
    setDepartment(dep);
    const allInitiatives = INITIATIVES[dep];
    const selectedInitiatives = getRandomInitiatives(allInitiatives, 3);
    setCurrentInitiatives(selectedInitiatives);
    const chances = selectedInitiatives.map(() => 0.2 + Math.random() * 0.7);
    setInitiativeChances(chances);
  }












  function handleInitiative(idx: number) {
    if (gameOver || department === null) return;
    let m = { ...metrics };
    setPrevMetrics(metrics);
    const ini = currentInitiatives[idx];
    const chance = initiativeChances[idx] ?? ini.successChance;
    if (allChancesAre100) {
      // Always maximum effect
      m = ini.apply(m);
      setMessage(ini.description + ` (100% success)`);
    } else {
      const rand = Math.random();
      if (rand < chance) {
        // Full success
        m = ini.apply(m);
        setMessage(ini.description + ` (Success, initiative implemented)`);
      } else if (rand < chance + (1 - chance)) {
        // Check for complete failure
        if (Math.random() < (1 - chance)) {
          setMessage('Initiative failed.');
        } else {
          // Partial effect: effect multiplied by probability
          if (ini.partialEffect) {
            m = ini.partialEffect(m);
            setMessage('Initiative partially implemented.');
          } else {
            // If partialEffect not defined, apply scaled effect
            const mFull = ini.apply(metrics);
            const mPartial: Metrics = { ...metrics };
            (Object.keys(mFull) as (keyof Metrics)[]).forEach(key => {
              if (typeof mFull[key] === 'number' && typeof metrics[key] === 'number') {
                mPartial[key] = (metrics[key] as number) + ((mFull[key] as number) - (metrics[key] as number)) * chance;
              }
            });
            m = recalcMetrics(mPartial);
            setMessage('Initiative partially implemented.');
          }
        }
      }
    }

    // Add Profit Net change message
    const profitNetChange = m.ProfitNet - metrics.ProfitNet;
    if (Math.abs(profitNetChange) > 0.01) { // Check for significant change
      const changeText = formatNumber(Math.round(Math.abs(profitNetChange)));
      if (profitNetChange > 0) {
        setProfitChangeMessage(`Profit Net increased by $${changeText}`);
      } else {
        setProfitChangeMessage(`Profit Net decreased by $${changeText}`);
      }
    } else {
      setProfitChangeMessage('Profit Net unchanged');
    }

    // --- Balance ---
    const newBalance = balance + m.ProfitNet;
    setBalance(newBalance);
    // --- Users < 100 ---
    let newUsersBelow100 = usersBelow100;
    if (m.Users < 100) {
      newUsersBelow100 += 1;
      if (newUsersBelow100 === 1) {
        setMessage(prev => (prev ? prev + ' ' : '') + 'Client base shrinking!');
      }
    } else {
      newUsersBelow100 = 0;
    }
    setUsersBelow100(newUsersBelow100);
    setMetrics(m);
    setProfitNetHistory(prev => [...prev, m.ProfitNet]);
    setTurn(turn + 1);
    setDepartment(null);
    setCurrentInitiatives([]);
    setInitiativeChances([]);
    
    // --- Victory/Defeat ---
    if (m.ProfitNet >= 50000 && turn + 1 === 15) {
      setGameOver(true);
      setIsVictory(true);
      setMessage('Victory! Profit Net ≥ $50,000 by turn 15');
      handleVictory(m);
    } else if (newBalance < 0) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Defeat! Company balance went negative.');
    } else if (newUsersBelow100 >= 2) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Defeat! Client base < 100 for two consecutive turns.');
    } else if (turn + 1 > 15) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Game over. Victory conditions not met.');
    }

    // Show turn notification only if game continues
    if (!gameOver) {
      setShowStepNotification(true);
    }
  }












  function handleStartGame() {
    setShowOnboarding(false);
    setShowHintsPreference(true); // Show hints preference modal after onboarding
  }

  function handleRestart() {
    setMetrics(getInitialMetrics());
    setTurn(1);
    setMessage(null);
    setProfitChangeMessage(null);
    setGameOver(false);
    setIsVictory(false);
    setDepartment(null);
    setCurrentInitiatives([]);
    setInitiativeChances([]);
    setBalance(30000);
    setUsersBelow100(0);
    setProfitNetHistory([getInitialMetrics().ProfitNet]);
    setPrevMetrics(null);
    setBackToDepartmentsUsed(false); // сбросить кнопку назад
    setRefreshInitiativesUsed(false); // сбросить кнопку рефреш
    setSetAllChancesUsed(false); // сбросить кнопку 100%
    setAllChancesAre100(false); // сбросить 100%
  }

  useEffect(() => {
    if (!prevMetrics || gameOver) return;
    
    const newAchievements = achievements.map(achievement => {
      if (achievement.achieved) return achievement;
      
      const isAchieved = achievement.condition(metrics, prevMetrics, turn);
      if (isAchieved && !achievement.achieved) {
        setNewAchievement(achievement);
        return { ...achievement, achieved: true };
      }
      return achievement;
    });
    
    setAchievements(newAchievements);
  }, [metrics, prevMetrics, turn]);

  // Загрузка таблицы лидеров из API
  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }
    loadLeaderboard();
  }, []);

  // Победа: показываем VictoryModal, а затем — если в ТОП-10 — NicknameInputModal
  useEffect(() => {
    if (pendingVictory && pendingProfitNet !== null && pendingVictoryMetrics) {
      // Проверяем попадание в ТОП-10
      const sorted = [...leaderboard].sort((a, b) => b.profitNet - a.profitNet);
      const position = sorted.findIndex(entry => pendingProfitNet > entry.profitNet);
      const isTop10 = position !== -1 || sorted.length < 10;
      if (isTop10) {
        setCurrentPosition(position === -1 ? sorted.length + 1 : position + 1);
        setShowNicknameModal(true);
      }
      setPendingVictory(false);
    }
  }, [pendingVictory, pendingProfitNet, pendingVictoryMetrics, leaderboard]);

  // При победе — запоминаем метрики и ProfitNet
  async function handleVictory(metrics: Metrics) {
    setPendingVictoryMetrics(metrics);
    setGameOver(true);
    setIsVictory(true);
    setShowFireworks(true);

    // Проверяем, попадает ли результат в топ-10
    const lowestScore = leaderboard.length > 0 ? Math.min(...leaderboard.map(entry => entry.profitNet)) : 0;
    if (leaderboard.length < 10 || metrics.ProfitNet > lowestScore) {
      setShowNicknameModal(true);
    }
  }

  // Обновляем функцию handleNicknameSubmit для использования API
  async function handleNicknameSubmit(nickname: string) {
    if (!pendingVictoryMetrics || isSubmitting) return;
    setIsSubmitting(true);

    const newEntry = {
      nickname,
      profitNet: pendingVictoryMetrics.ProfitNet,
      isCurrentPlayer: true
    };

    try {
      console.log('Attempting to add entry to leaderboard:', newEntry);
      const addedEntry = await addToLeaderboard(newEntry);
      console.log('Leaderboard API response:', addedEntry);
      
      if (addedEntry) {
        // Обновляем локальную таблицу лидеров
        const updatedLeaderboard = [...leaderboard];
        if (leaderboard.length >= 10) {
          // Удаляем последний результат, если таблица полная
          updatedLeaderboard.pop();
        }
        updatedLeaderboard.push(addedEntry);
        // Сортируем по убыванию Profit Net
        updatedLeaderboard.sort((a, b) => b.profitNet - a.profitNet);
        setLeaderboard(updatedLeaderboard);
      } else {
        console.error('Failed to add entry to leaderboard: No response from API');
      }
    } catch (error) {
      console.error('Error in handleNicknameSubmit:', error);
    }

    setShowNicknameModal(false);
    setShowLeaderboardModal(true);
    setIsSubmitting(false);
  }

  // Показывать мобильное предупреждение только при первом запуске, если мобильное устройство
  useEffect(() => {
    if (showOnboarding) {
      const isMobile = window.innerWidth <= 600;
      if (isMobile) {
        setShowMobileWarning(true);
      }
    }
  }, [showOnboarding]);

  function handleBackToDepartments() {
    setDepartment(null);
    setCurrentInitiatives([]);
    setInitiativeChances([]);
    setBackToDepartmentsUsed(true);
    setAllChancesAre100(false); // сбросить 100% при выходе
  }

  function handleRefreshInitiatives() {
    if (!department) return;
    const allInitiatives = INITIATIVES[department];
    const selectedInitiatives = getRandomInitiatives(allInitiatives, 3);
    setCurrentInitiatives(selectedInitiatives);
    const chances = selectedInitiatives.map(() => 0.2 + Math.random() * 0.7);
    setInitiativeChances(chances);
    setRefreshInitiativesUsed(true);
    setAllChancesAre100(false); // сбросить 100% при рефреше
  }

  function handleSetAllChances100() {
    if (setAllChancesUsed) return;
    setInitiativeChances(currentInitiatives.map(() => 1));
    setAllChancesAre100(true);
    setSetAllChancesUsed(true);
  }

  if (showMobileWarning) {
    return <MobileWarningModal onAcknowledge={() => {
      setShowMobileWarning(false);
      setShowHintsPreference(true);
    }} />;
  }

  if (showOnboarding) {
    return (
      <section style={{ 
        maxWidth: 1000, 
        margin: '0 auto', 
        padding: '48px 32px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,248,248,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 32,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            marginBottom: 32,
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            {ONBOARDING_STEPS[onboardingStep].title}
          </h1>
          <div style={{ 
            marginBottom: 40,
            fontSize: 17,
            lineHeight: 1.6,
            color: '#1d1d1f'
          }}>
            {ONBOARDING_STEPS[onboardingStep].content}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 }}>
            <button 
              onClick={() => setOnboardingStep(prev => Math.max(0, prev - 1))}
              style={{ 
                ...styles.button,
                visibility: onboardingStep === 0 ? 'hidden' : 'visible',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,248,248,0.9) 100%)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
              className="hover-button"
            >
              Back
            </button>
            {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
              <button 
                onClick={() => setOnboardingStep(prev => prev + 1)}
                style={{
                  ...styles.buttonDark,
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
                className="hover-button-dark"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleStartGame}
                style={{
                  ...styles.buttonDark,
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
                className="hover-button-dark"
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (showHintsPreference) {
    return <HintsPreferenceModal onSelect={(showHints) => {
      setShowHintsPreference(false);
      setShowHints(showHints);
    }} />;
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        display: 'grid',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,248,248,0.98) 100%)'
      }}>
        <section style={{ 
          maxWidth: 800, 
          margin: '0 auto',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 32,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.08)',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
            flexShrink: 0
          }}>
            <h2 style={{ 
              fontWeight: 700, 
              fontSize: 28,
              letterSpacing: '-0.02em',
              margin: 0,
              background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
             InboxMind
            </h2>

            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowLeaderboardModal(true)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  marginRight: '0'
                }}
              >
                🏆 TOP-10
              </button>
              <button
                onClick={() => setShowAchievementModal(true)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  marginRight: '0'
                }}
              >
                ⭐️ Achievements ({achievements.filter(a => a.achieved).length}/{achievements.length})
              </button>
              <button
                onClick={() => setShowTacticsModal(true)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500
                }}
              >
                📋 Tactics
              </button>
              <button
                onClick={() => setShowHints(v => !v)}
                style={{
                  background: showHints ? 'linear-gradient(135deg, #000000 0%, #333333 100%)' : '#fff',
                  color: showHints ? '#fff' : '#1d1d1f',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500
                }}
              >
                💡 Hints
              </button>
            </div>
          </div>

          {/* Main content */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            paddingRight: '16px',
            marginRight: '-16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Turn counter */}
              <div style={{ 
                fontSize: 15, 
                color: '#1d1d1f',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontWeight: 500 }}>Turn:</span> 
                <span style={{ 
                  background: '#000', 
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 15
                }}>{turn} / 15</span>
              </div>

            {/* Metrics grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
              gap: 16
              }}>

                <div style={{ 
                  background: 'rgba(255,255,255,0.8)',
                borderRadius: 20,
                padding: 16,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                <div style={{ fontSize: 14, color: '#86868b', marginBottom: 4 }}>Balance</div>
                  <div style={{ 
                    fontWeight: 600, 
                  fontSize: 24,
                    letterSpacing: '-0.02em',
                    color: balance < 0 ? '#ff3b30' : '#1d1d1f'
                  }}>
                  ${formatNumber(Math.round(balance))}
                  </div>
                </div>


                <div style={{ 
                  background: 'rgba(255,255,255,0.8)',
                borderRadius: 20,
                padding: 16,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                <div style={{ fontSize: 14, color: '#86868b', marginBottom: 4 }}> Profit Net Target $50,000</div>
                  <div style={{ 
                    fontWeight: 600, 
                  fontSize: 24,
                    letterSpacing: '-0.02em',
                    color: (() => {
                      const progress = metrics.ProfitNet < 0 ? 0 : (metrics.ProfitNet / 50000) * 100;
                      if (progress >= 100) return '#34c759'; // зеленый
                      if (progress >= 70) return '#ff9500'; // оранжевый
                      if (progress >= 30) return '#ffcc00'; // желтый
                      return '#ff3b30'; // красный
                    })()
                  }}>
                    {metrics.ProfitNet < 0 ? '0%' : `${Math.round((metrics.ProfitNet / 50000) * 100)}%`}
                  </div>
                </div>



                


              </div>

            {/* Chart */}
              <div style={{ 
                width: '100%', 
              height: 160,
                background: 'rgba(255,255,255,0.8)',
              borderRadius: 20,
              padding: '12px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitNetHistory.map((v, i) => ({ turn: i + 1, profitNet: v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis 
                      dataKey="turn" 
                      tickCount={16} 
                      stroke="#86868b"
                      label={{ value: 'Turn:', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      tickFormatter={v => `$${v.toLocaleString('ru-RU')}`} 
                      domain={['auto', 'auto']} 
                      stroke="#86868b"
                      label={{ value: 'Profit Net', angle: -90, position: 'insideLeft', offset: 10 }} 
                    />
                    <Tooltip 
                      formatter={v => `$${v.toLocaleString('ru-RU')}`} 
                      labelFormatter={l => `Turn: ${l}`}
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profitNet" 
                      stroke="#000"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <ReferenceLine 
                      y={50000} 
                      stroke="#2ecc71" 
                      strokeDasharray="6 2" 
                      label={{ 
                        value: 'Цель: $50,000', 
                        position: 'right', 
                        fill: '#2ecc71', 
                        fontWeight: 600, 
                        fontSize: 13 
                      }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            {/* Additional metrics */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8
              }}>
                {[
              // { label: 'Маржинальность', value: `${(Math.round(metrics.Margin * 100)).toFixed(1)}%`, color: metrics.Margin < 0 ? '#ff3b30' : '#1d1d1f' },
                { label: 'ARPPU', value: `$${formatNumber(Math.round(metrics.AMPPU))}`, color: metrics.AMPPU < 0 ? '#ff3b30' : '#1d1d1f', tag: 'Level 1 Unit' },
                { label: 'ARPU - CPUser', value: `$${(Math.round(metrics.AMPU) - Math.round(metrics.CPUser)).toFixed(2)}`, color: (Math.round(metrics.AMPU) - Math.round(metrics.CPUser)) < 0 ? '#ff3b30' : '#1d1d1f', tag: 'Level 2 Unit' },
                { label: 'Profit Net', value: `$${formatNumber(Math.round(metrics.ProfitNet))}`, color: metrics.ProfitNet < 0 ? '#ff3b30' : '#1d1d1f', tag: 'Level 3 Unit' }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    background: 'rgba(255,255,255,0.8)',
                  borderRadius: 16,
                  padding: 12,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}>
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: item.color }}>{item.value}</div>
                  {item.tag && (
                    <div style={{ 
                      fontSize: 11, 
                      color: '#6b7280', 
                      marginTop: 4,
                      padding: '2px 6px',
                      background: '#f3f4f6',
                      borderRadius: 4,
                      display: 'inline-block'
                    }}>
                      {item.tag}
                    </div>
                  )}
                  </div>
                ))}
          </div>

            {/* Detailed metrics */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6
              }}>
                {[
                 { label: 'AvPrice', value: `$${formatNumber(Math.round(metrics.AvPrice))}`, prev: prevMetrics?.AvPrice },
                { label: 'COGS', value: `$${formatNumber(Math.round(metrics.COGS))}`, prev: prevMetrics?.COGS },
                { label: 'C1', value: `${metrics.C1.toFixed(1)}%`, prev: prevMetrics?.C1 },
                { label: 'CPUser', value: `$${formatNumber(Math.round(metrics.CPUser))}`, prev: prevMetrics?.CPUser },
                { label: 'Fix Costs', value: `$${formatNumber(Math.round(metrics.FixCosts))}`, prev: prevMetrics?.FixCosts },
                { label: 'Users', value: `${formatNumber(Math.round(metrics.Users))}`, prev: prevMetrics?.Users }
               
                ].map((item, index) => {
                  const metricKey = METRIC_DISPLAY_MAP[item.label];
                  return (
                    <div key={index} style={{ 
                      background: 'rgba(255,255,255,0.8)',
                    borderRadius: 12,
                    padding: 8,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                    <div style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</div>
                    {item.prev !== undefined && metricKey && item.prev !== metrics[metricKey] && (
                      <div style={{ fontSize: 10, color: '#86868b', marginTop: 2 }}>
                        ({typeof item.prev === 'number' ? 
                          (item.label === 'C1' ? 
                            `${item.prev.toFixed(1)}% → ${metrics.C1.toFixed(1)}%` :
                          `${item.label.includes('$') ? '$' : ''}${formatNumber(Math.round(item.prev))} → ${item.label.includes('$') ? '$' : ''}${formatNumber(Math.round(metrics[metricKey]))}`
                          ) : ''})
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

            {/* Department selection */}
              {!department && !gameOver && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.95) 100%)',
                borderRadius: 20,
                padding: '24px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16
                }}>
                  <div style={{ 
                    background: '#000',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 500
                  }}>
                    {turn} turn
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 18,
                    color: '#1d1d1f'
                  }}>
                    Select Direction
                  </div>
                  </div>
                  <div className="mobile-horizontal-row" style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8
                  }}>
                    {DEPARTMENTS.map(dep => (
                      <button 
                        key={dep.key} 
                        onClick={() => handleDepartmentSelect(dep.key)} 
                        style={{ 
                          padding: '12px 16px',
                          borderRadius: 16,
                          border: '1px solid rgba(0,0,0,0.1)',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: turn === 1 && dep.key === 'acquisition' ? 2 : 1
                        }}
                      >
                        <span style={{ fontSize: 24, marginBottom: 4 }}>{dep.icon}</span>
                        <span style={{ 
                          fontWeight: 600,
                          fontSize: 15,
                          color: '#1d1d1f',
                          marginBottom: 4
                        }}>{dep.label}</span>
                        <span style={{ 
                          fontSize: 11,
                          color: '#86868b',
                          lineHeight: 1.4,
                          textAlign: 'left',
                          whiteSpace: 'pre-line'
                        }}>{dep.desc}</span>
                        {/* Бегущий shimmer-блик */}
                        {turn === 1 && dep.key === 'acquisition' && (
                          <span style={{
                            position: 'absolute',
                            top: 0, left: 0, bottom: 0, width: '100%',
                            pointerEvents: 'none',
                            zIndex: 3,
                            overflow: 'hidden',
                            borderRadius: 16
                          }}>
                            <span key={shimmerKey} style={{
                              display: 'block',
                              position: 'absolute',
                              top: 0, left: '-60%',
                              width: '60%', height: '100%',
                              background: 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
                              filter: 'blur(2px)',
                              animation: 'shimmer-acq 1.2s linear 0s 1',
                            }} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
              </div>
              )}

            {/* Initiative selection */}
              {department && !gameOver && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.95) 100%)',
                borderRadius: 20,
                padding: '24px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                {/* Кнопки-помощники */}
                <div style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 8,
                  zIndex: 2
                }}>
                  <button
                    onClick={handleRefreshInitiatives}
                    disabled={refreshInitiativesUsed}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: 'none',
                      background: refreshInitiativesUsed ? 'linear-gradient(90deg, #e5e7eb, #d1d5db)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                      color: refreshInitiativesUsed ? '#9ca3af' : 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: refreshInitiativesUsed ? 'not-allowed' : 'pointer',
                      boxShadow: refreshInitiativesUsed ? 'none' : '0 2px 8px rgba(16,185,129,0.08)',
                      transition: 'all 0.2s',
                      minWidth: 48
                    }}
                  >
                    🔄 Load More
                  </button>
                  <button
                    onClick={handleSetAllChances100}
                    disabled={setAllChancesUsed}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: 'none',
                      background: setAllChancesUsed ? 'linear-gradient(90deg, #e5e7eb, #d1d5db)' : 'linear-gradient(90deg, #f59e42, #fbbf24)',
                      color: setAllChancesUsed ? '#9ca3af' : 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: setAllChancesUsed ? 'not-allowed' : 'pointer',
                      boxShadow: setAllChancesUsed ? 'none' : '0 2px 8px rgba(251,191,36,0.08)',
                      transition: 'all 0.2s',
                      minWidth: 48
                    }}
                  >
                    100%
                  </button>
                  <button
                    onClick={handleBackToDepartments}
                    disabled={backToDepartmentsUsed}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: 'none',
                      background: backToDepartmentsUsed ? 'linear-gradient(90deg, #e5e7eb, #d1d5db)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      color: backToDepartmentsUsed ? '#9ca3af' : 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: backToDepartmentsUsed ? 'not-allowed' : 'pointer',
                      boxShadow: backToDepartmentsUsed ? 'none' : '0 2px 8px rgba(139,92,246,0.08)',
                      transition: 'all 0.2s',
                      minWidth: 48
                    }}
                  >
                    ← Back
                  </button>
                </div>
                {/* Остальной код блока инициатив */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16
                }}>
                  <div style={{ 
                    background: '#000',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 500
                  }}>
                    {turn} turn
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 18,
                    color: '#1d1d1f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    Select Initiative / 
                    <span style={{ fontSize: 20 }}>{DEPARTMENTS.find(d => d.key === department)?.icon}</span>
                    <span style={{ fontSize: 15 }}>{DEPARTMENTS.find(d => d.key === department)?.label}</span>
                  </div>
                  </div>
                  <div className="mobile-horizontal-row" style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8
                  }}>
                    {currentInitiatives.map((ini, idx) => (
                      <button 
                        key={ini.title} 
                        onClick={() => handleInitiative(idx)} 
                        style={{ 
                          padding: '16px 20px',
                        borderRadius: 16,
                          border: '1px solid rgba(0,0,0,0.1)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          cursor: gameOver ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                        height: '180px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ 
                            fontWeight: 600,
                          fontSize: 16,
                            color: '#1d1d1f',
                          marginBottom: 8
                          }}>{ini.title}</div>
                          <div style={{ 
                            color: '#86868b',
                          fontSize: 13,
                          marginBottom: 12,
                            display: '-webkit-box',
                          WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.5
                          }}>{ini.description}</div>
                        </div>
                        <div style={{ 
                          display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 500,
                          alignSelf: 'flex-start'
                        }}>
                          Success Probability: {initiativeChances[idx] ? Math.round(initiativeChances[idx] * 100) : Math.round(ini.successChance * 100)}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </section>
      </div>
      {gameOver && isVictory && pendingVictoryMetrics && (
        <VictoryModal onRestart={handleRestart} metrics={pendingVictoryMetrics} />
      )}
      {gameOver && !isVictory && <DefeatModal onRestart={handleRestart} metrics={metrics} />}
      {showStepNotification && message && profitChangeMessage && !gameOver && (
        <StepNotification 
          message={message}
          profitChangeMessage={profitChangeMessage}
          onClose={() => {
            setShowStepNotification(false);
            setMessage(null);
            setProfitChangeMessage(null);
          }}
          metrics={metrics}
          balance={balance}
          showHints={showHints}
          turn={turn}
        />
      )}
      {showAchievementModal && (
        <AchievementsModal 
          achievements={achievements}
          onClose={() => setShowAchievementModal(false)}
        />
      )}
      {newAchievement && (
        <AchievementNotification 
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
      {showTacticsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'left',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowTacticsModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#86868b'
              }}
            >✕</button>
           <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Tactics: How to Win Through Unit Economics</h2>
{/* Tactics onboarding content */}
<div style={{ fontSize: 16, lineHeight: 1.6 }}>
  <p style={{ marginBottom: 12 }}>In this game you'll develop unit economics skills.</p>
  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 12 }}>
    <li>• Multiple unit levels — make them profitable sequentially</li>
    <li>• Level 1 unit (ARPPU) starts profitable, Level 2 unit (ARPU - CPUser) must become positive</li>
    <li>• While units are negative — each new user brings loss</li>
    <li>• For Level 3 unit growth (Profit Net) — use hints and optimize costs</li>
  </ul>
  <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 15, marginTop: 16 }}>
    <b>General Strategy:</b> <br />
    1. First make Units 1 and 2 profitable<br />
    2. Then scale users and optimize Unit 3<br />
    3. Follow hints — they'll help reach profitability!<br />
    <div style={{ marginTop: 14, background: '#fffbe6', color: '#b45309', borderRadius: 6, padding: '8px 12px', fontWeight: 600, fontSize: 16, border: '1px solid #fde68a' }}>
      Your first task — <span style={{ color: '#d97706' }}>reduce CPUsers to $4</span>
    </div>
  </div>
</div>
          </div>
        </div>
      )}
      {showNicknameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          {/* Fireworks canvas */}
          <div ref={fireworksRef} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1001
          }} />
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            transform: 'scale(1)',
            opacity: 1,
            transition: 'all 0.5s ease-out',
            zIndex: 1002
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏆</div>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}>
              Congratulations!
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '16px', color: '#1d1d1f' }}>
              Your result made it to TOP-10 players
              {typeof currentPosition === 'number' && currentPosition > 0
                ? <> and secured <b>{currentPosition}th place</b>!</>
                : '!'}
            </p>
            <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>Enter your nickname:</p>
            <input
              type="text"
              maxLength={20}
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                marginBottom: 24,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Your nickname"
            />
            <button
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginBottom: 0,
                opacity: isSubmitting ? 0.7 : 1
              }}
              onClick={() => {
                if (!isSubmitting && nickname.trim()) {
                  handleNicknameSubmit(nickname || 'Player');
                }
              }}
              disabled={!nickname.trim() || isSubmitting}
            >
              Save
            </button>
          </div>
        </div>
      )}
      {showLeaderboardModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            transform: 'scale(1)',
            opacity: 1,
            transition: 'all 0.5s ease-out'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏆</div>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}>
              Leaderboard
            </h2>
            {isLoadingLeaderboard ? (
              <div style={{ padding: '20px', color: '#666' }}>Loading results...</div>
            ) : (
              <>
                <ol style={{
                  padding: 0,
                  margin: 0,
                  listStyle: 'none',
                  marginBottom: 24
                }}>
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={entry.id}
                      style={{
                        background: entry.isCurrentPlayer ? '#e0f2fe' : 'transparent',
                        fontWeight: entry.isCurrentPlayer ? 700 : 400,
                        padding: '10px 0',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 16,
                        color: entry.isCurrentPlayer ? '#2563eb' : '#1d1d1f',
                        marginBottom: 2
                      }}
                    >
                      <span>{idx + 1}. {entry.nickname}</span>
                      <span>${formatNumber(Math.round(entry.profitNet))}</span>
                    </li>
                  ))}
                </ol>
                <button
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 0
                  }}
                  onClick={() => setShowLeaderboardModal(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Add at the end of the file, before the last closing bracket
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .hover-button:hover {
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.95) 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.06) !important;
  }
  .hover-button-dark:hover {
    background: linear-gradient(135deg, #1d1d1f 0%, #333333 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
  }
`;
document.head.appendChild(styleSheet);

// В конец файла добавить CSS-анимацию:
const blinkStyle = document.createElement('style');
blinkStyle.textContent = `
@keyframes blink-acq {
  0% { opacity: 0.2; }
  30% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0.2; }
}
`;
document.head.appendChild(blinkStyle);

// В конец файла добавить CSS-анимацию shimmer:
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `
@keyframes shimmer-acq {
  0% { left: -60%; }
  100% { left: 100%; }
}
`;
document.head.appendChild(shimmerStyle);

// В конец файла добавить CSS для мобильной адаптивности
const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
@media (max-width: 600px) {
  section, .main-game-section {
    max-width: 100vw !important;
    padding: 8px !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .main-game-section {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .metrics-row, .metrics-grid, .metrics-detailed {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }
  .metrics-row > div, .metrics-grid > div, .metrics-detailed > div {
    min-width: 0 !important;
    width: 100% !important;
    font-size: 18px !important;
    padding: 8px !important;
  }
  .departments-row {
    display: flex !important;
    flex-direction: row !important;
    gap: 6px !important;
    overflow-x: auto !important;
    margin-bottom: 8px !important;
  }
  .departments-row > button {
    min-width: 140px !important;
    flex: 0 0 auto !important;
    font-size: 15px !important;
    padding: 10px 8px !important;
  }
  .main-numbers {
    font-size: 24px !important;
    font-weight: 700 !important;
    text-align: center !important;
    margin-bottom: 4px !important;
  }
  .chart-row {
    height: 100px !important;
    min-height: 80px !important;
    margin-bottom: 8px !important;
  }
  .header-row {
    flex-direction: column !important;
    gap: 4px !important;
    align-items: flex-start !important;
  }
  .header-row button {
    width: 100% !important;
    margin-right: 0 !important;
  }
  .mobile-horizontal-row {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    overflow-x: auto !important;
    margin-bottom: 8px !important;
    padding-bottom: 2px !important;
  }
  .mobile-horizontal-row > button {
    min-width: 180px !important;
    flex: 0 0 auto !important;
    font-size: 15px !important;
    padding: 12px 10px !important;
  }
}
`;
document.head.appendChild(mobileStyle);

// В конец файла скорректировать CSS для мобильной версии:
mobileStyle.textContent += `
@media (max-width: 600px) {
  .mobile-horizontal-row {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    overflow-x: unset !important;
    margin-bottom: 8px !important;
    padding-bottom: 2px !important;
  }
  .mobile-horizontal-row > button {
    min-width: 0 !important;
    width: 100% !important;
    flex: 1 1 auto !important;
    font-size: 15px !important;
    padding: 12px 10px !important;
  }
}
`;

// Добавить новый компонент для мобильного предупреждения
function MobileWarningModal({ onAcknowledge }: { onAcknowledge: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        transform: show ? 'scale(1)' : 'scale(0.9)',
        opacity: show ? 1 : 0,
        transition: 'all 0.5s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
        <h2 style={{
          fontSize: '22px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Внимание!
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
          Игра <b>не адаптирована для мобильной вёрстки</b>.<br />
          Рекомендуем открыть её на компьютере, планшете или повернуть телефон горизонтально для лучшего опыта.
        </p>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onAcknowledge, 300);
          }}
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Хорошо
        </button>
      </div>
    </div>
  );
}
