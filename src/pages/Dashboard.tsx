import React from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isToday, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
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
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

import { TransactionModal } from '../components/TransactionModal';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { HiddenValue } from '../components/HiddenValue';
import { ChartTooltip } from '../components/ChartTooltip';
import { PageShell } from '../components/layout/PageShell';

type ChartRange = '7d' | '14d' | '30d';

export function Dashboard() {
  const store = useStore();
  const user = store.user;
  const isPrivacyMode = store.isPrivacyMode;
  
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  const [chartRange, setChartRange] = React.useState<ChartRange>('7d');
  
  const isHidden = isPrivacyMode && !store.isPeeking;
  const today = new Date();
  
  const totalIncome = store.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = store.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;
  
  const personalIncome = store.transactions.filter(t => t.type === 'income' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalExpenses = store.transactions.filter(t => t.type === 'expense' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalBalance = personalIncome - personalExpenses;
  
  const activeProjectsCount = store.projects.filter(p => p.status === 'active').length;
  
  const pendingTasksToday = store.tasks.filter(t => 
    t.dueDate && isToday(new Date(t.dueDate)) && !t.completed
  ).length;
  
  const upcomingPayments = store.recurringPayments.filter(rp => rp.active).slice(0, 3);
  const upcomingPaymentsAmount = upcomingPayments.reduce((acc, rp) => acc + rp.amount, 0);

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
  
  const chartData = React.useMemo(() => {
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

  const showTaskAlert = pendingTasksToday > 0;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <h1 className="page-title">Hey {user?.name.split(' ')[0]} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="page-subtitle">{format(today, 'EEEE, MMMM do, yyyy')}</p>
            {isPrivacyMode && (
              <span className="status-badge status-badge-neutral">
                <EyeOff className="h-3 w-3" />
                Private
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <PrivacyToggle />
           <button type="button" onClick={() => setIsQuickAddOpen(true)} className="hidden sm:inline-flex btn-primary">
            <Plus className="h-4 w-4" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {showTaskAlert && (
        <div className="alert-banner">
          <div className="alert-banner-icon mt-0.5 h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
            <span className="text-red-600 dark:text-red-400 text-xs font-medium">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="alert-banner-title">{pendingTasksToday} task{pendingTasksToday > 1 ? 's' : ''} due today</p>
            <p className="alert-banner-body">Review your Today&apos;s Focus list and clear high-priority items before end of day.</p>
            <Link to="/tasks" className="inline-block mt-2 text-xs font-medium text-[var(--color-insight-accent)] hover:underline">View tasks →</Link>
          </div>
        </div>
      )}

      <section className="section-panel">
        <h2 className="section-label">Quick Access</h2>
        <div className="quick-access-grid grid grid-cols-1 lg:grid-cols-4 lg:gap-3 mt-3 lg:mt-4">
          <DualBalanceCard personalBalance={personalBalance} currentBalance={currentBalance} isHidden={isHidden} />
          <StatCard 
            title="Active Projects" 
            value={activeProjectsCount.toString()} 
            icon={<FolderKanban className="h-4 w-4 text-emerald-600" />}
            badge={<span className="status-badge status-badge-success">On track</span>}
            subText="All operations nominal"
          />
          <StatCard 
            title="Tasks Due Today" 
            value={pendingTasksToday.toString()} 
            icon={<CheckSquare className="h-4 w-4 text-orange-500" />}
            badge={
              <span className={cn("status-badge", pendingTasksToday > 0 ? "status-badge-warning" : "status-badge-success")}>
                {pendingTasksToday > 0 ? 'Action needed' : 'All clear'}
              </span>
            }
            subText={pendingTasksToday > 0 ? "Review pending tasks" : "No urgent items today"}
          />
          <StatCard 
            title="Upcoming Bills" 
            value={upcomingPayments.length.toString()} 
            icon={<BellRing className="h-4 w-4 text-purple-500" />}
            badge={
              <span className={cn("status-badge", upcomingPaymentsAmount > 0 ? "status-badge-neutral" : "status-badge-success")}>
                {upcomingPaymentsAmount > 0 ? 'Scheduled' : 'All caught up'}
              </span>
            }
            subText={upcomingPaymentsAmount > 0 ? "Payments arriving soon" : "All caught up"}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-6">
        <div className="lg:col-span-2 space-y-7 lg:space-y-6">
          <section className="section-panel section-panel-flat lg:!p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <h2 className="section-label">Financial Overview</h2>
                <Link to="/finance/personal" className="section-link sm:hidden">View all →</Link>
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
                <Link to="/finance/personal" className="section-link hidden sm:inline">View all →</Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartMetricCard
                title="Total Income"
                icon={<Tag className="h-4 w-4" />}
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
                icon={<Banknote className="h-4 w-4" />}
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
          </section>

          <section className="section-panel section-panel-nested">
            <div className="flex justify-between items-center mb-3 lg:mb-4">
              <h2 className="section-label">Active Projects</h2>
              <Link to="/projects" className="section-link">View all →</Link>
            </div>
            
            <div className="space-y-0 lg:space-y-3">
              {store.projects.filter(p => p.status === 'active').map(project => (
                <div key={project.id} className="design-card p-4 lg:p-5 max-lg:first:pt-0">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-[var(--color-ink)] truncate">{project.name}</h3>
                      <p className="text-sm text-[var(--color-ink-secondary)] mt-0.5">{project.clientName}</p>
                    </div>
                    <span className="text-xs font-medium text-[var(--color-ink-secondary)] bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-md shrink-0 tabular-nums">
                      {formatCurrency(project.value)}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-ink-muted)]">Progress</span>
                      <span className="font-medium text-[var(--color-ink)]">{project.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                    <div className="progress-labels">
                      <span>Started</span>
                      <span>{project.progress}% complete</span>
                    </div>
                  </div>
                </div>
              ))}
              {store.projects.filter(p => p.status === 'active').length === 0 && (
                <p className="text-sm text-[var(--color-ink-muted)] text-center py-6">No active projects.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-7 lg:space-y-6">
          <section className="section-panel !p-0 overflow-hidden rounded-[14px] lg:rounded-[var(--radius-panel)]">
            <div className="insight-banner !border-0 !rounded-[14px] lg:!rounded-none">
              <div className="flex-1 min-w-0">
                <span className="insight-badge"><Sparkles className="h-3 w-3" /> Recommended by AI</span>
                {store.transactions.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-[var(--color-ink)] mt-1">Keep tracking for smarter insights</p>
                    <p className="text-xs text-[var(--color-ink-secondary)] mt-1 leading-relaxed">
                      You have <span className="font-medium text-[var(--color-ink)]">{store.transactions.length} recorded {store.transactions.length === 1 ? 'transaction' : 'transactions'}</span>. Consistent logging unlocks spending pattern analysis.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[var(--color-ink)] mt-1">Start logging transactions</p>
                    <p className="text-xs text-[var(--color-ink-secondary)] mt-1 leading-relaxed">
                      Add your income and expenses to unlock AI-powered insights about your spending habits.
                    </p>
                  </>
                )}
                {store.projects.filter(p => p.status === 'active').length > 0 && (
                  <p className="text-xs text-[var(--color-ink-secondary)] mt-2">
                    <span className="font-medium text-[var(--color-insight-accent)]">{store.projects.filter(p => p.status === 'active').length} active projects</span> — keep pushing toward your deadlines.
                  </p>
                )}
              </div>
              <Megaphone className="h-8 w-8 text-[var(--color-insight-accent)] opacity-60 shrink-0 hidden sm:block" />
            </div>
          </section>

          <section className="section-panel section-panel-flat">
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-label">Today&apos;s Focus</h2>
              <Link to="/tasks" className="section-link">View all →</Link>
            </div>
            
            <div className="design-card p-0 lg:p-4">
              <div className="space-y-0.5">
                {store.tasks
                  .filter(t => !t.completed)
                  .sort((a, b) => {
                    if (a.priority === 'high') return -1;
                    if (b.priority === 'high') return 1;
                    return 0;
                  })
                  .slice(0, 4)
                  .map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-2.5 hover:bg-[var(--color-surface-hover)] rounded-[10px] transition-colors">
                    <button 
                      onClick={() => store.toggleTaskCompletion(task.id)}
                      className={cn(
                        "mt-0.5 flex-shrink-0 h-5 w-5 rounded border border-[var(--color-border-subtle)] flex items-center justify-center transition-colors",
                        task.completed ? "bg-[var(--color-positive)] border-[var(--color-positive)]" : "bg-[var(--color-surface)]"
                      )}
                    >
                      {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
                    </button>
                    <div>
                      <p className={cn("text-sm font-normal", task.completed ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.priority === 'high' && <span className="status-badge status-badge-warning">High</span>}
                        {task.projectId && <span className="status-badge status-badge-neutral">Project Work</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-panel section-panel-flat">
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-label">Upcoming Bills</h2>
              <Link to="/payments" className="section-link">View all →</Link>
            </div>
            <div className="design-card p-0 lg:p-4">
              <div className="space-y-4">
                {upcomingPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border-soft)] flex items-center justify-center text-[var(--color-ink-muted)]">
                        <BellRing className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-ink)]">{payment.name}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">Due on {payment.dayOfMonth}th</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-ink)] tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <TransactionModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} defaultType="expense" />
      
      <button
        type="button"
        onClick={() => setIsQuickAddOpen(true)}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        aria-label="Quick add"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}

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

  const activeLineColor = '#F97316'; // premium orange
  const prevLineColor = isDarkMode ? '#3F3F46' : '#D1D5DB';
  const cursorColor = isDarkMode ? '#2A2A2E' : '#E5E7EB';

  return (
    <div className="chart-card">
      <div className="chart-card-head">{icon}{title}</div>
      <div className="metric-compare">
        <div className="metric-compare-item">
          <span className="metric-dot" style={{ backgroundColor: activeLineColor }} />
          <span className="inline-flex items-center gap-1"><span className="metric-compare-value"><HiddenValue isHidden={isHidden}>{formatCurrency(current)}</HiddenValue></span> This month</span>
        </div>
        <div className="metric-compare-item">
          <span className="metric-dot" style={{ backgroundColor: prevLineColor }} />
          <span className="inline-flex items-center gap-1"><span className="metric-compare-value"><HiddenValue isHidden={isHidden}>{formatCurrency(previous)}</HiddenValue></span> Last month</span>
        </div>
      </div>
      <span className={isPositive ? 'trend-up' : 'trend-down'}>{pctLabel}</span>
      <div className="h-36 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} interval="preserveStartEnd" />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey={prevKey} stroke={prevLineColor} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey={dataKey} stroke={activeLineColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: activeLineColor }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  badge,
  subText,
}: { 
  title: string; 
  value: React.ReactNode; 
  icon: React.ReactNode; 
  badge?: React.ReactNode;
  subText?: string;
}) {
  return (
    <div className="chart-card h-full">
      <div className="chart-card-head">{icon}{title}</div>
      <p className="metric-value-lg">{value}</p>
      {badge && <div>{badge}</div>}
      {subText && <p className="text-xs text-[var(--color-ink-muted)] mt-auto">{subText}</p>}
    </div>
  );
}

function DualBalanceCard({ personalBalance, currentBalance, isHidden }: { personalBalance: number; currentBalance: number; isHidden: boolean }) {
  const mode = useStore(state => state.balanceDisplayMode) || 'net-worth';

  if (mode === 'liquid-cash') {
    return (
      <div className="chart-card h-full flex flex-col justify-between">
        <div className="chart-card-head"><Wallet className="h-4 w-4" />Liquid Cash</div>
        <div className="my-auto py-2">
          <p className="metric-value-lg">
            <HiddenValue isHidden={isHidden}>{formatCurrency(personalBalance)}</HiddenValue>
          </p>
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">Available for spending</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card h-full">
      <div className="chart-card-head"><Wallet className="h-4 w-4" />Net Worth</div>
      <p className="metric-value-lg">
        <HiddenValue isHidden={isHidden}>{formatCurrency(currentBalance)}</HiddenValue>
      </p>
      <div className="mt-auto pt-3 border-t border-[var(--color-border-soft)]">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-ink-muted)]">Liquid Cash</span>
          <span className="text-sm font-medium text-[var(--color-ink)] tabular-nums">
            <HiddenValue isHidden={isHidden} bulletCount={4}>{formatCurrency(personalBalance)}</HiddenValue>
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Available for spending</p>
      </div>
    </div>
  );
}
