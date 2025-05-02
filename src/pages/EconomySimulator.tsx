import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Fireworks } from 'fireworks-js';

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
  { key: 'acquisition', label: 'Привлечение', icon: '📈', desc: 'Влияет на: Users, C1, CPUser. Основные задачи: снижение CPUser, повышение релевантности трафика.' },
  { key: 'product', label: 'Продукт', icon: '🛠️', desc: 'Влияет на: AvPrice, COGS. Основные задачи: увеличение ценности продукта, снижение себестоимости.' },
  { key: 'onboarding', label: 'Онбординг', icon: '🎓', desc: 'Влияет на: C1. Основные задачи: улучшение конверсии через адаптацию клиентов.' },
  { key: 'admin', label: 'Админ', icon: '🏢', desc: 'Влияет на: FixCosts. Основные задачи: оптимизация постоянных расходов.' },
];

const INITIATIVES: Record<Department, Initiative[]> = {
  acquisition: 
  
  [
    
      // SEO-оптимизация 
      { title: 'Внедрить нейросетевой генератор SEO-текстов', description: 'Users +100, CPUser -$10', apply: m => recalcMetrics({...m, Users: m.Users + 100, CPUser: Math.max(m.CPUser - 10, 0)}), successChance: 0.7, risk: {chance: 0.25, effect: m => recalcMetrics({...m, C1: m.C1 - 5}), message: 'Переоптимизация → C1 -5%'}}, // падения в ранжировании
      { title: 'Запуск контент блога', description: 'Users +300, CPUser -$17, FixCost +$2500 ', apply: m => recalcMetrics({...m, Users: m.Users + 300, CPUser: Math.max(m.CPUser - 17, 0), FixCosts: m.FixCosts + 2500}), successChance: 0.7, risk: {chance: 0.7, effect: m => recalcMetrics({...m, C1: m.C1 - 10}), message: 'Много не целевого трафика → C1 -10%'}}, // падения в ранжировании
  
      // Брендовые кампании
      { title: 'Запустить медийную рекламу (PR)', description: 'Users +3000, FixCosts +$25 000', apply: m => recalcMetrics({...m, Users: m.Users + 3000, FixCosts: m.FixCosts + 25000}), successChance: 0.55, risk: {chance: 0.7, effect: m => recalcMetrics({...m, C1: m.C1 - 10}), message: 'Много не целевого трафика → C1 -10%'}}, // падения в ранжировании
  
      // Performance-маркетинг
      { title: 'Небольшое маштибирование работающих компаний', description: 'Users +1 000, CPUser +$2', apply: m => recalcMetrics({...m, Users: m.Users + 500, CPUser: Math.max(m.CPUser + 2, 0)}), successChance: 0.65},
      { title: 'Закупать больше трафика в контексте', description: 'Users +5 000, CPUser +$3', apply: m => recalcMetrics({...m, Users: m.Users + 1000, CPUser: Math.max(m.CPUser + 3, 0)}), successChance: 0.65},
      { title: 'Закупать больше трафика по всем каналам', description: 'Users +10 000, CPUser +$6', apply: m => recalcMetrics({...m, Users: m.Users + 3000, CPUser: Math.max(m.CPUser + 6, 0)}), successChance: 0.65},
  
      // Оптимизационные инициативы (8 шт.)
      { title: 'Оптимизировать бюджеты под успешные кампании', description: 'CPUser -$7', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 7, 0)}), successChance: 0.72, risk: {chance: 0.3, effect: m => recalcMetrics({...m, Users: m.Users - 100}), message: 'Оптимизация сократила поток → Users -100'}},
      { title: 'Настроить автоматизированные стратегии показа', description: 'CPUser -$4, C1 +1%', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 4, 0), C1: m.C1 + 1}), successChance: 0.75, risk: {chance: 0.2, effect: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser + 1, 0)}), message: 'Алгоритмы учатся и пока CPUser увеличилась → CPUser +1$'}},
      { title: 'Провести аудит, и дать рекомендации агенству', description: 'CPUser -$5', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 5, 0)}), successChance: 0.7},
      
      // Рисковые каналы
      { title: 'Закупить рекламу у блогера-миллионика', description: 'Users +8000, FixCosts +$75 000', apply: m => recalcMetrics({...m, Users: m.Users + 8000, FixCosts: m.FixCosts + 75000}), successChance: 0.4, risk: {chance: 0.2, effect: m => recalcMetrics({...m, C1: m.C1 - 15}), message: 'Фрод → C1 -15%'}},
  
      // Гибридные стратегии
      { title: 'Синхронизировать omnichannel-воронку', description: 'CPUser -$6, Users +200', apply: m => recalcMetrics({...m, CPUser: Math.max(m.CPUser - 6, 0), Users: m.Users + 200}), successChance: 0.7}
  ],
  
 /* [ // больше инициатив на снижение CPUser  // константы не меняются 
    // здесь онулены риски

    
    { title: 'Запуск SEO-кампании', description: 'CPUser → 0, Users +500', apply: m => recalcMetrics({ ...m, CPUser: 0, Users: m.Users + Math.floor(500) }), successChance: 0.7, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(100 + 0*Math.random() * 200) }), risk: { chance: 0, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(100 + Math.random() * 200) }), message: 'Задержка на 2 хода — Users -100-300.' } },
    { title: 'Таргетированная реклама', description: 'C1 +10%, Users +300', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(10), Users: m.Users + Math.floor(300) }), successChance: 0.8, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(50 + Math.random() * 100) }), risk: { chance: 0, effect: m => recalcMetrics({ ...m, CPUser: m.CPUser + Math.floor(2 + Math.random() * 3) }), message: 'CPUser +$2-5 (нерелевантный трафик).' } },
    { title: 'Партнерство с блогером', description: 'Users +600, C1 -5%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(600), C1: m.C1 - Math.floor(5) }), successChance: 0.6, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(100 + Math.random() * 200) }), risk: { chance: 0, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(200 + Math.random() * 300) }), message: 'При низком NPS → Users -200-500.' } },
    { title: 'A/B тесты лендинга', description: 'C1 +15%', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(15) }), successChance: 0.7, risk: { chance: 0, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 4) }), message: 'Провал теста → C1 -4-8%.' } },
    { title: 'Реферальная программа', description: 'Users +200, COGS +$2', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(200 + Math.random() * 0), COGS: m.COGS + Math.floor(1 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0, effect: m => m, message: 'Бонусы за рефералов увеличили COGS.' } },
    { title: 'Контекстная реклама', description: 'Users +500, CPUser +$2', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(500 + Math.random() * 0), CPUser: m.CPUser + Math.floor(1 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 3) }), message: 'Высокая конкуренция → C1 -4-7%.' } },
    { title: 'Вебинары для ЦА', description: 'C1 +12%, Users +100, FixCosts +$800', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(10 + Math.random() * 4), Users: m.Users + Math.floor(80 + Math.random() * 40), FixCosts: m.FixCosts + Math.floor(600 + Math.random() * 400) }), successChance: 0.7 },
    { title: 'Покупка лидов', description: 'Users +800, C1 -15%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(600 + Math.random() * 400), C1: m.C1 - Math.floor(12 + Math.random() * 6) }), successChance: 0.7, risk: { chance: 0, effect: m => recalcMetrics({ ...m, CPUser: m.CPUser + Math.floor(2 + Math.random() * 2) }), message: 'Риск спама → CPUser +$2-4.' } },
    { title: 'Email-маркетинг', description: 'Users +200, C1 +8%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(150 + Math.random() * 100), C1: m.C1 + Math.floor(6 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 3) }), message: 'Частые рассылки → C1 -4-7%.' } },
    { title: 'Создание контента', description: 'Users +300 (SEO-трафик)', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(200 + Math.random() * 200) }), successChance: 0.7 },
  */
    //{ title: 'Запуск SEO-кампании', description: 'CPUser → 0, Users +500', apply: m => recalcMetrics({ ...m, CPUser: 0, Users: m.Users + Math.floor(300 + Math.random() * 400) }), successChance: 0.7, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(100 + Math.random() * 200) }), risk: { chance: 0.25, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(100 + Math.random() * 200) }), message: 'Задержка на 2 хода — Users -100-300.' } },
    //{ title: 'Таргетированная реклама', description: 'C1 +10%, Users +300', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(8 + Math.random() * 4), Users: m.Users + Math.floor(200 + Math.random() * 200) }), successChance: 0.8, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(50 + Math.random() * 100) }), risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, CPUser: m.CPUser + Math.floor(2 + Math.random() * 3) }), message: 'CPUser +$2-5 (нерелевантный трафик).' } },
    //{ title: 'Партнерство с блогером', description: 'Users +600, C1 -5%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(400 + Math.random() * 400), C1: m.C1 - Math.floor(3 + Math.random() * 4) }), successChance: 0.6, partialEffect: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(100 + Math.random() * 200) }), risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(200 + Math.random() * 300) }), message: 'При низком NPS → Users -200-500.' } },
    //{ title: 'A/B тесты лендинга', description: 'C1 +15%', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(12 + Math.random() * 6) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 4) }), message: 'Провал теста → C1 -4-8%.' } },
    //{ title: 'Реферальная программа', description: 'Users +200, COGS +$2', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(150 + Math.random() * 100), COGS: m.COGS + Math.floor(1 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0.2, effect: m => m, message: 'Бонусы за рефералов увеличили COGS.' } },
    //{ title: 'Контекстная реклама', description: 'Users +500, CPUser +$2', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(400 + Math.random() * 200), CPUser: m.CPUser + Math.floor(1 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 3) }), message: 'Высокая конкуренция → C1 -4-7%.' } },
    //{ title: 'Вебинары для ЦА', description: 'C1 +12%, Users +100, FixCosts +$800', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(10 + Math.random() * 4), Users: m.Users + Math.floor(80 + Math.random() * 40), FixCosts: m.FixCosts + Math.floor(600 + Math.random() * 400) }), successChance: 0.7 },
    //{ title: 'Покупка лидов', description: 'Users +800, C1 -15%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(600 + Math.random() * 400), C1: m.C1 - Math.floor(12 + Math.random() * 6) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, CPUser: m.CPUser + Math.floor(2 + Math.random() * 2) }), message: 'Риск спама → CPUser +$2-4.' } },
    //{ title: 'Email-маркетинг', description: 'Users +200, C1 +8%', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(150 + Math.random() * 100), C1: m.C1 + Math.floor(6 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(4 + Math.random() * 3) }), message: 'Частые рассылки → C1 -4-7%.' } },
    //{ title: 'Создание контента', description: 'Users +300 (SEO-трафик)', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(200 + Math.random() * 200) }), successChance: 0.7 },
 // ],
  product: // уменьшить по когсу и цене на 1-3   (еще подумать 20 и 15 сдеалать)
  [
    
      // Новые инициативы по снижению COGS
      { title: 'Оптимизировать кэширование ответов от ИИ через CDН', description: 'COGS -$7', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 7, 1)}), successChance: 0.65 },
      { title: 'Объединение нескольких API и сокращение платных запросов', description: 'COGS -$10', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 10, 1), AvPrice: m.AvPrice + 0}), successChance: 0.8 },
      { title: 'Сжатие данных: Применение алгоритмов Brotli для писем и вложений', description: 'COGS -$4', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 4, 1), C1: Math.min(Math.round(m.C1 * 1.0), 100)}), successChance: 0.75 },
      { title: 'Автоматизация запросов в поддержку', description: 'COGS -$3', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 3, 1), FixCosts: m.FixCosts + 0}), successChance: 0.6 },
      { title: 'Переводить старые письма в более дешевые хранилища', description: 'COGS -$5', apply: m => recalcMetrics({...m, COGS: Math.max(m.COGS - 5, 1), FixCosts: m.FixCosts + 0}), successChance: 0.6 },
  
      // Остальные инициативы (без изменения COGS)
      { title: 'Запустить модели склонности к тарифам на некупившую базу', description: 'AvPrice +$5, C1 +18%(отн.)', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 5, C1: Math.min(Math.round(m.C1 * 1.18), 100)}), successChance: 0.67 },
      { title: 'Расширить фичи в премиум подписке', description: 'C1 +18%(отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.08), 100), COGS: Math.max(m.COGS + 0, 1)}), successChance: 0.63 },
      { title: 'Оптимизировать тарифы (по сегментам и периодам)', description: 'C1 +8%(отн.), AvPrice +$5', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.08), 100), AvPrice: m.AvPrice + 5}), successChance: 0.7 },
      { title: 'Улучшить текущий функционал с низким CSI', description: 'AvPrice +$2, C1 +2%(отн.)', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 2, C1: Math.min(Math.round(m.C1 * 1.02), 100)}), successChance: 0.67 },
      { title: 'Доработать механики, которые усиливают связь с архетипом бренда', description: 'AvPrice +$10, C1 +15%(отн.)', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 10, C1: Math.min(Math.round(m.C1 * 1.15), 100)}), successChance: 0.67 },
  
      // Дизрапт инициативы
      { title: '🔥 Интегрировать криптоплатежи через почту', description: 'AvPrice +$30, Users +1500', apply: m => recalcMetrics({...m, AvPrice: m.AvPrice + 30, Users: m.Users + 1500}), successChance: 0.75 }
  
  ],
/*
  [
    { title: 'Внедрение ИИ-оптимизации', description: 'COGS -$4, AvPrice +$10', apply: m => recalcMetrics({ ...m, COGS: m.COGS - 4, AvPrice: m.AvPrice + 10 }), successChance: 0.7, partialEffect: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(1 + Math.random() * 2) }), risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(2 + Math.random() * 2) }), message: 'Технический сбой → COGS +$2-4.' } },
    { title: 'Премиум-подписка', description: 'AvPrice +$25, C1 -6%', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + 25, C1: m.C1 - 6 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(80 + Math.random() * 40) }), message: 'Низкий NPS → Users -80-120.' } },
    { title: 'Автоматизация поддержки', description: 'COGS -$3, C1 +5%', apply: m => recalcMetrics({ ...m, COGS: m.COGS - 3, C1: m.C1 + 5 }), successChance: 0.7, risk: { chance: 0.2, effect: m => m, message: 'NPS -7 (робот не справляется).' } },
    { title: 'Новая фича "Аналитика"', description: 'AvPrice +$20, C1 +8%', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + 20, C1: m.C1 + 8 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(4 + Math.random() * 2) }), message: 'Задержка релиза → COGS +$4-6.' } },
    { title: 'Партнерство с облачным провайдером', description: 'COGS -$5', apply: m => recalcMetrics({ ...m, COGS: m.COGS - 5 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, FixCosts: m.FixCosts + Math.floor(150 + Math.random() * 100) }), message: 'Риск зависимости → FixCosts +$150-250.' } },
    { title: 'Улучшение UI/UX', description: 'C1 +10%, AvPrice +$8', apply: m => recalcMetrics({ ...m, C1: m.C1 + 10, AvPrice: m.AvPrice + 8 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(3 + Math.random() * 3) }), message: 'Ошибки → C1 -3-6%.' } },
    { title: 'Геймификация сервиса', description: 'COGS +$3, C1 +7%', apply: m => recalcMetrics({ ...m, COGS: m.COGS + 3, C1: m.C1 + 7 }), successChance: 0.7 },
    { title: 'Снижение тарифов для новых', description: 'Users +400, AvPrice -$8', apply: m => recalcMetrics({ ...m, Users: m.Users + 400, AvPrice: m.AvPrice - 8 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, Margin: m.Margin - (0.06 + Math.random() * 0.04) }), message: 'Margin падает на 6-10%.' } },
    { title: 'Интеграция с умным домом', description: 'AvPrice +$30', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + 30 }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(3 + Math.random() * 2) }), message: 'Технические баги → COGS +$3-5.' } },
    { title: 'Оптимизация серверов', description: 'COGS -$6', apply: m => recalcMetrics({ ...m, COGS: m.COGS - 6 }), successChance: 0.7, risk: { chance: 0.2, effect: m => m, message: 'NPS -10.' } },
],

  
  [
    { title: 'Внедрение ИИ-оптимизации', description: 'COGS -$4, AvPrice +$10', apply: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(3 + Math.random() * 2), AvPrice: m.AvPrice + Math.floor(8 + Math.random() * 4) }), successChance: 0.7, partialEffect: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(1 + Math.random() * 2) }), risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(2 + Math.random() * 2) }), message: 'Технический сбой → COGS +$2-4.' } },
    { title: 'Премиум-подписка', description: 'AvPrice +$25, C1 -6%', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + Math.floor(20 + Math.random() * 10), C1: m.C1 - Math.floor(4 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, Users: m.Users - Math.floor(80 + Math.random() * 40) }), message: 'Низкий NPS → Users -80-120.' } },
    { title: 'Автоматизация поддержки', description: 'COGS -$3, C1 +5%', apply: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(2 + Math.random() * 2), C1: m.C1 + Math.floor(4 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0.2, effect: m => m, message: 'NPS -7 (робот не справляется).' } },
    { title: 'Новая фича "Аналитика"', description: 'AvPrice +$20, C1 +8%', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + Math.floor(15 + Math.random() * 10), C1: m.C1 + Math.floor(6 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(4 + Math.random() * 2) }), message: 'Задержка релиза → COGS +$4-6.' } },
    { title: 'Партнерство с облачным провайдером', description: 'COGS -$5', apply: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(4 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, FixCosts: m.FixCosts + Math.floor(150 + Math.random() * 100) }), message: 'Риск зависимости → FixCosts +$150-250.' } },
    { title: 'Улучшение UI/UX', description: 'C1 +10%, AvPrice +$8', apply: m => recalcMetrics({ ...m, C1: m.C1 + Math.floor(8 + Math.random() * 4), AvPrice: m.AvPrice + Math.floor(6 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, C1: m.C1 - Math.floor(3 + Math.random() * 3) }), message: 'Ошибки → C1 -3-6%.' } },
    { title: 'Геймификация сервиса', description: 'COGS +$3, C1 +7%', apply: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(2 + Math.random() * 2), C1: m.C1 + Math.floor(5 + Math.random() * 4) }), successChance: 0.7 },
    { title: 'Снижение тарифов для новых', description: 'Users +400, AvPrice -$8', apply: m => recalcMetrics({ ...m, Users: m.Users + Math.floor(300 + Math.random() * 200), AvPrice: m.AvPrice - Math.floor(6 + Math.random() * 4) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, Margin: m.Margin - (0.06 + Math.random() * 0.04) }), message: 'Margin падает на 6-10%.' } },
    { title: 'Интеграция с умным домом', description: 'AvPrice +$30', apply: m => recalcMetrics({ ...m, AvPrice: m.AvPrice + Math.floor(25 + Math.random() * 10) }), successChance: 0.7, risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, COGS: m.COGS + Math.floor(3 + Math.random() * 2) }), message: 'Технические баги → COGS +$3-5.' } },
    { title: 'Оптимизация серверов', description: 'COGS -$6', apply: m => recalcMetrics({ ...m, COGS: m.COGS - Math.floor(5 + Math.random() * 2) }), successChance: 0.7, risk: { chance: 0.2, effect: m => m, message: 'NPS -10.' } },
  ],

  */
  onboarding:  // добавить киллер фичу
  [
    // Высокорисковые с макс. эффектом (140%)
    { title: 'Запустить сегментные сценарии демо', description: 'C1 +35% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.35), 100)}), successChance: 0.62 },

    // Сильные инициативы (100-130%)
    { title: '🔥 Внедрить адаптивный квиз-онбординг', description: 'C1 +80% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.80), 100)}), successChance: 0.68, risk: { chance: 0.3, effect: m => recalcMetrics({...m, Users: m.Users - 400}), message: 'Слишком длинный квиз → Users -400' } },
    { title: 'Оптимизировать форму регистрации', description: 'C1 +25% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.25), 100)}), successChance: 0.55 },

    // Средний эффект (80-100%)
    { title: 'Запустить триггерные подсказки', description: 'C1 +30% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.30), 100)}), successChance: 0.65 },
    { title: 'Внедрить социальное доказательство', description: 'C1 +60% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.6), 100)}), successChance: 0.68 },

    // Базовые улучшения (50-80%)
    { title: 'Внедрить прогресс-бар онбординга', description: 'C1 +20% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.20), 100)}), successChance: 0.9 },
    { title: 'Добавить анимацию Aha-moment', description: 'C1 +40% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.40), 100)}), successChance: 0.55 },

    // Низкий риск/умеренный эффект (30-50%)
    { title: 'Внедрить "живые" теги функций', description: 'C1 +25% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.25), 100)}), successChance: 0.7 },
    { title: 'Запустить чат-бота для FAQ', description: 'C1 +15% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 1.15), 100)}), successChance: 0.72 },

    // Минимальный эффект (20%)
    { title: '🔥 Внедрить шаблоны для быстрого старта', description: 'C1 +120% (отн.)', apply: m => recalcMetrics({...m, C1: Math.min(Math.round(m.C1 * 2.20), 100)}), successChance: 0.8 }
],
  admin: [


   // { title: 'Аутсорсинг бухгалтерии', description: 'FixCosts -$800', apply: m => recalcMetrics({ ...m, FixCosts: m.FixCosts - Math.floor(600 + Math.random() * 400) }), successChance: 0.85, partialEffect: m => recalcMetrics({ ...m, FixCosts: m.FixCosts - Math.floor(200 + Math.random() * 100) }), risk: { chance: 0.2, effect: m => recalcMetrics({ ...m, FixCosts: m.FixCosts + Math.floor(800 + Math.random() * 400) }), message: 'Риск ошибок → Штраф $800-1200.' } },
    
   
    // Максимальный эффект (20000)
    { title: 'Перейти на аутсорсинг юр. услуг', description: 'FixCosts -$20000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 20000, 1000)}), successChance: 0.3, risk: { chance: 0.4, effect: m => recalcMetrics({...m, COGS: m.COGS + 5000}), message: 'Юридические ошибки → COGS +$5000' }},

    // Высокий эффект (распределение Гаусса)
    { title: 'Оптимизировать арендные платежи', description: 'FixCosts -$15000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 15000, 1000)}), successChance: 0.55, risk: { chance: 0.35, effect: m => recalcMetrics({...m, Users: m.Users - 500}), message: 'Ухудшение локации → Users -500' }},
    { title: 'Перевести отделы на удалённый формат', description: 'FixCosts -$11000', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 11000, 1000)}), successChance: 0.65, risk: { chance: 0.4, effect: m => recalcMetrics({...m, C1: Math.round(m.C1 * 0.90)}), message: 'Потеря контроля → C1 -10%' }},

    // Средний эффект
    { title: 'Автоматизировать документооборот', description: 'FixCosts -$7500', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 7500, 1000)}), successChance: 0.75 },
    { title: 'Провести переговоры о тарифах pay-as-you-go', description: 'FixCosts -$4800', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 4800, 1000)}), successChance: 0.6 },

    // Низкий эффект
    { title: 'Сократить корпоративные мероприятия', description: 'FixCosts -$3200', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 3200, 1000)}), successChance: 0.7 },
    { title: 'Пересмотреть контракты биллинга', description: 'FixCosts -$2100', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 2100, 1000)}), successChance: 0.68 },

    // Минимальный эффект (900)
    { title: 'Оптимизировать софт-лицензии', description: 'FixCosts -$900', apply: m => recalcMetrics({...m, FixCosts: Math.max(m.FixCosts - 900, 1000)}), successChance: 0.8 }
],
};

function recalcMetrics(m: Metrics): Metrics {
  const Margin = (m.AvPrice - m.COGS) / m.AvPrice;
  const AMPPU = m.AvPrice - m.COGS;
  const AMPU = AMPPU * (m.C1 / 100);
  const Profit = (AMPU - m.CPUser) * m.Users;  // Изменено: теперь учитываем CPUser в расчете прибыли
  const ProfitNet = Profit - m.FixCosts;
  return { ...m, Margin, AMPPU, AMPU, Profit, ProfitNet };
}

type OnboardingStep = {
  title: string;
  content: React.ReactNode;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "AI Mail Master: Революция рабочих коммуникаций",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p>Вы — CEO стартапа FutureInbox, создающего первый ИИ-почтовый сервис уровня SuperHuman для бизнеса.</p>
        <p>Ваш продукт — InboxMind — это не клиент для писем, а цифровой секретарь с ИИ, который:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✉️ <b>Автоматизирует рутину:</b> сортирует письма, генерирует ответы, выделяет срочные задачи</li>
          <li>🤖 <b>Предугадывает действия:</b> предлагает шаблоны, напоминает о дедлайнах, ищет конфликты</li>
          <li>💼 <b>Анализирует стиль:</b> адаптирует тон писем под корпоративную культуру</li>
          <li>🔒 <b>Защищает от ошибок:</b> блокирует письма с опечатками или конфиденциальными данными</li>
        </ul>
        <p style={{ fontStyle: 'italic', marginTop: 16 }}>Но InboxMind пока лишь черновик будущего. Ваш стартап балансирует на грани провала...</p>
      </div>
    )
  },
  {
    title: "Проблемы стартапа",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>Темные тучи над FutureInbox:</p>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>💸 Убытки на клиента:</p>
          <p>COGS = $15 (серверы ИИ + шифрование) при цене подписки $20</p>
          <p>AMPU = -$3 (платите за пользователей, а не зарабатываете!)</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>📉 Кризис доверия:</p>
          <p>Всего 500 компаний-клиентов против Outlook и Gmail</p>
          <p>Сложный интерфейс пугает HR-директоров</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>☠️ Угроза от гигантов:</p>
          <p>Microsoft тестирует Copilot для Outlook. Через 15 месяцев они задавят рынок...</p>
        </div>
      </div>
    )
  },
  {
    title: "Ваша миссия",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 16 }}>За 15 месяцев (ходов):</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 12 }}>🔥 <b>Исправить экономику:</b> Снизить COGS до $5, поднять цену до $30</li>
          <li style={{ marginBottom: 12 }}>🚀 <b>Захватить нишу:</b> 50 000 компаний - must-have для бизнеса</li>
          <li>💎 <b>Создать легенду:</b> Стать "ChatGPT для деловой переписки"</li>
        </ul>
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Это не игра — это война:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>🎲 Каждые 3 месяца — прорыв или крах: утечки, бунты инвесторов</li>
            <li>⚡ Баланс между инновациями и выживанием</li>
            <li>⏳ Гонка со временем против Microsoft</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Стартовые условия",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>Вы начинаете здесь:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <p>🏢 <b>Офис:</b></p>
            <p>Коворкинг с арендованными GPU-серверами</p>
          </div>
          <div>
            <p>👥 <b>Команда:</b></p>
            <p>6 разработчиков и нейролингвист</p>
          </div>
          <div>
            <p>💰 <b>Бюджет:</b></p>
            <p>$50,000 (последний раунд)</p>
          </div>
          <div>
            <p>📊 <b>Метрики:</b></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>Users = 500</li>
              <li>AvPrice = $20</li>
              <li>COGS = $15</li>
              <li>AMPU = -$3</li>
            </ul>
          </div>
        </div>
        <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#0369a1' }}>🌟 Сценарий успеха:</p>
          <p>«InboxMind купила Microsoft за $5 млрд. Ваш ИИ стал стандартом в Outlook!»</p>
        </div>
        <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, color: '#dc2626' }}>💀 Сценарий провала:</p>
          <p>«Ваш код поглотила нейросеть NeuroTech. Case study "Как убить стартап"»</p>
        </div>
      </div>
    )
  }
];
/*
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "AI Assistant Empire: Восхождение к прибыли",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p>Вы — CEO стартапа FutureInbox, создающего первый ИИ-почтовый сервис уровня SuperHuman для бизнеса.</p>
        <p>Ваш продукт — InboxMind — это не просто клиент для писем, а цифровой секретарь с искусственным интеллектом, который:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>📅 Планирует дела, бронирует рестораны и напоминает о днях рождения.</li>
          <li>🛒 Автоматизирует покупки, находя лучшие цены и экономя время клиентов.</li>
          <li>🎓 Обучает новым навыкам: от кулинарных рецептов до основ программирования.</li>
        </ul>
        <p style={{ fontStyle: 'italic', marginTop: 16 }}>Но VirtuMate пока лишь тень того, чем он может стать. Ваш стартап балансирует на грани провала, и только ваши решения определят, превратится ли он в многомиллионную империю или канет в безвестность...</p>
      </div>
    )
  },
  {
    title: "Проблемы стартапа",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>Темные тучи над FutureMind:</p>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>💸 Дырявый кошелек: Каждый клиент приносит убытки.</p>
          <p>Почему? Инфраструктура «съедает» деньги (COGS = $15 при цене подписки $20).</p>
          <p>Результат: AMPU = -$3 (вы платите за каждого пользователя, а не зарабатываете!).</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>🕳 Пустыня клиентов: Всего 500 подписчиков — капля в море рынка.</p>
          <p>Почему? Реклама бьет мимо цели, а сайт отпугивает сложным интерфейсом.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, color: '#ef4444' }}>⚔️ Конкуренты наступают:</p>
          <p>Корпорации вроде NeuroTech уже тестируют своих ИИ-ассистентов. Через 15 месяцев они захватят рынок… если вы не успеете.</p>
        </div>
      </div>
    )
  },
  {
    title: "Ваша миссия",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 16 }}>За 15 месяцев (ходов) превратите FutureMind в прибыльную компанию с ежемесячным доходом ≥ $50,000.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 12 }}>🔥 <b>Сожгите убытки:</b> Сделайте AMPU положительным, перехитрив алгоритмы конкурентов.</li>
          <li style={{ marginBottom: 12 }}>🚀 <b>Покорите аудиторию:</b> Привлеките десятки тысяч пользователей, сделав VirtuMate незаменимым.</li>
          <li>💎 <b>Создайте легенду:</b> Войдите в историю как CEO, который перевернул рынок ИИ!</li>
        </ul>
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Это не игра в калькулятор. Это битва за выживание:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>🎲 Каждый квартал — мини-эпизод драмы: тесты, прорывы, провалы.</li>
            <li>⚡ Риски на каждом шагу и моменты триумфа.</li>
            <li>⏳ Гонка со временем до захвата рынка гигантами.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Стартовые условия",
    content: (
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>Вы начинаете здесь:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <p>🏚️ <b>Офис:</b></p>
            <p>Гараж с серверами, которые греются как тостеры.</p>
          </div>
          <div>
            <p>👥 <b>Команда:</b></p>
            <p>5 энтузиастов-разработчиков и маркетолог-студент.</p>
          </div>
          <div>
            <p>💰 <b>Бюджет:</b></p>
            <p>$30,000 (последние деньги инвесторов).</p>
          </div>
          <div>
            <p>📊 <b>Метрики:</b></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>Users = 500</li>
              <li>AvPrice = $40</li>
              <li>COGS = $30</li>
              <li>AMPU = $2</li>
            </ul>
          </div>
        </div>
        <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#0369a1' }}>🌟 Сценарий успеха:</p>
          <p>«VirtuMate стал новым iPhone в мире ИИ. Вы продали компанию за $1 млрд и запускаете ракету к Марсу!»</p>
        </div>
        <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
          <p style={{ fontWeight: 600, color: '#dc2626' }}>💀 Сценарий провала:</p>
          <p>«FutureMind куплен NeuroTech за $1. Ваше имя стало синонимом провала в Кремниевой долине…»</p>
        </div>
      </div>
    )
  }

  ];
*/
function VictoryModal({ onRestart }: { onRestart: () => void }) {
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
          Победа!
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
          Вы успешно превратили InboxMind в прибыльную компанию!
        </p>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            padding: '12px', 
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)', 
            borderRadius: '8px',
            color: 'white'
          }}>
            🚀 Достигнута цель: Profit Net ≥ $50,000
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)', 
            borderRadius: '8px',
            color: 'white'
          }}>
            💎 Компания готова к масштабированию
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'linear-gradient(135deg, #000000 0%, #333333 100%)', 
            borderRadius: '8px',
            color: 'white'
          }}>
            🏆 Вы стали легендой Кремниевой долины
          </div>
        </div>
        <button
          onClick={onRestart}
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
          Начать новую игру
        </button>
      </div>
    </div>
  );
}

function DefeatModal({ onRestart }: { onRestart: () => void }) {
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
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>Не в этот раз...</h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', color: '#6b7280' }}>
          Но вы получили ценный опыт! Теперь вы знаете больше о:
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
            📈 Управлении метриками продукта
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            💡 Принятии стратегических решений
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            🎯 Балансировке рисков и возможностей
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
          Попробовать еще раз
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
    title: 'Первая прибыль',
    description: 'Достигните положительного Profit Net',
    icon: '💰',
    condition: (m) => m.ProfitNet > 0
  },
  {
    id: 'users_1000',
    title: 'Растущее комьюнити',
    description: 'Достигните 1000 пользователей',
    icon: '👥',
    condition: (m) => m.Users >= 1000
  },
  {
    id: 'users_5000',
    title: 'Популярный продукт',
    description: 'Достигните 5000 пользователей',
    icon: '🌟',
    condition: (m) => m.Users >= 5000
  },
  {
    id: 'margin_50',
    title: 'Эффективный бизнес',
    description: 'Достигните маржинальности 50%',
    icon: '📈',
    condition: (m) => m.Margin >= 0.5
  },
  {
    id: 'profit_10k',
    title: 'Путь к успеху',
    description: 'Достигните Profit Net $10,000',
    icon: '💎',
    condition: (m) => m.ProfitNet >= 10000
  },
  {
    id: 'profit_25k',
    title: 'Уверенный рост',
    description: 'Достигните Profit Net $25,000',
    icon: '🚀',
    condition: (m) => m.ProfitNet >= 25000
  },
  {
    id: 'c1_40',
    title: 'Мастер конверсии',
    description: 'Достигните конверсии 40%',
    icon: '🎯',
    condition: (m) => m.C1 >= 40
  },
  {
    id: 'low_costs',
    title: 'Оптимизатор',
    description: 'Снизьте COGS на 30% от начального значения',
    icon: '✂️',
    condition: (m) => m.COGS <= 10.5 // 30 * 0.7
  },
  {
    id: 'quick_growth',
    title: 'Быстрый старт',
    description: 'Достигните 2000 пользователей за первые 5 ходов',
    icon: '⚡',
    condition: (m, _, turn) => m.Users >= 2000 && turn <= 5
  },
  {
    id: 'perfect_balance',
    title: 'Идеальный баланс',
    description: 'Достигните положительных значений во всех ключевых метриках',
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
          Ваше новое достижение!
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
          Продолжить
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
          <h2 style={{ margin: 0, fontSize: '24px' }}>Достижения</h2>
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

function StepNotification({ message, profitChangeMessage, onClose }: { message: string; profitChangeMessage: string; onClose: () => void }) {
  const [show, setShow] = useState(false);
  const isPositive = profitChangeMessage.includes('вырос');

  useEffect(() => {
    setShow(true);
  }, []);

  // Определяем поясняющий текст в зависимости от типа сообщения
  const getExplanationText = () => {
    if (message.includes('SEO-кампания')) {
      return 'SEO-оптимизация помогает привлекать органический трафик, что снижает стоимость привлечения пользователей.';
    } else if (message.includes('таргетированная реклама')) {
      return 'Таргетированная реклама позволяет более точно попадать в целевую аудиторию, повышая конверсию.';
    } else if (message.includes('партнерство с блогером')) {
      return 'Партнерство с блогерами может быстро увеличить базу пользователей, но важно выбрать правильного партнера.';
    } else if (message.includes('A/B тесты')) {
      return 'A/B тестирование помогает оптимизировать конверсию, выявляя наиболее эффективные решения.';
    } else if (message.includes('реферальная программа')) {
      return 'Реферальные программы стимулируют существующих пользователей привлекать новых клиентов.';
    } else if (message.includes('контекстная реклама')) {
      return 'Контекстная реклама эффективна для привлечения заинтересованных пользователей.';
    } else if (message.includes('ИИ-оптимизация')) {
      return 'Внедрение ИИ помогает оптимизировать процессы и снизить операционные расходы.';
    } else if (message.includes('премиум-подписка')) {
      return 'Премиум-подписка увеличивает средний чек, но может снизить конверсию.';
    } else if (message.includes('автоматизация поддержки')) {
      return 'Автоматизация поддержки снижает расходы и может улучшить качество обслуживания.';
    } else if (message.includes('новая фича')) {
      return 'Новые функции увеличивают ценность продукта и могут привлечь новых пользователей.';
    } else if (message.includes('UI/UX')) {
      return 'Улучшение интерфейса повышает удовлетворенность пользователей и конверсию.';
    } else if (message.includes('персонализация')) {
      return 'Персонализация улучшает пользовательский опыт и повышает конверсию.';
    } else if (message.includes('чек-листы')) {
      return 'Чек-листы помогают новым пользователям быстрее освоить продукт.';
    } else if (message.includes('пробный период')) {
      return 'Бесплатный пробный период помогает пользователям оценить ценность продукта.';
    } else if (message.includes('аутсорсинг')) {
      return 'Аутсорсинг помогает оптимизировать постоянные расходы.';
    } else if (message.includes('переезд')) {
      return 'Оптимизация офисных расходов может значительно снизить фиксированные затраты.';
    } else {
      return 'Каждое решение влияет на ключевые метрики бизнеса. Анализируйте результаты и корректируйте стратегию.';
    }
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
        <div style={{ 
          padding: '16px',
          background: '#f3f4f6',
          borderRadius: '12px',
          marginBottom: '24px',
          color: '#4b5563',
          fontSize: '14px',
          lineHeight: 1.5
        }}>
          {getExplanationText()}
        </div>
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
          Продолжить
        </button>
      </div>
    </div>
  );
}

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
    const rand = Math.random();
    if (rand < chance) {
      // Полный успех
      // ----- РАЗОБРАТЬСЯ С РИСКАМИ -----
      m = ini.apply(m);
     // if (ini.risk && Math.random() < ini.risk.chance) {
     //   m = ini.risk.effect(m);
     //   setMessage(ini.risk.message);
     // } else {
        setMessage(ini.description + ` (Успех, инициатива реализована)`); // оо
      //  }
      // ----- РАЗОБРАТЬСЯ С РИСКАМИ -----

    } else if (rand < chance + (1 - chance)) {
      // Проверка на полный ноль (ничего не происходит)
      if (Math.random() < (1 - chance)) { // надо ли запускать второй рандом?
        setMessage('Инициатива не сработала.');
      } else {
        // Частичный эффект: эффект умножается на вероятность
        if (ini.partialEffect) {
          m = ini.partialEffect(m);
          setMessage('Инициатива частично реализована.');
        } else {
          // Если partialEffect не задан, применяем apply с масштабированием эффекта
          const mFull = ini.apply(metrics);
          const mPartial: Metrics = { ...metrics };
          (Object.keys(mFull) as (keyof Metrics)[]).forEach(key => {
            if (typeof mFull[key] === 'number' && typeof metrics[key] === 'number') {
              mPartial[key] = (metrics[key] as number) + ((mFull[key] as number) - (metrics[key] as number)) * chance;
            }
          });
          m = recalcMetrics(mPartial);
          setMessage('Инициатива частично реализована.');
        }
      }
    }

    // Добавляем сообщение об изменении Profit Net
    const profitNetChange = m.ProfitNet - metrics.ProfitNet;
    if (Math.abs(profitNetChange) > 0.01) { // Проверяем, что изменение существенное
      const changeText = formatNumber(Math.abs(profitNetChange));
      if (profitNetChange > 0) {
        setProfitChangeMessage(`Profit Net вырос на $${changeText}`);
      } else {
        setProfitChangeMessage(`Profit Net снизился на $${changeText}`);
      }
    } else {
      setProfitChangeMessage('Profit Net не изменился');
    }

    // --- Баланс ---
    const newBalance = balance + m.ProfitNet;
    setBalance(newBalance);
    // --- Users < 100 ---
    let newUsersBelow100 = usersBelow100;
    if (m.Users < 100) {
      newUsersBelow100 += 1;
      if (newUsersBelow100 === 1) {
        setMessage(prev => (prev ? prev + ' ' : '') + 'Клиентская база сокращается!');
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
    
    // --- Победа/Поражение ---
    if (m.ProfitNet >= 50000 && turn + 1 === 15) {
      setGameOver(true);
      setIsVictory(true);
      setMessage('Победа! Profit Net ≥ $50,000 к 15-му ходу');
    } else if (newBalance < 0) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Поражение! Баланс компании ушёл в минус.');
    } else if (newUsersBelow100 >= 2) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Поражение! Клиентская база < 100 два хода подряд.');
    } else if (turn + 1 > 15) {
      setGameOver(true);
      setIsVictory(false);
      setMessage('Игра окончена. Не достигнуты условия победы.');
    }

    // Показываем уведомление о шаге только если игра не окончена
    if (!gameOver) {
      setShowStepNotification(true);
    }
  }

  function handleStartGame() {
    setShowOnboarding(false);
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
            fontSize: 56, 
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
              Назад
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
                Далее
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
                Начать игру
              </button>
            )}
          </div>
        </div>
      </section>
    );
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
             InboxMind - AI Mail Master
            </h2>
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
                marginRight: '24px'
              }}
            >
              🏆 Достижения ({achievements.filter(a => a.achieved).length}/{achievements.length})
            </button>
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
              <span style={{ fontWeight: 500 }}>Ход:</span> 
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
                <div style={{ fontSize: 14, color: '#86868b', marginBottom: 4 }}>Profit Net / Цель $50 000</div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  color: metrics.ProfitNet < 0 ? '#ff3b30' : '#1d1d1f'
                }}>
                  ${Math.round(metrics.ProfitNet).toLocaleString('ru-RU')}
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
                <div style={{ fontSize: 14, color: '#86868b', marginBottom: 4 }}>Баланс</div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  color: balance < 0 ? '#ff3b30' : '#1d1d1f'
                }}>
                  ${formatNumber(Math.round(balance))}
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
                    label={{ value: 'Ход', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    tickFormatter={v => `$${v.toLocaleString('ru-RU')}`} 
                    domain={['auto', 'auto']} 
                    stroke="#86868b"
                    label={{ value: 'Profit Net', angle: -90, position: 'insideLeft', offset: 10 }} 
                  />
                  <Tooltip 
                    formatter={v => `$${v.toLocaleString('ru-RU')}`} 
                    labelFormatter={l => `Ход: ${l}`}
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
                { label: 'Маржинальность', value: `${(Math.round(metrics.Margin * 100)).toFixed(1)}%`, color: metrics.Margin < 0 ? '#ff3b30' : '#1d1d1f' },
                { label: 'AMPPU', value: `$${formatNumber(Math.round(metrics.AMPPU))}`, color: metrics.AMPPU < 0 ? '#ff3b30' : '#1d1d1f' },
                { label: 'AMPU - CPUser', value: `$${(Math.round(metrics.AMPU) - Math.round(metrics.CPUser)).toFixed(2)}`, color: (Math.round(metrics.AMPU) - Math.round(metrics.CPUser)) < 0 ? '#ff3b30' : '#1d1d1f' }
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
                { label: 'Fix Costs', value: `$${formatNumber(Math.round(metrics.FixCosts))}`, prev: prevMetrics?.FixCosts },
                { label: 'Users', value: `${formatNumber(Math.round(metrics.Users))}`, prev: prevMetrics?.Users },
                { label: 'AvPrice', value: `$${formatNumber(Math.round(metrics.AvPrice))}`, prev: prevMetrics?.AvPrice },
                { label: 'COGS', value: `$${formatNumber(Math.round(metrics.COGS))}`, prev: prevMetrics?.COGS },
                { label: 'C1', value: `${metrics.C1.toFixed(1)}%`, prev: prevMetrics?.C1 },
                { label: 'CPUser', value: `$${formatNumber(Math.round(metrics.CPUser))}`, prev: prevMetrics?.CPUser }
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
                    {turn} ход
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 18,
                    color: '#1d1d1f'
                  }}>
                    Выберите направление
                  </div>
                </div>
                <div style={{ 
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
                        transition: 'all 0.2s ease'
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
                        lineHeight: 1.4
                      }}>{dep.desc}</span>
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
                    {turn} ход
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 18,
                    color: '#1d1d1f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    Выберите инициативу / 
                    <span style={{ fontSize: 20 }}>{DEPARTMENTS.find(d => d.key === department)?.icon}</span>
                    <span style={{ fontSize: 15 }}>{DEPARTMENTS.find(d => d.key === department)?.label}</span>
                  </div>
                </div>
                <div style={{ 
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
                        Вероятность успеха: {initiativeChances[idx] ? Math.round(initiativeChances[idx] * 100) : Math.round(ini.successChance * 100)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      {gameOver && isVictory && <VictoryModal onRestart={handleRestart} />}
      {gameOver && !isVictory && <DefeatModal onRestart={handleRestart} />}
      {showStepNotification && message && profitChangeMessage && !gameOver && (
        <StepNotification 
          message={message}
          profitChangeMessage={profitChangeMessage}
          onClose={() => {
            setShowStepNotification(false);
            setMessage(null);
            setProfitChangeMessage(null);
          }}
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
