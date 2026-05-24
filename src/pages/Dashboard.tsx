import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn, CURRENCIES } from '../lib/utils';
import { format, isToday, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, addMonths } from 'date-fns';
import { 
  Wallet, 
  FolderKanban, 
  CheckSquare, 
  BellRing,
  ArrowUpRight,
  Plus,
  EyeOff,
  Sparkles,
  Tag,
  Banknote,
  Megaphone,
  ArrowDownRight,
  Search,
  FileText,
  CreditCard,
  ChevronRight,
  Activity,
  Calendar,
  Award,
  Star,
  Clock,
  UserCheck,
  Zap,
  Smile,
  BookOpen,
  Clock3,
  LogIn,
  LogOut,
  Send,
  ShieldCheck,
  TrendingUp,
  MoreVertical,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

import { TransactionModal } from '../components/TransactionModal';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { HiddenValue } from '../components/HiddenValue';
import { ChartTooltip } from '../components/ChartTooltip';
import { PageShell } from '../components/layout/PageShell';

type ChartRange = '7d' | '14d' | '30d';
type DashboardTab = 'finance' | 'hr';

export function Dashboard() {
  const store = useStore();
  const user = store.user;
  const isPrivacyMode = store.isPrivacyMode;
  const isDarkMode = store.isDarkMode;
  const today = new Date();

  // Selected Dashboard Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('finance');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('7d');
  
  const isHidden = isPrivacyMode && !store.isPeeking;
  const currencyCode = store.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';

  // Personal vs Business Finance Calcs
  const totalIncome = store.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = store.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;
  
  const personalIncome = store.transactions.filter(t => t.type === 'income' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalExpenses = store.transactions.filter(t => t.type === 'expense' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalBalance = personalIncome - personalExpenses;

  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  const sumInRange = (type: 'income' | 'expense', start: Date, end: Date) =>
    store.transactions
      .filter(t => t.type === type && isWithinInterval(new Date(t.date), { start, end }))
      .reduce((acc, t) => acc + t.amount, 0);

  const incomeThisMonth = sumInRange('income', thisMonthStart, thisMonthEnd);
  const incomeLastMonth = sumInRange('income', lastMonthStart, lastMonthEnd);
  const expenseThisMonth = sumInRange('expense', thisMonthStart, thisMonthEnd);
  const expenseLastMonth = sumInRange('expense', lastMonthStart, lastMonthEnd);

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const rangeDays = chartRange === '7d' ? 6 : chartRange === '14d' ? 13 : 29;

  const chartData = useMemo(() => {
    const data = [];
    for (let i = rangeDays; i >= 0; i--) {
      const d = subDays(today, i);
      const dayTransactions = store.transactions.filter(t => 
        format(new Date(t.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
      );
      const expenseAmount = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const incomeAmount = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const prevD = subDays(d, rangeDays + 1);
      const prevTransactions = store.transactions.filter(t => 
        format(new Date(t.date), 'yyyy-MM-dd') === format(prevD, 'yyyy-MM-dd')
      );
      const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      data.push({
        name: format(d, chartRange === '30d' ? 'MMM d' : 'EEE'),
        income: incomeAmount,
        expense: expenseAmount,
        incomePrev: prevIncome,
        expensePrev: prevExpense,
      });
    }
    return data;
  }, [store.transactions, chartRange, rangeDays, today]);

  return (
    <PageShell>
      {/* Top Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <h1 className="page-title">Hey {user?.name.split(' ')[0]} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="page-subtitle">{format(today, 'EEEE, MMMM do, yyyy')}</p>
            {isPrivacyMode && (
              <span className="status-badge status-badge-neutral">
                <EyeOff className="h-3.5 w-3.5" />
                Private
              </span>
            )}
          </div>
        </div>
        
        {/* Toggle View Options */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented-control p-1 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border-subtle)] flex">
            <button
              onClick={() => setActiveTab('finance')}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'finance' 
                  ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm" 
                  : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              Finance & Banking
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'hr' 
                  ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm" 
                  : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              HR & Operations
            </button>
          </div>
          
          <div className="flex gap-2">
            <PrivacyToggle />
            <button 
              type="button" 
              onClick={() => setIsQuickAddOpen(true)} 
              className="btn-primary flex items-center gap-1.5 px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Dashboard Rendering */}
      {activeTab === 'finance' ? (
        <FinanceDashboard 
          store={store} 
          currentBalance={currentBalance} 
          personalBalance={personalBalance} 
          incomeThisMonth={incomeThisMonth}
          incomeLastMonth={incomeLastMonth}
          expenseThisMonth={expenseThisMonth}
          expenseLastMonth={expenseLastMonth}
          pctChange={pctChange}
          chartData={chartData}
          chartRange={chartRange}
          setChartRange={setChartRange}
          isHidden={isHidden}
          currencySymbol={currencySymbol}
        />
      ) : (
        <HrDashboard 
          store={store} 
          isHidden={isHidden} 
          today={today}
        />
      )}

      <TransactionModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} defaultType="expense" />
    </PageShell>
  );
}

/* ==========================================================================
   FINANCE & BANKING DASHBOARD VIEW
   ========================================================================== */
function FinanceDashboard({ 
  store, 
  currentBalance, 
  personalBalance,
  incomeThisMonth,
  incomeLastMonth,
  expenseThisMonth,
  expenseLastMonth,
  pctChange,
  chartData,
  chartRange,
  setChartRange,
  isHidden,
  currencySymbol
}: any) {
  return (
    <div className="space-y-6 mt-4">
      {/* Top row: Balance card, My Cards widget, and Quick Transfer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance details */}
        <div className="space-y-6">
          <DualBalanceCard personalBalance={personalBalance} currentBalance={currentBalance} isHidden={isHidden} />
          <CreditScoreWidget />
        </div>
        
        {/* Premium Figma credit card layout */}
        <MyCardsWidget store={store} isHidden={isHidden} />
        
        {/* Quick transfer component */}
        <QuickTransferWidget store={store} isHidden={isHidden} />
      </div>

      {/* Middle row: Overview charts and radial spending summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial overview graphs */}
        <div className="lg:col-span-2 section-panel section-panel-flat lg:!p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="section-label">Financial Overview</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="segmented-control">
                {(['7d', '14d', '30d'] as ChartRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className={cn('segmented-item', chartRange === r && 'segmented-item-active')}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Link to="/finance/personal" className="section-link hidden sm:inline text-xs font-semibold">View all →</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartMetricCard
              title="Total Income"
              icon={<Tag className="h-4 w-4 text-[var(--color-positive)]" />}
              current={incomeThisMonth}
              previous={incomeLastMonth}
              pct={pctChange(incomeThisMonth, incomeLastMonth)}
              dataKey="income"
              prevKey="incomePrev"
              chartData={chartData}
              isHidden={isHidden}
            />
            <ChartMetricCard
              title="Total Expenses"
              icon={<Banknote className="h-4 w-4 text-[var(--color-negative)]" />}
              current={expenseThisMonth}
              previous={expenseLastMonth}
              pct={pctChange(expenseThisMonth, expenseLastMonth)}
              dataKey="expense"
              prevKey="expensePrev"
              chartData={chartData}
              isHidden={isHidden}
              invertTrend
            />
          </div>
        </div>

        {/* Spending Summary radial breakdown */}
        <SpendingSummaryWidget store={store} isHidden={isHidden} />
      </div>

      {/* Bottom row: Recent Transactions list, exchange rates table, and goals list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions component */}
        <div className="lg:col-span-2 section-panel section-panel-flat flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4 p-1">
            <h2 className="section-label">Recent Transactions</h2>
            <Link to="/finance/personal" className="section-link text-xs font-semibold">View History →</Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <RecentTransactionsList store={store} isHidden={isHidden} currencySymbol={currencySymbol} />
          </div>
        </div>

        {/* Exchange rates table + Goals list stacked */}
        <div className="space-y-6">
          <CurrencyConverterWidget currencySymbol={currencySymbol} />
          <DashboardGoalsWidget store={store} isHidden={isHidden} />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   HR & OPERATIONS DASHBOARD VIEW
   ========================================================================== */
function HrDashboard({ store, isHidden, today }: any) {
  const [activeTabSub, setActiveTabSub] = useState<'schedule' | 'spotlight'>('schedule');

  return (
    <div className="space-y-6 mt-4 animate-in fade-in duration-200">
      {/* Top Row: Time Tracker check-in timer, Time Off Balance, and Team status tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TimeTrackerWidget store={store} />
        <TimeOffBalanceWidget />
        <TeamStatusTrackerWidget store={store} />
      </div>

      {/* Middle row: Checklist widgets and Memo notepad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Focus checklist */}
        <div className="lg:col-span-2 section-panel section-panel-flat">
          <div className="flex justify-between items-center mb-3">
            <h2 className="section-label flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[var(--color-accent)]" />
              Today&apos;s Focus
            </h2>
            <Link to="/tasks" className="section-link text-xs font-semibold">View all Tasks →</Link>
          </div>
          <div className="design-card p-4 min-h-[220px]">
            <DashboardTasksList store={store} />
          </div>
        </div>

        {/* Workspace Memo sticky pad */}
        <WorkspaceNotesWidget store={store} />
      </div>

      {/* Bottom row: Operations Calendar & Spotlight cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar / Meetings lists */}
        <div className="lg:col-span-2 section-panel section-panel-flat h-[340px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-label flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--color-accent)]" />
              Operations Calendar & Events
            </h2>
            <div className="flex gap-1.5 p-0.5 bg-[var(--color-surface-muted)] rounded-lg border border-[var(--color-border-subtle)] text-xs font-semibold">
              <button onClick={() => setActiveTabSub('schedule')} className={cn("px-2.5 py-1 rounded-md", activeTabSub === 'schedule' ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs" : "text-[var(--color-ink-muted)]")}>Schedule</button>
              <button onClick={() => setActiveTabSub('spotlight')} className={cn("px-2.5 py-1 rounded-md", activeTabSub === 'spotlight' ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs" : "text-[var(--color-ink-muted)]")}>Accolades</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTabSub === 'schedule' ? (
              <OperationsCalendarWidget store={store} today={today} />
            ) : (
              <EmployeeAccoladesWidget />
            )}
          </div>
        </div>

        {/* Active Projects Tracker */}
        <div className="section-panel section-panel-flat flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-label flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[var(--color-accent)]" />
              Active Projects
            </h2>
            <Link to="/projects" className="section-link text-xs font-semibold">View all →</Link>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            <DashboardProjectsList store={store} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENTS: FINANCE WIDGETS
   ========================================================================== */

// Net Worth and Liquid Cash balances
function DualBalanceCard({ personalBalance, currentBalance, isHidden }: any) {
  const [displayMode, setDisplayMode] = useState<'net-worth' | 'liquid-cash'>('net-worth');

  return (
    <div className="design-card p-5 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[145px] shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          {displayMode === 'net-worth' ? 'Net Worth' : 'Liquid Cash'}
        </span>
        <button 
          onClick={() => setDisplayMode(displayMode === 'net-worth' ? 'liquid-cash' : 'net-worth')}
          className="text-[10px] font-semibold text-[var(--color-accent)] hover:underline bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border-subtle)]"
        >
          Switch
        </button>
      </div>
      
      <div className="py-2.5">
        <p className="text-3xl font-extrabold text-[var(--color-ink)] tracking-tight tabular-nums">
          <HiddenValue isHidden={isHidden}>
            {formatCurrency(displayMode === 'net-worth' ? currentBalance : personalBalance)}
          </HiddenValue>
        </p>
      </div>

      <div className="pt-2 border-t border-[var(--color-border-soft)] flex justify-between items-center text-xs text-[var(--color-ink-secondary)]">
        <span>{displayMode === 'net-worth' ? 'Liquid Cash' : 'Total Net Worth'}</span>
        <span className="font-semibold text-[var(--color-ink)] tabular-nums">
          <HiddenValue isHidden={isHidden} bulletCount={4}>
            {formatCurrency(displayMode === 'net-worth' ? personalBalance : currentBalance)}
          </HiddenValue>
        </span>
      </div>
    </div>
  );
}

// Credit Score Gauge
function CreditScoreWidget() {
  const score = 785;
  const maxScore = 850;
  const pct = (score / maxScore) * 100;

  return (
    <div className="design-card p-4.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex items-center gap-4.5 shadow-xs">
      <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
        {/* Semi-circular gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="stroke-[var(--color-border-soft)]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeWidth="3.5"
            strokeDasharray="50, 100"
          />
          <path
            className="stroke-[var(--color-positive)] transition-all duration-1000"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeWidth="3.5"
            strokeDasharray={`${pct / 2}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-base font-bold text-[var(--color-ink)] tabular-nums">{score}</span>
          <span className="text-[9px] font-semibold text-[var(--color-positive-text)] bg-[var(--color-positive-soft)] px-1 rounded uppercase">Excel</span>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-[var(--color-ink)]">Credit Score Profile</h4>
        <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Your credit rating is in excellent health. Check updates monthly.</p>
      </div>
    </div>
  );
}

// Visual Credit Cards widget (physical vs virtual switcher)
function MyCardsWidget({ store, isHidden }: any) {
  const [cardType, setCardType] = useState<'physical' | 'virtual'>('physical');
  const [showSensitive, setShowSensitive] = useState(false);

  // Card configs based on Figma specifications
  const cardData = {
    physical: {
      number: '•••• •••• •••• 3456',
      name: store.user?.name || 'YAKSH VADODARIYA',
      expiry: '08/29',
      cvv: '584',
      limit: 25000,
      spent: store.transactions.filter((t: any) => t.category === 'business' && t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0),
      gradient: 'from-[#405cf2] via-[#546fed] to-[#615dec]',
      brand: 'Mastercard',
    },
    virtual: {
      number: '•••• •••• •••• 1234',
      name: store.user?.name || 'YAKSH VADODARIYA',
      expiry: '06/28',
      cvv: '293',
      limit: 12000,
      spent: store.transactions.filter((t: any) => t.category === 'personal' && t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0),
      gradient: 'from-[#1e1b4b] via-[#312e81] to-[#405cf2]',
      brand: 'Visa',
    }
  };

  const currentCard = cardData[cardType];
  const spentPct = Math.min((currentCard.spent / currentCard.limit) * 100, 100);

  return (
    <div className="design-card p-5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[285px] shadow-sm">
      {/* Header and Toggle */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          My Cards
        </span>
        <div className="segmented-control p-0.5 bg-[var(--color-surface-muted)] rounded-lg flex border border-[var(--color-border-subtle)] text-[10px]">
          <button 
            onClick={() => setCardType('physical')} 
            className={cn("px-2 py-0.5 font-bold rounded", cardType === 'physical' ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs" : "text-[var(--color-ink-muted)]")}
          >
            Physical
          </button>
          <button 
            onClick={() => setCardType('virtual')} 
            className={cn("px-2 py-0.5 font-bold rounded", cardType === 'virtual' ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs" : "text-[var(--color-ink-muted)]")}
          >
            Virtual
          </button>
        </div>
      </div>

      {/* Credit Card Graphic */}
      <div 
        onClick={() => setShowSensitive(!showSensitive)}
        className={cn(
          "w-full h-34 rounded-xl p-4.5 text-white flex flex-col justify-between cursor-pointer relative overflow-hidden select-none bg-gradient-to-tr shadow-md transition-all duration-300 transform hover:scale-[1.01]",
          currentCard.gradient
        )}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-85">Card Holder</p>
            <p className="text-xs font-bold tracking-wide mt-0.5 truncate max-w-[150px]">{currentCard.name}</p>
          </div>
          <span className="text-xs font-extrabold italic opacity-95">{currentCard.brand}</span>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-widest font-mono">
            {showSensitive && !isHidden ? currentCard.number.replace(/•/g, '4') : currentCard.number}
          </p>
          <div className="flex justify-between items-end mt-2">
            <div className="flex gap-4">
              <div>
                <p className="text-[8px] uppercase tracking-wider opacity-80">Expires</p>
                <p className="text-[10px] font-bold mt-0.5">{currentCard.expiry}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-wider opacity-80">CVV</p>
                <p className="text-[10px] font-bold mt-0.5">{showSensitive && !isHidden ? currentCard.cvv : '•••'}</p>
              </div>
            </div>
            <span className="text-[8px] opacity-75 bg-white/20 px-1.5 py-0.5 rounded uppercase font-semibold">Click to reveal</span>
          </div>
        </div>
      </div>

      {/* Card Spending Limit tracking */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-[var(--color-ink-secondary)]">Spending Limit</span>
          <span className="font-bold text-[var(--color-ink)] tabular-nums">
            <HiddenValue isHidden={isHidden}>{formatCurrency(currentCard.spent)}</HiddenValue>
            <span className="text-[var(--color-ink-muted)] font-normal"> / {formatCurrency(currentCard.limit)}</span>
          </span>
        </div>
        <div className="progress-track bg-[var(--color-border-soft)] h-1.5">
          <div 
            className="progress-fill h-full bg-[var(--color-accent)] rounded-full transition-all duration-500" 
            style={{ width: `${spentPct}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

// Quick transfer client avatars slider and submit
function QuickTransferWidget({ store, isHidden }: any) {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  // Take first 5 clients as quick recipients
  const quickContacts = useMemo(() => {
    return store.clients.slice(0, 5);
  }, [store.clients]);

  const selectedContact = quickContacts.find((c: any) => c.id === recipientId);

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !amount || parseFloat(amount) <= 0) return;
    
    setSending(true);
    try {
      const contact = selectedContact;
      const numAmount = parseFloat(amount);

      // Create a transaction of type expense
      const newTx = {
        id: crypto.randomUUID(),
        amount: numAmount,
        type: 'expense',
        category: 'personal',
        categoryDetail: 'Transfer',
        description: `Quick transfer to ${contact?.name || 'Contact'}`,
        date: new Date().toISOString(),
        paymentMethod: 'Bank Transfer',
        createdAt: new Date().toISOString()
      };
      
      await store.addTransaction(newTx);
      setAmount('');
      alert(`Successfully sent ${formatCurrency(numAmount)} to ${contact?.name || 'Contact'}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="design-card p-5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[285px] shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Quick Transfer
        </span>
      </div>

      {/* Recipient avatar selection */}
      <div className="py-1">
        <p className="text-[11px] text-[var(--color-ink-muted)] font-semibold mb-2">SELECT CONTACT</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {quickContacts.map((contact: any) => {
            const initials = contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isSelected = contact.id === recipientId;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => setRecipientId(contact.id)}
                className="flex flex-col items-center flex-shrink-0 gap-1.5 focus:outline-none"
              >
                <div className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold transition-all relative border",
                  isSelected 
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] scale-105" 
                    : "bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
                )}>
                  {initials}
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[var(--color-positive)] border border-white h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-[var(--color-ink-secondary)] max-w-[55px] truncate text-center">
                  {contact.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
          {quickContacts.length === 0 && (
            <p className="text-xs text-[var(--color-ink-muted)] text-center py-4 w-full">No clients available. Add clients to send quick transfers.</p>
          )}
        </div>
      </div>

      {/* Quick transfer form */}
      <form onSubmit={handleSendPayment} className="space-y-3 mt-2">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="0.00"
            disabled={!recipientId || sending}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field flex-1 text-sm text-center tabular-nums bg-[var(--color-surface-muted)]"
          />
          <button
            type="submit"
            disabled={!recipientId || !amount || sending}
            className="btn-primary flex items-center justify-center px-4 font-bold shrink-0 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {selectedContact && (
          <p className="text-[10px] text-center text-[var(--color-positive-text)] font-semibold uppercase">
            Transferring to {selectedContact.name} ({selectedContact.company || 'Client'})
          </p>
        )}
      </form>
    </div>
  );
}

// Spending Summary widget
function SpendingSummaryWidget({ store, isHidden }: any) {
  // Aggregate data from transactions
  const summaryData = useMemo(() => {
    const expenseTransactions = store.transactions.filter((t: any) => t.type === 'expense');
    const categories: Record<string, number> = {
      Shopping: 0,
      Food: 0,
      Utilities: 0,
      Other: 0
    };

    expenseTransactions.forEach((t: any) => {
      const cat = t.categoryDetail || '';
      if (cat.toLowerCase().includes('shop')) {
        categories.Shopping += t.amount;
      } else if (cat.toLowerCase().includes('food') || cat.toLowerCase().includes('eat') || cat.toLowerCase().includes('rest')) {
        categories.Food += t.amount;
      } else if (cat.toLowerCase().includes('util') || cat.toLowerCase().includes('bill') || cat.toLowerCase().includes('rent')) {
        categories.Utilities += t.amount;
      } else {
        categories.Other += t.amount;
      }
    });

    const total = Object.values(categories).reduce((sum, v) => sum + v, 0);
    return {
      categories: Object.entries(categories).map(([name, value]) => ({ name, value })),
      total
    };
  }, [store.transactions]);

  const COLORS_SPENDING = ['#6841ea', '#5fb6e4', '#405cf2', '#878c97'];

  return (
    <section className="section-panel section-panel-flat lg:!p-5 flex flex-col justify-between h-full">
      <h2 className="section-label mb-3">Spending Summary</h2>
      {summaryData.total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--color-ink-muted)] text-center">
            No expense data recorded. Start adding transactions to see your spending breakdown.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-1">
          <div className="h-34 w-34 shrink-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {summaryData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_SPENDING[index % COLORS_SPENDING.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-[var(--color-ink-muted)] uppercase font-semibold">Total</span>
              <span className="text-sm font-bold text-[var(--color-ink)] tabular-nums">
                <HiddenValue isHidden={isHidden}>{formatCurrency(summaryData.total)}</HiddenValue>
              </span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-2">
            {summaryData.categories.map((item, index) => {
              const percent = summaryData.total > 0 ? (item.value / summaryData.total) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS_SPENDING[index % COLORS_SPENDING.length] }} />
                    <span className="text-[var(--color-ink-secondary)] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-semibold text-[var(--color-ink)] ml-2">
                    <span><HiddenValue isHidden={isHidden}>{formatCurrency(item.value)}</HiddenValue></span>
                    <span className="text-[var(--color-ink-muted)] text-[9px] font-normal">({percent.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// Recent Transactions list with icons
function RecentTransactionsList({ store, isHidden, currencySymbol }: any) {
  const transactions = useMemo(() => {
    return store.transactions.slice(0, 4);
  }, [store.transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-8 w-8 text-[var(--color-ink-muted)] mb-2 opacity-40" />
        <p className="text-xs text-[var(--color-ink-muted)]">No transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border-soft)]">
      {transactions.map((t: any) => (
        <div key={t.id} className="flex items-center justify-between py-2.5 hover:bg-[var(--color-surface-muted)]/50 px-2 rounded-xl transition-all">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold border border-[var(--color-border-subtle)]",
              t.type === 'income' 
                ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive-text)]' 
                : 'bg-[var(--color-negative-soft)] text-[var(--color-negative-text)]'
            )}>
              {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)] truncate max-w-[200px] sm:max-w-[300px]">
                {t.description}
              </p>
              <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                {format(new Date(t.date), 'MMM dd, yyyy')} · {t.paymentMethod || 'Other'}
              </p>
            </div>
          </div>
          <span className={cn(
            "text-sm font-bold tabular-nums shrink-0",
            t.type === 'income' ? 'text-[var(--color-positive-text)]' : 'text-[var(--color-ink)]'
          )}>
            <HiddenValue isHidden={isHidden} bulletCount={4} prefix={t.type === 'income' ? `+${currencySymbol}` : `-${currencySymbol}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </HiddenValue>
          </span>
        </div>
      ))}
    </div>
  );
}

// Currency rates converter widget
function CurrencyConverterWidget({ currencySymbol }: any) {
  const rates = [
    { code: 'EUR', name: 'Euro', rate: 0.92, flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', rate: 0.79, flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', rate: 156.40, flag: '🇯🇵' },
  ];

  return (
    <div className="design-card p-4.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xs">
      <h3 className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">Live Exchange Rates</h3>
      <div className="space-y-2.5">
        {rates.map(r => (
          <div key={r.code} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">{r.flag}</span>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{r.code}</p>
                <p className="text-[9px] text-[var(--color-ink-muted)]">{r.name}</p>
              </div>
            </div>
            <p className="font-bold text-[var(--color-ink)] tabular-nums">
              1 {currencySymbol} = {r.rate.toFixed(2)} {r.code}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Saving Goals widget
function DashboardGoalsWidget({ store, isHidden }: any) {
  const activeGoals = useMemo(() => {
    return store.goals.slice(0, 2);
  }, [store.goals]);

  if (activeGoals.length === 0) {
    return (
      <div className="design-card p-4.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xs flex flex-col items-center justify-center py-8">
        <TrendingUp className="h-6 w-6 text-[var(--color-ink-muted)] mb-1 opacity-30" />
        <p className="text-xs text-[var(--color-ink-muted)]">No active savings goals.</p>
        <Link to="/goals" className="text-[10px] text-[var(--color-accent)] font-semibold mt-1 hover:underline">Create Goal</Link>
      </div>
    );
  }

  return (
    <div className="design-card p-4.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xs space-y-3.5">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">Savings Goals</h3>
        <Link to="/goals" className="text-[10px] text-[var(--color-accent)] font-bold hover:underline">View all</Link>
      </div>
      <div className="space-y-3">
        {activeGoals.map((goal: any) => {
          const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[var(--color-ink)] truncate max-w-[130px]">{goal.title}</span>
                <span className="font-bold text-[var(--color-ink-secondary)] tabular-nums">
                  <HiddenValue isHidden={isHidden}>{formatCurrency(goal.currentAmount)}</HiddenValue>
                  <span className="text-[var(--color-ink-muted)] font-normal text-[10px]"> / {formatCurrency(goal.targetAmount)}</span>
                </span>
              </div>
              <div className="progress-track bg-[var(--color-border-soft)] h-1 rounded-full">
                <div 
                  className="progress-fill h-full bg-[var(--color-accent)] rounded-full transition-all duration-500" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENTS: HR & OPERATIONS WIDGETS
   ========================================================================== */

// Time Tracker Punch Card widget
function TimeTrackerWidget({ store }: any) {
  const activeTimer = store.activeTimer;
  const [elapsed, setElapsed] = useState(0);

  // Trigger ticking timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      setElapsed(Math.round((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      interval = setInterval(() => {
        setElapsed(Math.round((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handlePunch = async () => {
    if (activeTimer) {
      await store.stopTimer();
    } else {
      // Pick first project to track, or a default string
      const defaultProj = store.projects[0];
      if (defaultProj) {
        store.startTimer(defaultProj.id, 'project');
      } else {
        alert('Please create a project first to track time.');
      }
    }
  };

  const hoursLoggedToday = activeTimer ? (elapsed / 3600) : 0;
  const targetHours = 8;
  const pct = Math.min((hoursLoggedToday / targetHours) * 100, 100);

  return (
    <div className="design-card p-5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[145px] shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Time Tracker
        </span>
        {activeTimer && (
          <span className="status-badge status-badge-warning animate-pulse flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Tracking
          </span>
        )}
      </div>

      <div className="py-2 flex items-center justify-between">
        <div>
          <p className="text-3xl font-extrabold text-[var(--color-ink)] tabular-nums tracking-tight">
            {activeTimer ? formatElapsed(elapsed) : '00:00:00'}
          </p>
          <p className="text-[10px] text-[var(--color-ink-muted)] mt-1 font-semibold uppercase">
            {activeTimer ? `Project: ${store.projects.find((p: any) => p.id === activeTimer.id)?.name || 'Work'}` : 'Check in to log hours'}
          </p>
        </div>
        
        <button
          onClick={handlePunch}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-sm focus:outline-none",
            activeTimer 
              ? "bg-[var(--color-negative)] text-white hover:bg-[var(--color-negative)]/90" 
              : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
          )}
        >
          {activeTimer ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        </button>
      </div>

      <div className="pt-2 border-t border-[var(--color-border-soft)]">
        <div className="flex justify-between text-xs text-[var(--color-ink-secondary)] mb-1">
          <span>Today&apos;s Progress</span>
          <span>{hoursLoggedToday.toFixed(1)}h / {targetHours}h</span>
        </div>
        <div className="progress-track bg-[var(--color-border-soft)] h-1 rounded-full">
          <div className="progress-fill h-full bg-[var(--color-accent)] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// Time Off Balance widget
function TimeOffBalanceWidget() {
  const stats = [
    { name: 'Vacation', left: 14, total: 20, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]' },
    { name: 'Sick Leave', left: 4, total: 6, color: 'text-purple-500', bg: 'bg-purple-500' },
  ];

  return (
    <div className="design-card p-5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[145px] shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Time Off Balance
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-2">
        {stats.map(s => {
          const pct = (s.left / s.total) * 100;
          return (
            <div key={s.name} className="space-y-1.5">
              <div>
                <p className="text-2xl font-extrabold text-[var(--color-ink)] tabular-nums">{s.left}</p>
                <p className="text-[10px] text-[var(--color-ink-muted)] font-medium truncate">{s.name} Days Left</p>
              </div>
              <div className="progress-track bg-[var(--color-border-soft)] h-1 rounded-full">
                <div className={cn("progress-fill h-full rounded-full", s.bg)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => alert('Time off request form coming soon!')}
        className="w-full text-center text-[10px] font-bold text-[var(--color-accent)] py-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors mt-1"
      >
        Request Time Off
      </button>
    </div>
  );
}

// Team status tracker widget (Active, Away, Absent)
function TeamStatusTrackerWidget({ store }: any) {
  // Hardcoded Figma team data for presentation
  const team = [
    { name: 'Natalia', role: 'Designer', status: 'active', color: 'bg-[var(--color-positive)]', init: 'N' },
    { name: 'Matthew', role: 'Developer', status: 'active', color: 'bg-[var(--color-positive)]', init: 'M' },
    { name: 'Sofia', role: 'Product', status: 'away', color: 'bg-orange-400', init: 'S' },
    { name: 'Arthur', role: 'Support', status: 'absent', color: 'bg-red-400', init: 'A' },
  ];

  return (
    <div className="design-card p-5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl flex flex-col justify-between min-h-[145px] shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Team Availability
        </span>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-1.5 scrollbar-none">
        {team.map(member => (
          <div key={member.name} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative h-10 w-10 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--color-ink-secondary)]">
              {member.init}
              <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white", member.color)} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--color-ink)]">{member.name}</span>
            <span className="text-[8px] text-[var(--color-ink-muted)] truncate max-w-[45px]">{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Workspace sticky notes memo pad
function WorkspaceNotesWidget({ store }: any) {
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Load first note if exists, as initial memo content
  useEffect(() => {
    if (store.notes && store.notes.length > 0) {
      setNoteContent(store.notes[0].content);
    }
  }, [store.notes]);

  const handleSaveMemo = async () => {
    setSaving(true);
    try {
      if (store.notes && store.notes.length > 0) {
        // Update first note
        await store.updateNote(store.notes[0].id, {
          content: noteContent,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new note
        const newNote = {
          id: crypto.randomUUID(),
          title: 'Operations Notepad Memo',
          content: noteContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await store.addNote(newNote);
      }
      alert('Workspace Memo saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-panel section-panel-flat flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-3">
        <h2 className="section-label flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--color-accent)]" />
          Workspace Note Pad
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <textarea
          placeholder="Type workspace notes, reminders, or checklist items here..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="flex-1 w-full p-3 text-xs bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl resize-none text-[var(--color-ink-secondary)] outline-none min-h-[130px] font-sans leading-relaxed focus:border-amber-300 dark:focus:border-amber-800"
        />
        <button
          type="button"
          onClick={handleSaveMemo}
          disabled={saving}
          className="w-full btn-primary text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Memo'}
        </button>
      </div>
    </div>
  );
}

// Operations Schedule list (Holidays, Meetings, Zoom tasks)
function OperationsCalendarWidget({ store, today }: any) {
  // Hardcoded calendar meetings matching Figma items
  const calendarItems = [
    { title: 'Workers Day', time: 'May 01', message: 'Happy Workers Day!', location: 'International Holiday', color: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300' },
    { title: 'Meeting with Laura Perez', time: '9:00 - 9:45 AM UTC', message: 'Quarterly review', location: 'on Zoom', color: 'border-[var(--color-accent)] bg-[var(--color-insight-from)]/40 text-[var(--color-ink)]' },
    { title: 'Meeting with Arthur Taylor', time: '10:00 - 11:00 AM UTC', message: 'Project alignment check', location: 'on Slack', color: 'border-purple-500 bg-purple-50/30 text-[var(--color-ink)]' },
  ];

  return (
    <div className="space-y-3 pr-1">
      {calendarItems.map((item, idx) => (
        <div key={idx} className={cn("p-3.5 border-l-4 rounded-r-xl border border-[var(--color-border-subtle)] flex flex-col justify-between gap-1 shadow-2xs", item.color)}>
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-bold">{item.title}</h4>
            <span className="text-[10px] font-semibold opacity-75">{item.time}</span>
          </div>
          <p className="text-[11px] opacity-90">{item.message}</p>
          <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider mt-0.5">{item.location}</span>
        </div>
      ))}
    </div>
  );
}

// Accolades & Rewards list (Figma employee rewards card components)
function EmployeeAccoladesWidget() {
  const accolades = [
    { name: 'Natalia Johnson', award: 'Design MVP', reason: 'Delivered Founder OS premium Figma guidelines', stars: 5, date: 'May 24, 2026' },
    { name: 'Matthew Brown', award: 'Outstanding Coder', reason: 'Polished checkout flows & Zustands', stars: 4, date: 'May 20, 2026' },
  ];

  return (
    <div className="space-y-3 pr-1">
      {accolades.map((acc, idx) => (
        <div key={idx} className="p-3.5 border border-[var(--color-border-subtle)] bg-[var(--color-surface)] rounded-xl flex flex-col gap-1.5 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold text-[var(--color-ink)]">{acc.award}</span>
            </div>
            <span className="text-[9px] text-[var(--color-ink-muted)]">{acc.date}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">{acc.name}</p>
            <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{acc.reason}</p>
          </div>
          <div className="flex gap-0.5 text-amber-400 mt-0.5">
            {Array.from({ length: acc.stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   HELPER UTILITY COMPONENT REPLACEMENTS
   ========================================================================== */

function ChartMetricCard({
  title,
  icon,
  current,
  previous,
  pct,
  dataKey,
  prevKey,
  chartData,
  isHidden,
  invertTrend = false,
}: {
  title: string;
  icon: React.ReactNode;
  current: number;
  previous: number;
  pct: number;
  dataKey: string;
  prevKey: string;
  chartData: Record<string, unknown>[];
  isHidden: boolean;
  invertTrend?: boolean;
}) {
  const store = useStore();
  const isDarkMode = store.isDarkMode;
  const isPositive = invertTrend ? pct <= 0 : pct >= 0;
  const pctLabel = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(2)}% vs last month`;

  const activeLineColor = '#405cf2'; // Apex Blue brand color
  const prevLineColor = isDarkMode ? '#262938' : '#e2e4e9';
  const cursorColor = isDarkMode ? '#31364a' : '#ced0d5';

  return (
    <div className="chart-card p-4.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl flex flex-col justify-between shadow-xs">
      <div className="chart-card-head text-xs font-bold text-[var(--color-ink-muted)] flex items-center gap-1.5 uppercase tracking-wider mb-2">
        {icon}
        {title}
      </div>
      
      <div className="metric-compare flex gap-4 text-xs">
        <div className="metric-compare-item flex items-center gap-1.5">
          <span className="metric-dot h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeLineColor }} />
          <span className="text-[var(--color-ink-secondary)]">This month: </span>
          <span className="font-bold text-[var(--color-ink)] tabular-nums">
            <HiddenValue isHidden={isHidden}>{formatCurrency(current)}</HiddenValue>
          </span>
        </div>
        <div className="metric-compare-item flex items-center gap-1.5">
          <span className="metric-dot h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: prevLineColor }} />
          <span className="text-[var(--color-ink-secondary)]">Last month: </span>
          <span className="font-semibold text-[var(--color-ink-muted)] tabular-nums">
            <HiddenValue isHidden={isHidden}>{formatCurrency(previous)}</HiddenValue>
          </span>
        </div>
      </div>
      
      <span className={cn("text-[10px] font-bold mt-1.5 inline-block", isPositive ? 'text-[var(--color-positive-text)]' : 'text-[var(--color-negative-text)]')}>
        {pctLabel}
      </span>
      
      <div className="h-32 w-full mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#878c97' }} interval="preserveStartEnd" />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey={prevKey} stroke={prevLineColor} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey={dataKey} stroke={activeLineColor} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: activeLineColor }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Operations active projects list
function DashboardProjectsList({ store }: any) {
  const activeProjects = useMemo(() => {
    return store.projects.filter((p: any) => p.status === 'active');
  }, [store.projects]);

  if (activeProjects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
        <p className="text-xs text-[var(--color-ink-muted)]">No active projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeProjects.map((project: any) => (
        <div key={project.id} className="p-3.5 border border-[var(--color-border-subtle)] bg-[var(--color-surface)] rounded-xl flex flex-col gap-2 shadow-2xs">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[var(--color-ink)] truncate">{project.name}</h3>
              <p className="text-[10px] text-[var(--color-ink-muted)] truncate mt-0.5">{project.clientName}</p>
            </div>
            <span className="text-[10px] font-bold text-[var(--color-ink-secondary)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] shrink-0 tabular-nums">
              {formatCurrency(project.value)}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-[var(--color-ink-muted)] mb-1">
              <span>Progress</span>
              <span className="font-semibold text-[var(--color-ink)]">{project.progress}%</span>
            </div>
            <div className="progress-track bg-[var(--color-border-soft)] h-1 rounded-full">
              <div className="progress-fill h-full bg-[var(--color-accent)] rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tasks checklist for Dashboard
function DashboardTasksList({ store }: any) {
  const pendingTasks = useMemo(() => {
    return store.tasks
      .filter((t: any) => !t.completed)
      .sort((a: any, b: any) => {
        if (a.priority === 'high') return -1;
        if (b.priority === 'high') return 1;
        return 0;
      })
      .slice(0, 4);
  }, [store.tasks]);

  if (pendingTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckSquare className="h-6 w-6 text-[var(--color-positive)] mb-1 opacity-45" />
        <p className="text-xs text-[var(--color-ink-muted)]">No pending tasks today!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {pendingTasks.map((task: any) => (
        <div key={task.id} className="flex items-start gap-3 p-2.5 hover:bg-[var(--color-surface-muted)] rounded-xl transition-all">
          <button 
            type="button"
            onClick={() => store.toggleTaskCompletion(task.id)}
            className={cn(
              "mt-0.5 flex-shrink-0 h-4.5 w-4.5 rounded border border-[var(--color-border-soft)] flex items-center justify-center transition-colors bg-[var(--color-surface)]",
              task.completed ? "bg-[var(--color-positive)] border-[var(--color-positive)]" : ""
            )}
          >
            {task.completed && <Check className="h-3 w-3 text-white" />}
          </button>
          <div className="min-w-0">
            <p className={cn("text-xs font-semibold text-[var(--color-ink)] truncate max-w-[250px] sm:max-w-[400px]", task.completed ? "text-[var(--color-ink-muted)] line-through" : "")}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {task.priority === 'high' && <span className="status-badge status-badge-warning text-[9px] px-1 py-0 border border-orange-200">High</span>}
              {task.projectId && <span className="status-badge status-badge-neutral text-[9px] px-1 py-0">Project</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
