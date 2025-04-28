import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

function formatNumber(value: number) {
  return value.toLocaleString('ru-RU');
}

// Целевые параметры для задания (пример)
const TARGET = {
  minMonths: 12,
  cac: 3000,
  ltv: 12000,
  fixed: 9000,
};

// Описание и оформление ачивок
const ACHIEVEMENTS: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  'Первая попытка!': {
    label: 'Первая попытка!',
    color: '#2196f3',
    bg: 'linear-gradient(90deg,#e3f2fd,#bbdefb)',
    icon: '🚀',
    desc: 'Ты начал путь!'
  },
  'Экономист!': {
    label: 'Экономист!',
    color: '#58cc02',
    bg: 'linear-gradient(90deg,#e6ffe6,#b9f6ca)',
    icon: '🧠',
    desc: 'Ты подобрал идеальные параметры!'
  },
  'Не сдал с 3-й попытки': {
    label: 'Не сдал с 3-й попытки',
    color: '#ff4b4b',
    bg: 'linear-gradient(90deg,#ffeaea,#ffd6d6)',
    icon: '💀',
    desc: 'Попробуй ещё раз — опыт важнее победы!'
  },
};

// График выхода на окупаемость
function BreakEvenChart({ cac, ltv, fixed, users }: { cac: number; ltv: number; fixed: number; users: number }) {
  // Моделируем 24 месяца
  const months = 24;
  let balance = -fixed; // стартовые расходы
  const data: { x: number; y: number }[] = [{ x: 0, y: balance }];
  let breakEvenMonth: number | null = null;
  for (let i = 1; i <= months; i++) {
    balance += (cac - ltv) * users - fixed;
    data.push({ x: i, y: balance });
    if (breakEvenMonth === null && balance >= 0) breakEvenMonth = i;
  }
  // Нормализация для графика
  const minY = Math.min(...data.map(d => d.y), 0);
  const maxY = Math.max(...data.map(d => d.y), 0);
  const W = 420, H = 200, pad = 44;
  const scaleX = (x: number) => pad + (x / months) * (W - 2 * pad);
  const scaleY = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
  // Линия графика
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(d.x)},${scaleY(d.y)}`).join(' ');
  // Ось X: подписи через 6 мес
  const xLabels = [0, 6, 12, 18, 24];
  // Ось Y: подписи min, 0, max
  const yLabels = [minY, 0, maxY];
  // Деления (grid)
  const gridX = xLabels;
  const gridY = [minY, (minY+maxY)/2, 0, (maxY+0)/2, maxY];
  return (
    <div style={{ margin: '32px auto 0', maxWidth: 640, width: '100%', background: 'rgba(255,255,255,0.85)', borderRadius: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', padding: 32, display: 'block' }}>
      <div style={{ fontWeight: 700, fontSize: 22, background: 'linear-gradient(90deg,#0a2540,#00b8ff 80%)', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: 8, letterSpacing: -1 }}>График выхода на окупаемость</div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', minWidth: 320, maxWidth: '100%', display: 'block' }}
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Grid Y */}
          {gridY.map((y, i) => (
            <line key={i} x1={pad} y1={scaleY(y)} x2={W - pad} y2={scaleY(y)} stroke="#e5e5e7" strokeWidth={1} strokeDasharray="4 4" />
          ))}
          {/* Grid X */}
          {gridX.map((x, i) => (
            <line key={i} y1={pad} x1={scaleX(x)} y2={H - pad} x2={scaleX(x)} stroke="#e5e5e7" strokeWidth={1} strokeDasharray="4 4" />
          ))}
          {/* Оси */}
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#bbb" strokeWidth={1.5} />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#bbb" strokeWidth={1.5} />
          {/* Линия графика */}
          <path d={path} fill="none" stroke="url(#grad)" strokeWidth={3} />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00b8ff" />
              <stop offset="100%" stopColor="#7800ff" />
            </linearGradient>
          </defs>
          {/* Точка выхода на окупаемость */}
          {breakEvenMonth && (
            <circle
              cx={scaleX(breakEvenMonth)}
              cy={scaleY(data[breakEvenMonth].y)}
              r={8}
              fill="#fff"
              stroke="#00b8ff"
              strokeWidth={4}
              style={{ filter: 'drop-shadow(0 2px 8px #00b8ff44)' }}
            />
          )}
          {/* Подписи X */}
          {xLabels.map(x => (
            <text key={x} x={scaleX(x)} y={H - pad + 28} fontSize={15} fill="#888" textAnchor="middle">{x}</text>
          ))}
          {/* Подписи Y */}
          {yLabels.map(y => (
            <text key={y} x={pad - 12} y={scaleY(y) + 5} fontSize={15} fill="#888" textAnchor="end">{formatNumber(Math.round(y))}</text>
          ))}
          {/* Названия осей */}
          <text x={W/2} y={H - 2} fontSize={16} fill="#0a2540" textAnchor="middle" fontWeight={600}>Месяцы</text>
          <text x={pad - 32} y={pad - 8} fontSize={16} fill="#0a2540" textAnchor="middle" fontWeight={600} transform={`rotate(-90,${pad - 32},${pad - 8})`}>Баланс, ₽</text>
        </svg>
      </div>
      <div style={{ color: '#888', fontSize: 15, marginTop: 6 }}>
        {breakEvenMonth && (
          <span style={{ color: '#00b8ff', fontWeight: 600 }}>
            Окупаемость: {breakEvenMonth} мес.
          </span>
        )}
      </div>
    </div>
  );
}

// Функция для обработки ввода только цифр и обновления значения
function handleNumberInput(e: React.ChangeEvent<HTMLInputElement>, setter: (v: number) => void) {
  const raw = e.target.value.replace(/\D/g, '');
  setter(raw ? parseInt(raw, 10) : 0);
}

// Вынести ачивки в футер
function AchievementsFooter({ achievements }: { achievements: string[] }) {
  if (!achievements.length) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 10,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: 0,
    }}>
      <div style={{
        width: 'auto',
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.08)',
        padding: '18px 32px 12px 32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
        minHeight: 56,
        fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
        borderRadius: 18,
        marginTop: 18,
        pointerEvents: 'auto',
      }}>
        {achievements.map((ach, i) => {
          const meta = ACHIEVEMENTS[ach] || { label: ach, color: '#888', bg: '#f3f3f3', icon: '⭐', desc: '' };
          return (
            <div key={i} style={{
              background: '#fafafa',
              color: meta.color,
              borderRadius: 14,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 16,
              border: `1.5px solid #e5e5e7`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 160,
              marginBottom: 0,
              position: 'relative',
              transition: 'box-shadow 0.3s',
            }}>
              <span style={{ fontSize: 22, marginRight: 6 }}>{meta.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 1 }}>{meta.label}</div>
                <div style={{ fontWeight: 500, fontSize: 13, color: '#888', opacity: 0.85 }}>{meta.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Unit Quest Game ---
// Для анимаций
const MAX_TURNS = 10;
const WIN_PROFIT = 200000;

// CSS для fade/slide анимаций (можно вынести в отдельный файл)
const fadeStyle = {
  transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)',
  opacity: 1,
  transform: 'translateY(0px)'
};
const fadeHiddenStyle = {
  opacity: 0,
  transform: 'translateY(24px)'
};

function getRandomInitMetrics() {
  return {
    CAC: Math.round(40 + Math.random() * 20), // 40-60
    LTV: Math.round(20 + Math.random() * 20), // 20-40
    Retention: Math.round(50 + Math.random() * 20), // 50-70
    Conversion: Math.round(3 + Math.random() * 4), // 3-7
    Clients: Math.round(80 + Math.random() * 40), // 80-120
    Budget: Math.round(800 + Math.random() * 400), // 800-1200
    Fixed: 200,
    Profit: 0,
  };
}
const INIT_METRICS = getRandomInitMetrics();

type Metrics = ReturnType<typeof getRandomInitMetrics>;
const INITIATIVES: {
  icon: string;
  title: string;
  description: string;
  apply: (m: Metrics) => Partial<Metrics>;
  feedback: string;
  risk?: { chance: number; effect: (m: Metrics) => Partial<Metrics>; message: string };
}[] = [
  {
    icon: '🚀',
    title: 'Улучшение продукта',
    description: 'Увеличивает Retention Rate на 10%, снижает LTV на $20.',
    apply: (m: Metrics) => ({ Retention: Math.min(m.Retention + 10, 100), LTV: Math.max(m.LTV - 20, 0) }),
    feedback: 'Вы вложились в продукт — удержание выросло, но LTV снизился из-за затрат.'
  },
  {
    icon: '📣',
    title: 'Маркетинговая кампания',
    description: 'Снижает CAC на $10, увеличивает конверсию на 2%. Риск: 30% шанс, что CAC вырастет на $15.',
    apply: (m: Metrics) => ({ CAC: Math.max(m.CAC - 10, 0), Conversion: Math.min(m.Conversion + 2, 100) }),
    risk: { chance: 0.3, effect: (m: Metrics) => ({ CAC: m.CAC + 15 }), message: 'Маркетинговая кампания провалилась — CAC вырос на $15.' },
    feedback: 'Маркетинг сработал, но был риск!'
  },
  {
    icon: '🎁',
    title: 'Программа лояльности',
    description: 'Повышает LTV на $30, снижает Retention Rate на 5%.',
    apply: (m: Metrics) => ({ LTV: m.LTV + 30, Retention: Math.max(m.Retention - 5, 0) }),
    feedback: 'LTV вырос, но удержание снизилось из-за сложности программы.'
  },
  {
    icon: '💸',
    title: 'Снижение цены',
    description: 'Увеличивает конверсию на 3%, снижает LTV на $10.',
    apply: (m: Metrics) => ({ Conversion: Math.min(m.Conversion + 3, 100), LTV: Math.max(m.LTV - 10, 0) }),
    feedback: 'Конверсия выросла, но LTV немного снизился.'
  },
  {
    icon: '🛠️',
    title: 'Инвестиции в поддержку',
    description: 'Увеличивает Retention Rate на 8%, снижает бюджет на $100.',
    apply: (m: Metrics) => ({ Retention: Math.min(m.Retention + 8, 100), Budget: m.Budget - 100 }),
    feedback: 'Удержание выросло, но бюджет уменьшился.'
  },
  {
    icon: '🧪',
    title: 'Экспериментальный маркетинг',
    description: 'Снижает CAC на $20, риск: 40% шанс, что CAC вырастет на $25.',
    apply: (m: Metrics) => ({ CAC: Math.max(m.CAC - 20, 0) }),
    risk: { chance: 0.4, effect: (m: Metrics) => ({ CAC: m.CAC + 25 }), message: 'Эксперимент не удался — CAC вырос на $25.' },
    feedback: 'CAC снизился, но был риск.'
  },
];

function getRandomInitiatives() {
  const shuffled = INITIATIVES.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

function UnitQuestGame({ onExit, showLegend, setShowLegend, turn, setTurn, metrics, setMetrics, profitHistory, setProfitHistory, achievements, setAchievements, message, setMessage, gameOver, setGameOver, win, setWin, initiatives, setInitiatives, lastDelta, setLastDelta, lastOldMetrics, setLastOldMetrics }: {
  onExit: () => void;
  showLegend: boolean;
  setShowLegend: (v: boolean) => void;
  turn: number;
  setTurn: (v: number) => void;
  metrics: Metrics;
  setMetrics: (v: Metrics) => void;
  profitHistory: number[];
  setProfitHistory: (v: number[]) => void;
  achievements: string[];
  setAchievements: (v: string[]) => void;
  message: string | null;
  setMessage: (v: string | null) => void;
  gameOver: boolean;
  setGameOver: (v: boolean) => void;
  win: boolean;
  setWin: (v: boolean) => void;
  initiatives: { icon: string; title: string; description: string; apply: (m: Metrics) => Partial<Metrics>; feedback: string; risk?: { chance: number; effect: (m: Metrics) => Partial<Metrics>; message: string } }[];
  setInitiatives: (v: { icon: string; title: string; description: string; apply: (m: Metrics) => Partial<Metrics>; feedback: string; risk?: { chance: number; effect: (m: Metrics) => Partial<Metrics>; message: string } }[]) => void;
  lastDelta: Partial<Metrics> | null;
  setLastDelta: (v: Partial<Metrics> | null) => void;
  lastOldMetrics: Metrics | null;
  setLastOldMetrics: (v: Metrics | null) => void;
}) {
  // Все хуки только на верхнем уровне!
  const [showFirework, setShowFirework] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.style.opacity = '0';
      mainRef.current.style.transform = 'translateY(24px)';
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.style.opacity = '1';
          mainRef.current.style.transform = 'translateY(0)';
        }
      }, 30);
    }
  }, [showLegend, turn]);
  React.useEffect(() => {
    const ach: string[] = [];
    if (metrics.CAC <= 30) ach.push('Эффективный маркетолог');
    if (metrics.Retention >= 80) ach.push('Мастер удержания');
    if (metrics.LTV >= 150) ach.push('Гуру LTV');
    setAchievements(Array.from(new Set(ach)));
  }, [metrics]);

  // Условный рендер только после всех хуков!
  if (showLegend) {
    return (
      <section style={{ background: '#fff', borderRadius: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5e5e7', padding: 56, marginBottom: 48, marginTop: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif', display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', ...fadeStyle }}>
        <div style={{ fontWeight: 700, fontSize: 32, color: '#111', letterSpacing: -1, marginBottom: 0, lineHeight: 1.1 }}>Unit Quest: Битва за прибыль</div>
        <div style={{ fontSize: 20, color: '#222', fontWeight: 400, marginBottom: 0, lineHeight: 1.5, maxWidth: 520 }}>
          <b>Вы — основатель стартапа, развиваете цифровой продукт.</b> Ваша цель — достичь прибыли <b>$200&nbsp;000</b> за 10 месяцев, балансируя метрики юнит-экономики.<br /><br />
          <b>Как играть:</b>
          <ul style={{ margin: '16px 0 0 18px', color: '#444', fontSize: 18, lineHeight: 1.5 }}>
            <li>В начале игры стартовые метрики случайны — каждый раз новый вызов!</li>
            <li>В каждом ходу выберите одну из 3 инициатив, чтобы повлиять на метрики.</li>
            <li>Следите за CAC, LTV, Retention, Conversion, Клиентами, Бюджетом и Прибылью.</li>
            <li>Ваша задача — к 10-му ходу получить прибыль не менее $200&nbsp;000.</li>
            <li>Некоторые инициативы имеют риск — будьте внимательны!</li>
            <li>После изучения легенды нажмите «Начать игру».</li>
          </ul>
        </div>
        <button onClick={() => setShowLegend(false)} style={{ padding: '16px 40px', background: 'linear-gradient(90deg,#00b8ff,#7800ff 100%)', color: '#fff', fontWeight: 700, fontSize: 20, border: 'none', borderRadius: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,184,255,0.10)', transition: 'background 0.2s', marginTop: 24, willChange: 'transform' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >Начать игру</button>
      </section>
    );
  }

  function handleInitiative(idx: number) {
    if (gameOver) return;
    let m = { ...metrics };
    const ini = initiatives[idx];
    setLastOldMetrics({ ...metrics });
    // Применяем эффект
    m = { ...m, ...ini.apply(m) };
    let feedback = ini.feedback;
    // Риск
    if (ini.risk && Math.random() < ini.risk.chance) {
      m = { ...m, ...ini.risk.effect(m) };
      feedback = ini.risk.message;
    }
    // Считаем дельту метрик
    const delta: Partial<Metrics> = {};
    (['CAC', 'LTV', 'Retention', 'Conversion', 'Clients', 'Budget', 'Fixed', 'Profit'] as const).forEach(key => {
      if (metrics[key] !== m[key]) delta[key] = m[key];
    });
    setLastDelta(delta);
    // Формулы расчёта
    // Новые клиенты
    const newClients = Math.floor((m.Budget / (m.CAC || 1)) * (m.Conversion / 100));
    m.Clients = Math.max(m.Clients + newClients, 0);
    // LTV (оставляем как есть, можно усложнить)
    // Retention (оставляем как есть)
    // Прибыль за месяц
    m.Profit = (m.LTV - m.CAC) * m.Clients - m.Fixed;
    m.Budget = m.Budget + m.Profit - m.Fixed;

    // Проверка победы/поражения
    let over = false, win = false;
    if (m.Budget < 0) {
      over = true;
      setMessage('Бюджет ушёл в минус. Игра окончена!');
    } else if (turn === MAX_TURNS && m.Profit >= WIN_PROFIT) {
      over = true; win = true;
      setMessage('Поздравляем! Вы достигли цели по прибыли!');
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.7 },
          zIndex: 9999
        });
      });
    } else if (turn === MAX_TURNS) {
      over = true;
      setMessage('Цель не достигнута за 10 ходов. Попробуйте ещё раз!');
    } else {
      setMessage(feedback);
    }

    setMetrics(m);
    setProfitHistory([...profitHistory, m.Profit]);
    setGameOver(over);
    setWin(win);
    if (!over) setTurn(turn + 1);
    setInitiatives(getRandomInitiatives());
  }

  // График прибыли
  function ProfitChart() {
    const W = 420, H = 120, pad = 36;
    const data = profitHistory.map((y, i) => ({ x: i, y }));
    let minY = Math.min(...profitHistory, 0, WIN_PROFIT);
    let maxY = Math.max(...profitHistory, 0, WIN_PROFIT);
    if (minY === maxY) {
      minY -= 100;
      maxY += 100;
    }
    const scaleX = (x: number) => pad + (x / MAX_TURNS) * (W - 2 * pad);
    const scaleY = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(d.x)},${scaleY(d.y)}`).join(' ');
    return (
      <div style={{ width: '100%', minWidth: 0, overflow: 'hidden', maxWidth: 420, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#bbb" strokeWidth={1.5} />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#bbb" strokeWidth={1.5} />
          <path d={path} fill="none" stroke="url(#grad)" strokeWidth={3} />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00b8ff" />
              <stop offset="100%" stopColor="#7800ff" />
            </linearGradient>
          </defs>
          {/* Целевая метрика */}
          <line x1={pad} y1={scaleY(WIN_PROFIT)} x2={W - pad} y2={scaleY(WIN_PROFIT)} stroke="#00b8ff" strokeWidth={2} strokeDasharray="6 6" />
          <text x={W - pad + 4} y={scaleY(WIN_PROFIT) + 4} fontSize={14} fill="#00b8ff" fontWeight={700}>Цель $200&nbsp;000</text>
          {/* Подписи X */}
          {[0, 2, 4, 6, 8, 10].map(x => (
            <text key={x} x={scaleX(x)} y={H - pad + 22} fontSize={13} fill="#888" textAnchor="middle">{x}</text>
          ))}
          {/* Подписи Y */}
          {[minY, 0, WIN_PROFIT].map(y => (
            <text key={y} x={pad - 10} y={scaleY(y) + 5} fontSize={13} fill="#888" textAnchor="end">{formatNumber(Math.round(y))}</text>
          ))}
          <text x={W/2} y={H - 2} fontSize={14} fill="#0a2540" textAnchor="middle" fontWeight={600}>Ходы</text>
          <text x={pad - 32} y={pad - 8} fontSize={14} fill="#0a2540" textAnchor="middle" fontWeight={600} transform={`rotate(-90,${pad - 32},${pad - 8})`}>Прибыль, $</text>
        </svg>
      </div>
    );
  }

  const handleExit = () => {
    setShowLegend(true);
    setTurn(1);
    setMetrics(getRandomInitMetrics());
    setProfitHistory([0]);
    setAchievements([]);
    setMessage(null);
    setGameOver(false);
    setWin(false);
    setInitiatives(getRandomInitiatives());
    setLastDelta(null);
    setLastOldMetrics(null);
  };

  return (
    <section ref={mainRef} style={{ background: '#fff', borderRadius: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5e5e7', padding: 56, marginBottom: 48, marginTop: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif', display: 'flex', flexDirection: 'column', gap: 36, ...fadeStyle, position: 'relative', paddingTop: 110 }}>
      <AchievementsFooter achievements={achievements} />
      <div style={{ fontWeight: 700, fontSize: 32, color: '#111', letterSpacing: -1, marginBottom: 0, lineHeight: 1.1 }}>Unit Quest: Битва за прибыль</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {message && <div style={{ fontSize: 17, color: gameOver && !win ? '#ff3b30' : '#0a2540', background: '#f8f8fa', borderRadius: 10, padding: '12px 18px', fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>{message}</div>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 12 }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>CAC: <span style={{ color: '#00b8ff' }}>${formatNumber(metrics.CAC)}</span>{lastDelta && lastOldMetrics && lastDelta.CAC !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.CAC)}→{formatNumber(metrics.CAC)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>LTV: <span style={{ color: '#7800ff' }}>${formatNumber(metrics.LTV)}</span>{lastDelta && lastOldMetrics && lastDelta.LTV !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.LTV)}→{formatNumber(metrics.LTV)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Retention: <span style={{ color: '#00b8ff' }}>{metrics.Retention}%</span>{lastDelta && lastOldMetrics && lastDelta.Retention !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Retention)}→{formatNumber(metrics.Retention)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Conversion: <span style={{ color: '#7800ff' }}>{metrics.Conversion}%</span>{lastDelta && lastOldMetrics && lastDelta.Conversion !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Conversion)}→{formatNumber(metrics.Conversion)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Клиенты: <span style={{ color: '#00b8ff' }}>{formatNumber(metrics.Clients)}</span>{lastDelta && lastOldMetrics && lastDelta.Clients !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Clients)}→{formatNumber(metrics.Clients)})</span> : null}</div>
        </div>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Бюджет: <span style={{ color: '#00b8ff' }}>${formatNumber(metrics.Budget)}</span>{lastDelta && lastOldMetrics && lastDelta.Budget !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Budget)}→{formatNumber(metrics.Budget)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Фикс. затраты: <span style={{ color: '#7800ff' }}>${formatNumber(metrics.Fixed)}</span>{lastDelta && lastOldMetrics && lastDelta.Fixed !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Fixed)}→{formatNumber(metrics.Fixed)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Прибыль: <span style={{ color: metrics.Profit >= 0 ? '#00b8ff' : '#ff3b30' }}>${formatNumber(metrics.Profit)}</span>{lastDelta && lastOldMetrics && lastDelta.Profit !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Profit)}→{formatNumber(metrics.Profit)})</span> : null}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <ProfitChart />
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>Выберите инициативу:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, margin: '1px 0 18px 0' }}>
        {initiatives.map((ini, idx) => (
          <button
            key={ini.title}
            onClick={() => handleInitiative(idx)}
            disabled={gameOver}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg,#f0f7ff,#e0f7fa 100%)',
              border: '1.5px solid #d1d1d6',
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(0,184,255,0.07)',
              padding: '20px 28px',
              fontSize: 17,
              fontWeight: 600,
              color: '#0a2540',
              cursor: gameOver ? 'not-allowed' : 'pointer',
              transition: 'box-shadow 0.2s, transform 0.15s, background 0.2s',
              marginBottom: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 18,
              minHeight: 64,
              textAlign: 'left',
              willChange: 'transform',
              opacity: gameOver ? 0.6 : 1,
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = ''}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            onFocus={e => e.currentTarget.style.boxShadow = '0 4px 16px #00b8ff33'}
            onBlur={e => e.currentTarget.style.boxShadow = ''}
          >
            <span style={{ fontSize: 32, marginRight: 16 }}>{ini.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 4 }}>{ini.title}</div>
              <div style={{ color: '#888', fontSize: 15 }}>{ini.description}</div>
            </div>
          </button>
        ))}
      </div>
      {gameOver && (
        <button onClick={handleExit} style={{ marginTop: 24, width: 180, alignSelf: 'center', padding: '14px 0', background: 'linear-gradient(90deg,#00b8ff,#7800ff 100%)', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,184,255,0.10)', transition: 'background 0.2s' }}>Выйти в симулятор</button>
      )}
    </section>
  );
}

export default function EconomySimulator() {
  const [showLegend, setShowLegend] = React.useState(true);
  const [turn, setTurn] = React.useState(1);
  const [metrics, setMetrics] = React.useState(() => getRandomInitMetrics());
  const [profitHistory, setProfitHistory] = React.useState<number[]>([0]);
  const [achievements, setAchievements] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [gameOver, setGameOver] = React.useState(false);
  const [win, setWin] = React.useState(false);
  const [initiatives, setInitiatives] = React.useState(getRandomInitiatives());
  const [lastDelta, setLastDelta] = React.useState<Partial<Metrics> | null>(null);
  const [lastOldMetrics, setLastOldMetrics] = React.useState<Metrics | null>(null);

  const handleExit = () => {
    setShowLegend(true);
    setTurn(1);
    setMetrics(getRandomInitMetrics());
    setProfitHistory([0]);
    setAchievements([]);
    setMessage(null);
    setGameOver(false);
    setWin(false);
    setInitiatives(getRandomInitiatives());
    setLastDelta(null);
    setLastOldMetrics(null);
  };

  return (
    <UnitQuestGame
      showLegend={showLegend}
      setShowLegend={setShowLegend}
      onExit={handleExit}
      turn={turn}
      setTurn={setTurn}
      metrics={metrics}
      setMetrics={setMetrics}
      profitHistory={profitHistory}
      setProfitHistory={setProfitHistory}
      achievements={achievements}
      setAchievements={setAchievements}
      message={message}
      setMessage={setMessage}
      gameOver={gameOver}
      setGameOver={setGameOver}
      win={win}
      setWin={setWin}
      initiatives={initiatives}
      setInitiatives={setInitiatives}
      lastDelta={lastDelta}
      setLastDelta={setLastDelta}
      lastOldMetrics={lastOldMetrics}
      setLastOldMetrics={setLastOldMetrics}
    />
  );
}

// Пример стиля для инпутов и кнопок в стиле Revolut
const revolutInputStyle = {
  width: '100%',
  padding: '18px 20px',
  border: '1.5px solid #d1d1d6',
  borderRadius: 16,
  fontSize: 20,
  background: 'linear-gradient(120deg, #f6f8fa 0%, #fff 100%)',
  outline: 'none',
  color: '#111',
  fontWeight: 500,
  transition: 'border 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box' as const,
  marginBottom: 4,
  boxShadow: '0 2px 12px 0 rgba(0,184,255,0.07)',
};
const revolutButtonStyle = (active: boolean = true) => ({
  padding: '16px 40px',
  background: active
    ? 'linear-gradient(90deg,#00b8ff,#7800ff 100%)'
    : 'linear-gradient(90deg, #e0e0e0 0%, #f2f2f7 100%)',
  color: active ? '#fff' : '#bbb',
  fontWeight: 700,
  fontSize: 20,
  border: 'none',
  borderRadius: 18,
  cursor: active ? 'pointer' : 'not-allowed',
  boxShadow: active ? '0 2px 12px 0 rgba(0,184,255,0.10)' : 'none',
  marginBottom: 16,
  marginTop: 8,
  transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
  willChange: 'transform',
  letterSpacing: 0.2,
});
