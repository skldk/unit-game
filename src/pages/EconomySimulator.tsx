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

// --- Расширенные ачивки ---
const ACHIEVEMENTS_EXT: {
  key: string;
  label: string;
  desc: string;
  check: (params: { metrics: Metrics; history: Metrics[]; riskFails: number; abTests: number; partnerships: number; viralityClients: number; supportUpgrades: number; opexLowStreak: number; }) => boolean;
}[] = [
  {
    key: 'cacczar',
    label: 'Царь CAC',
    desc: 'Снизить CAC до $25 и держать 3 хода подряд.',
    check: ({ history }) => history.slice(-3).every(m => m.CAC <= 25),
  },
  {
    key: 'ltvlegend',
    label: 'LTV-легенда',
    desc: 'LTV ≥ $200, Retention ≥ 80%, NPS ≥ 70.',
    check: ({ metrics }) => metrics.LTV >= 200 && metrics.Retention >= 80 && metrics.NPS >= 70,
  },
  {
    key: 'viralvirus',
    label: 'Виральный вирус',
    desc: 'Привлечь 500 клиентов через Virality.',
    check: ({ viralityClients }) => viralityClients >= 500,
  },
  {
    key: 'retuniverse',
    label: 'Удержатель вселенной',
    desc: 'Retention ≥ 90% после 5 улучшений продукта.',
    check: ({ metrics, supportUpgrades }) => metrics.Retention >= 90 && supportUpgrades >= 5,
  },
  {
    key: 'riskmaster',
    label: 'Мастер рисков',
    desc: 'Выиграть после 3 негативных событий.',
    check: ({ riskFails, metrics }) => riskFails >= 3 && metrics.Profit >= WIN_PROFIT,
  },
  {
    key: 'optimizer',
    label: 'Оптимизатор',
    desc: '10 успешных A/B тестов (инициативы с приростом Conversion).',
    check: ({ abTests }) => abTests >= 10,
  },
  {
    key: 'networker',
    label: 'Нетворкер',
    desc: '5 партнерств.',
    check: ({ partnerships }) => partnerships >= 5,
  },
  {
    key: 'crisismanager',
    label: 'Кризис-менеджер',
    desc: 'Пережить 2 экономических кризиса (негативные риски).',
    check: ({ riskFails }) => riskFails >= 2,
  },
  {
    key: 'supportninja',
    label: 'Ниндзя поддержки',
    desc: 'NPS ≥ 85 после 3 улучшений поддержки.',
    check: ({ metrics, supportUpgrades }) => metrics.NPS >= 85 && supportUpgrades >= 3,
  },
  {
    key: 'financemaster',
    label: 'Финансовый гуру',
    desc: 'OpEx ≤ $100 в течение 4 ходов.',
    check: ({ history }) => history.slice(-4).every(m => m.OpEx <= 100),
  },
];

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
    NPS: Math.round(40 + Math.random() * 20), // 40-60
    Virality: 0.1 + Math.random() * 0.2, // 0.1-0.3
    Traffic: Math.round(100 + Math.random() * 50), // 100-150
    OpEx: 200 + Math.round(Math.random() * 100), // 200-300
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
  risk?: { chance: number; effect: (m: Metrics) => Partial<Metrics>; message: string; condition?: (m: Metrics) => boolean };
}[] = [
  // Маркетинг
  {
    icon: '🔎',
    title: 'Контекстная реклама в Google Ads',
    description: 'CAC -$10, Конверсия +2%. Риск: При NPS < 50 → CAC +$15 (пользователи жалуются на навязчивость).',
    apply: m => ({ CAC: Math.max(m.CAC - 10, 0), Conversion: Math.min(m.Conversion + 2, 100) }),
    feedback: 'Реклама привела новых клиентов, но есть риск негатива.',
    risk: {
      chance: 0.2,
      effect: m => ({ CAC: m.CAC + 15 }),
      message: 'Пользователи жалуются на навязчивую рекламу — CAC вырос!',
      condition: m => m.NPS < 50
    }
  },
  {
    icon: '📢',
    title: 'Таргетированная рассылка в соцсетях',
    description: 'Конверсия +3%, Virality +0.1. Риск: При Retention < 50% → NPS -7.',
    apply: m => ({ Conversion: Math.min(m.Conversion + 3, 100), Virality: m.Virality + 0.1 }),
    feedback: 'Рассылка сработала, но есть риск негатива.',
    risk: {
      chance: 0.2,
      effect: m => ({ NPS: m.NPS - 7 }),
      message: 'Пользователи считают рассылку спамом — NPS снизился!',
      condition: m => m.Retention < 50
    }
  },
  {
    icon: '🤝',
    title: 'Коллаборация с микроблогером',
    description: 'Трафик +20%, LTV +$10. Риск: Если блогер теряет популярность → Трафик -30%.',
    apply: m => ({ Traffic: m.Traffic + 20, LTV: m.LTV + 10 }),
    feedback: 'Блогер привёл новую аудиторию!',
    risk: {
      chance: 0.15,
      effect: m => ({ Traffic: Math.max(m.Traffic - 30, 0) }),
      message: 'Блогер потерял популярность — трафик упал!',
      condition: m => true
    }
  },
  // Продукт
  {
    icon: '✨',
    title: 'Добавление новой функции',
    description: 'Retention +8%, LTV +$15. Риск: 25% шанс, что функция багнутая → NPS -10, OpEx +$100.',
    apply: m => ({ Retention: Math.min(m.Retention + 8, 100), LTV: m.LTV + 15 }),
    feedback: 'Новая функция понравилась клиентам!',
    risk: {
      chance: 0.25,
      effect: m => ({ NPS: m.NPS - 10, OpEx: m.OpEx + 100 }),
      message: 'Функция оказалась с багами — NPS и OpEx пострадали.',
      condition: m => true
    }
  },
  {
    icon: '🚀',
    title: 'Упрощение onboarding',
    description: 'Конверсия +5%, Retention +5%. Риск: При частых изменениях → NPS -5.',
    apply: m => ({ Conversion: Math.min(m.Conversion + 5, 100), Retention: Math.min(m.Retention + 5, 100) }),
    feedback: 'Onboarding стал проще!',
    risk: {
      chance: 0.2,
      effect: m => ({ NPS: m.NPS - 5 }),
      message: 'Клиенты теряются из-за частых изменений — NPS снизился.',
      condition: m => true
    }
  },
  {
    icon: '💳',
    title: 'Ввод платной подписки',
    description: 'LTV +$25, Конверсия -3%. Риск: Если LTV > $150 → Конверсия +2%.',
    apply: m => ({ LTV: m.LTV + 25, Conversion: Math.max(m.Conversion - 3, 0) }),
    feedback: 'Платная подписка увеличила LTV, но часть клиентов ушла.',
    risk: {
      chance: 0.2,
      effect: m => ({ Conversion: m.Conversion + 2 }),
      message: 'Премиум-статус привлёк новых клиентов!',
      condition: m => m.LTV > 150
    }
  },
  // Поддержка клиентов
  {
    icon: '💬',
    title: 'Круглосуточный чат с поддержкой',
    description: 'NPS +10, Retention +7%. Риск: OpEx +$120/мес.',
    apply: m => ({ NPS: m.NPS + 10, Retention: Math.min(m.Retention + 7, 100) }),
    feedback: 'Поддержка стала лучше, клиенты довольны!',
    risk: {
      effect: m => ({ OpEx: m.OpEx + 120 }),
      message: 'Затраты на поддержку выросли (OpEx)!',
      chance: 1,
      condition: m => true
    }
  },
  {
    icon: '🤖',
    title: 'Внедрение AI-помощника',
    description: 'OpEx -$50, NPS +5. Риск: 20% шанс, что AI ошибается → NPS -15.',
    apply: m => ({ OpEx: Math.max(m.OpEx - 50, 0), NPS: m.NPS + 5 }),
    feedback: 'AI-помощник снизил затраты и повысил NPS!',
    risk: {
      chance: 0.2,
      effect: m => ({ NPS: m.NPS - 15 }),
      message: 'AI дал некорректные ответы — NPS снизился.',
      condition: m => true
    }
  },
  // Партнерства
  {
    icon: '🔗',
    title: 'Интеграция с популярным сервисом',
    description: 'Трафик +40%, LTV +$20. Риск: Если сервис меняет политику → Трафик -50%.',
    apply: m => ({ Traffic: m.Traffic + 40, LTV: m.LTV + 20 }),
    feedback: 'Интеграция дала мощный прирост!',
    risk: {
      chance: 0.15,
      effect: m => ({ Traffic: Math.max(m.Traffic - 50, 0) }),
      message: 'Сервис изменил политику — трафик упал.',
      condition: m => true
    }
  },
  {
    icon: '🎉',
    title: 'Совместная акция с брендом',
    description: 'CAC -$15, Virality +0.2. Риск: При несовпадении ЦА → Конверсия -4%.',
    apply: m => ({ CAC: Math.max(m.CAC - 15, 0), Virality: m.Virality + 0.2 }),
    feedback: 'Акция с брендом повысила узнаваемость!',
    risk: {
      chance: 0.2,
      effect: m => ({ Conversion: Math.max(m.Conversion - 4, 0) }),
      message: 'Целевая аудитория не совпала — конверсия упала.',
      condition: m => true
    }
  },
  // Операции
  {
    icon: '📊',
    title: 'Автоматизация отчетности',
    description: 'OpEx -$30, Конверсия +1%. Риск: При сбое → Конверсия -3%.',
    apply: m => ({ OpEx: Math.max(m.OpEx - 30, 0), Conversion: Math.min(m.Conversion + 1, 100) }),
    feedback: 'Автоматизация ускорила аналитику!',
    risk: {
      chance: 0.2,
      effect: m => ({ Conversion: Math.max(m.Conversion - 3, 0) }),
      message: 'Сбой автоматизации — конверсия упала.',
      condition: m => true
    }
  },
  {
    icon: '☁️',
    title: 'Переход на облачные серверы',
    description: 'OpEx -$40, NPS +3. Риск: 10% шанс на сбой → NPS -10.',
    apply: m => ({ OpEx: Math.max(m.OpEx - 40, 0), NPS: m.NPS + 3 }),
    feedback: 'Сервера стали быстрее и дешевле!',
    risk: {
      chance: 0.1,
      effect: m => ({ NPS: m.NPS - 10 }),
      message: 'Технический сбой — NPS снизился.',
      condition: m => true
    }
  },
  // Лояльность
  {
    icon: '💰',
    title: 'Система кэшбэка',
    description: 'Retention +10%, LTV +$10. Риск: При высокой конкуренции → CAC +$10.',
    apply: m => ({ Retention: Math.min(m.Retention + 10, 100), LTV: m.LTV + 10 }),
    feedback: 'Кэшбэк повысил лояльность!',
    risk: {
      chance: 0.2,
      effect: m => ({ CAC: m.CAC + 10 }),
      message: 'Конкуренты вынудили увеличить CAC.',
      condition: m => true
    }
  },
  {
    icon: '🎟️',
    title: 'Эксклюзивные мероприятия для клиентов',
    description: 'NPS +12, Virality +0.3. Риск: OpEx +$200.',
    apply: m => ({ NPS: m.NPS + 12, Virality: m.Virality + 0.3 }),
    feedback: 'Мероприятия повысили лояльность и виральность!',
    risk: {
      effect: m => ({ OpEx: m.OpEx + 200 }),
      message: 'Организация мероприятий увеличила OpEx.',
      chance: 1,
      condition: m => true
    }
  },
  // Аналитика
  {
    icon: '🔬',
    title: 'Глубокий анализ данных о клиентах',
    description: 'Конверсия +4%, LTV +$10. Риск: При утечке данных → NPS -20, OpEx +$150.',
    apply: m => ({ Conversion: Math.min(m.Conversion + 4, 100), LTV: m.LTV + 10 }),
    feedback: 'Аналитика помогла понять клиентов!',
    risk: {
      chance: 0.15,
      effect: m => ({ NPS: m.NPS - 20, OpEx: m.OpEx + 150 }),
      message: 'Утечка данных — штрафы и падение NPS.',
      condition: m => true
    }
  },
  {
    icon: '📈',
    title: 'Прогнозирование спроса',
    description: 'CAC -$5, Retention +5%. Риск: При ошибке прогноза → LTV -$10.',
    apply: m => ({ CAC: Math.max(m.CAC - 5, 0), Retention: Math.min(m.Retention + 5, 100) }),
    feedback: 'Прогноз оказался точным!',
    risk: {
      chance: 0.2,
      effect: m => ({ LTV: Math.max(m.LTV - 10, 0) }),
      message: 'Ошибка прогноза — LTV снизился.',
      condition: m => true
    }
  },
  // Внешние факторы
  {
    icon: '🏆',
    title: 'Участие в отраслевой конференции',
    description: 'Трафик +25%, LTV +$15. Риск: 30% шанс провала → Трафик -10%.',
    apply: m => ({ Traffic: m.Traffic + 25, LTV: m.LTV + 15 }),
    feedback: 'Конференция дала новых клиентов!',
    risk: {
      chance: 0.3,
      effect: m => ({ Traffic: Math.max(m.Traffic - 10, 0) }),
      message: 'Мероприятие провалилось — трафик упал.',
      condition: m => true
    }
  },
  {
    icon: '🛍️',
    title: 'Сезонная распродажа',
    description: 'Конверсия +6%, LTV -$10. Риск: При низком NPS → Retention -8%.',
    apply: m => ({ Conversion: Math.min(m.Conversion + 6, 100), LTV: Math.max(m.LTV - 10, 0) }),
    feedback: 'Скидки увеличили продажи!',
    risk: {
      chance: 0.2,
      effect: m => ({ Retention: Math.max(m.Retention - 8, 0) }),
      message: 'Низкий NPS — удержание снизилось.',
      condition: m => m.NPS < 50
    }
  },
  // HR-стратегии
  {
    icon: '🎓',
    title: 'Обучение сотрудников',
    description: 'NPS +7, Retention +5%. Риск: OpEx +$80.',
    apply: m => ({ NPS: m.NPS + 7, Retention: Math.min(m.Retention + 5, 100) }),
    feedback: 'Команда стала сильнее!',
    risk: {
      effect: m => ({ OpEx: m.OpEx + 80 }),
      message: 'Обучение стоит денег — OpEx вырос.',
      chance: 1,
      condition: m => true
    }
  },
  {
    icon: '🧑‍💻',
    title: 'Аутсорсинг поддержки',
    description: 'OpEx -$60. Риск: NPS -10 (низкое качество услуг).',
    apply: m => ({ OpEx: Math.max(m.OpEx - 60, 0) }),
    feedback: 'Затраты на поддержку снижены!',
    risk: {
      chance: 0.2,
      effect: m => ({ NPS: m.NPS - 10 }),
      message: 'Качество поддержки упало — NPS снизился.',
      condition: m => true
    }
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

  const [metricsHistory, setMetricsHistory] = React.useState<Metrics[]>([]);
  const [riskFails, setRiskFails] = React.useState(0);
  const [abTests, setAbTests] = React.useState(0);
  const [partnerships, setPartnerships] = React.useState(0);
  const [viralityClients, setViralityClients] = React.useState(0);
  const [supportUpgrades, setSupportUpgrades] = React.useState(0);
  const [opexLowStreak, setOpexLowStreak] = React.useState(0);

  function checkAchievements(metrics: Metrics) {
    const params = {
      metrics,
      history: metricsHistory,
      riskFails,
      abTests,
      partnerships,
      viralityClients,
      supportUpgrades,
      opexLowStreak,
    };
    const newAch = [...achievements];
    for (const ach of ACHIEVEMENTS_EXT) {
      if (!newAch.includes(ach.label) && ach.check(params)) {
        newAch.push(ach.label);
      }
    }
    setAchievements(Array.from(new Set(newAch)));
  }

  function handleInitiative(idx: number) {
    if (gameOver) return;
    let m = { ...metrics };
    const ini = initiatives[idx];
    setLastOldMetrics({ ...metrics });
    // Применяем эффект
    m = { ...m, ...ini.apply(m) };
    let feedback = ini.feedback;
    let riskTriggered = false;
    // Риск
    if (ini.risk && ('condition' in ini.risk ? typeof ini.risk.condition === 'function' ? ini.risk.condition(m) : true : true)) {
      if (Math.random() < ini.risk.chance) {
        m = { ...m, ...ini.risk.effect(m) };
        feedback = ini.risk.message;
        riskTriggered = true;
      }
    }
    // Считаем дельту метрик
    const delta: Partial<Metrics> = {};
    (['CAC', 'LTV', 'Retention', 'Conversion', 'Clients', 'Budget', 'Fixed', 'Profit', 'NPS', 'Virality', 'Traffic', 'OpEx'] as const).forEach(key => {
      if (metrics[key] !== m[key]) delta[key] = m[key];
    });
    setLastDelta(delta);
    // Формулы расчёта
    // Новые клиенты
    const newClients = Math.floor((m.Budget / (m.CAC || 1)) * (m.Conversion / 100));
    m.Clients = Math.max(m.Clients + newClients, 0);
    // Virality клиентов
    if (m.Virality > 0) {
      setViralityClients(v => v + Math.floor(newClients * m.Virality));
    }
    // LTV (оставляем как есть, можно усложнить)
    // Retention (оставляем как есть)
    // Прибыль за месяц
    m.Profit = (m.LTV - m.CAC) * m.Clients - m.Fixed - m.OpEx;
    m.Budget = m.Budget + m.Profit - m.Fixed - m.OpEx;

    // Счётчики для ачивок
    // 1. riskFails
    if (riskTriggered && feedback && feedback.toLowerCase().includes('упал') || feedback.toLowerCase().includes('снизился') || feedback.toLowerCase().includes('штраф') || feedback.toLowerCase().includes('сбой') || feedback.toLowerCase().includes('потеря')) {
      setRiskFails(r => r + 1);
    }
    // 2. abTests (каждое изменение Conversion)
    if (delta.Conversion !== undefined && delta.Conversion > metrics.Conversion) {
      setAbTests(a => a + 1);
    }
    // 3. partnerships (по ключевым словам в title)
    if (/партнер|партнёр|интеграция|коллаб|акция|бренд/i.test(ini.title)) {
      setPartnerships(p => p + 1);
    }
    // 4. supportUpgrades (по ключевым словам в title)
    if (/поддержк|чат|ai|помощник|аутсорсинг/i.test(ini.title)) {
      setSupportUpgrades(s => s + 1);
    }
    // 5. opexLowStreak
    if (m.OpEx <= 100) {
      setOpexLowStreak(s => s + 1);
    } else {
      setOpexLowStreak(0);
    }

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
    setMetricsHistory([...metricsHistory, m]);
    checkAchievements(m);
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
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Трафик: <span style={{ color: '#00b8ff' }}>{formatNumber(metrics.Traffic)}</span>{lastDelta && lastOldMetrics && lastDelta.Traffic !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Traffic)}→{formatNumber(metrics.Traffic)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Виральность: <span style={{ color: '#7800ff' }}>{metrics.Virality.toFixed(2)}</span>{lastDelta && lastOldMetrics && lastDelta.Virality !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({lastOldMetrics.Virality.toFixed(2)}→{metrics.Virality.toFixed(2)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>NPS: <span style={{ color: '#00b8ff' }}>{metrics.NPS}</span>{lastDelta && lastOldMetrics && lastDelta.NPS !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.NPS)}→{formatNumber(metrics.NPS)})</span> : null}</div>
        </div>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Бюджет: <span style={{ color: '#00b8ff' }}>${formatNumber(metrics.Budget)}</span>{lastDelta && lastOldMetrics && lastDelta.Budget !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Budget)}→{formatNumber(metrics.Budget)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>Фикс. затраты: <span style={{ color: '#7800ff' }}>${formatNumber(metrics.Fixed)}</span>{lastDelta && lastOldMetrics && lastDelta.Fixed !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.Fixed)}→{formatNumber(metrics.Fixed)})</span> : null}</div>
          <div style={{ fontSize: 18, color: '#0a2540', fontWeight: 600 }}>OpEx: <span style={{ color: '#7800ff' }}>${formatNumber(metrics.OpEx)}</span>{lastDelta && lastOldMetrics && lastDelta.OpEx !== undefined ? <span style={{ color: '#888', fontSize: 15 }}> ({formatNumber(lastOldMetrics.OpEx)}→{formatNumber(metrics.OpEx)})</span> : null}</div>
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
  const [metricsHistory, setMetricsHistory] = React.useState<Metrics[]>([]);
  const [riskFails, setRiskFails] = React.useState(0);
  const [abTests, setAbTests] = React.useState(0);
  const [partnerships, setPartnerships] = React.useState(0);
  const [viralityClients, setViralityClients] = React.useState(0);
  const [supportUpgrades, setSupportUpgrades] = React.useState(0);
  const [opexLowStreak, setOpexLowStreak] = React.useState(0);

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

  function checkAchievements(metrics: Metrics) {
    const params = {
      metrics,
      history: metricsHistory,
      riskFails,
      abTests,
      partnerships,
      viralityClients,
      supportUpgrades,
      opexLowStreak,
    };
    const newAch = [...achievements];
    for (const ach of ACHIEVEMENTS_EXT) {
      if (!newAch.includes(ach.label) && ach.check(params)) {
        newAch.push(ach.label);
      }
    }
    setAchievements(Array.from(new Set(newAch)));
  }

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
