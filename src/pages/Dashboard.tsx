import React from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn, CURRENCIES } from '../lib/utils';
import { format, isToday, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, addMonths } from 'date-fns';
import { 
  Wallet, 
  FolderKanban, 
  CheckSquare, 
  BellRing,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  EyeOff,
  Sparkles,
  Tag,
  Banknote,
  Megaphone,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
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
  
  const currencyCode = store.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';

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

  const COLORS = ['#405cf2', '#66c497', '#8a65f3', '#cd3546', '#e66433', '#f59e0b', '#ec4899', '#6366f1'];

  const spendingBreakdownData = React.useMemo(() => {
    const expenseTransactions = store.transactions.filter(t => t.type === 'expense');
    const groups: Record<string, number> = {};
    
    expenseTransactions.forEach(t => {
      const cat = t.categoryDetail || 'Uncategorized';
      groups[cat] = (groups[cat] || 0) + t.amount;
    });
    
    const sorted = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    if (sorted.length <= 5) {
      return sorted;
    }
    
    const top = sorted.slice(0, 4);
    const otherValue = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
    top.push({ name: 'Other', value: otherValue });
    return top;
  }, [store.transactions]);

  const averageMonthlyIncome = React.useMemo(() => {
    const incomeTransactions = store.transactions.filter(t => t.type === 'income');
    if (incomeTransactions.length === 0) return 0;
    
    const monthlyTotals: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      const monthStr = t.date.substring(0, 7); // YYYY-MM
      monthlyTotals[monthStr] = (monthlyTotals[monthStr] || 0) + t.amount;
    });
    
    const values = Object.values(monthlyTotals);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [store.transactions]);

  const forecastData = React.useMemo(() => {
    const data = [];
    const startOffset = -2;
    const endOffset = 3;
    
    for (let i = startOffset; i <= endOffset; i++) {
      const monthDate = addMonths(today, i);
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM yyyy');
      
      const actualIncome = store.transactions
        .filter(t => t.type === 'income' && t.date.substring(0, 7) === monthStr)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const projectIncome = store.projects
        .filter(p => {
          if (p.status !== 'active') return false;
          const deadlineMonth = p.deadline.substring(0, 7);
          if (i === 0) {
            return deadlineMonth === monthStr || p.deadline < format(today, 'yyyy-MM-dd');
          }
          return deadlineMonth === monthStr;
        })
        .reduce((sum, p) => sum + p.amountPending, 0);
        
      const projectedIncome = averageMonthlyIncome + projectIncome;
      
      data.push({
        name: monthLabel,
        actual: i <= 0 ? actualIncome : null,
        projected: i >= 0 ? projectedIncome : null,
      });
    }
    return data;
  }, [store.transactions, store.projects, averageMonthlyIncome, today]);

  const isDarkMode = store.isDarkMode;

  return (
    <PageShell>
      {/* Top Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <nav className="breadcrumbs">
            <span>Workspace</span>
            <ArrowUpRight className="rotate-45" />
            <span className="breadcrumb-current">Dashboard</span>
          </nav>
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
        <div className="flex gap-2">
           <PrivacyToggle />
           <button type="button" onClick={() => setIsQuickAddOpen(true)} className="btn-primary flex items-center gap-1.5 px-4 py-2">
            <Plus className="h-4 w-4" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {/* Quick Access stats grid */}
      <section className="section-panel">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h2 className="section-label">Quick Access</h2>
          <Link to="/finance/personal" className="section-link">View all →</Link>
        </div>
        <div className={cn(
          "quick-access-grid grid grid-cols-1 gap-4",
          (store.dashboardWidgets?.balanceCard ?? true) ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}>
          {(store.dashboardWidgets?.balanceCard ?? true) && (
            <DualBalanceCard personalBalance={personalBalance} currentBalance={currentBalance} isHidden={isHidden} currencySymbol={currencySymbol} />
          )}
          <HeroMetricCard
            eyebrow="Active Projects"
            icon={<FolderKanban className="h-3.5 w-3.5" />}
            value={activeProjectsCount.toString()}
            delta={activeProjectsCount > 0 ? `${activeProjectsCount} in flight` : 'Nothing in flight'}
            deltaTone={activeProjectsCount > 0 ? 'positive' : 'neutral'}
            footerText={activeProjectsCount > 0 ? 'Operations running' : 'All clear'}
            footerLink={{ label: 'View all', to: '/projects' }}
          />
          <HeroMetricCard
            eyebrow="Tasks Due Today"
            icon={<CheckSquare className="h-3.5 w-3.5" />}
            value={pendingTasksToday.toString()}
            delta={pendingTasksToday > 0 ? `${pendingTasksToday} need attention` : 'All clear'}
            deltaTone={pendingTasksToday > 0 ? 'negative' : 'positive'}
            footerText={pendingTasksToday > 0 ? 'Review pending' : 'No urgent items'}
            footerLink={{ label: 'Open tasks', to: '/tasks' }}
          />
          <HeroMetricCard
            eyebrow="Upcoming Bills"
            icon={<BellRing className="h-3.5 w-3.5" />}
            value={upcomingPayments.length.toString()}
            delta={upcomingPaymentsAmount > 0 ? `${formatCurrency(upcomingPaymentsAmount)} scheduled` : 'Caught up'}
            deltaTone="neutral"
            footerText={upcomingPaymentsAmount > 0 ? 'Arriving soon' : 'No bills due'}
            footerLink={{ label: 'Manage', to: '/payments' }}
          />
        </div>
      </section>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(store.dashboardWidgets?.chart ?? true) && (
            <section className="section-panel">
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
                  currencySymbol={currencySymbol}
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
                  currencySymbol={currencySymbol}
                  invertTrend
                />
              </div>
            </section>
          )}

          {/* Active Projects List */}
          <section className="section-panel">
            <div className="flex justify-between items-center mb-3 lg:mb-4">
              <div className="flex items-center gap-2">
                <h2 className="section-label">Active Projects</h2>
                <span className="text-[10px] font-semibold text-[var(--color-ink-muted)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded-md">
                  {store.projects.filter(p => p.status === 'active').length}
                </span>
              </div>
              <Link to="/projects" className="section-link">View all →</Link>
            </div>
            
            <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden">
              {store.projects.filter(p => p.status === 'active').map(project => {
                const progressTone = project.progress >= 80 ? 'positive' : project.progress >= 40 ? 'neutral' : 'warning';
                const progressColor = progressTone === 'positive' ? 'bg-emerald-500' : progressTone === 'warning' ? 'bg-orange-500' : 'bg-[var(--color-accent)]';
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-hover)] transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center text-sm font-bold text-[var(--color-ink-secondary)] shrink-0">
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <h3 className="text-sm font-semibold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                          {project.name}
                        </h3>
                        <span className="text-xs font-semibold text-[var(--color-ink)] tabular-nums shrink-0">
                          {formatCurrency(project.value)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-[var(--color-ink-muted)] truncate">{project.clientName}</span>
                        <span className="text-[var(--color-border-soft)]">•</span>
                        <span className="text-[11px] text-[var(--color-ink-muted)]">{project.progress}% complete</span>
                      </div>
                      <div className="progress-track">
                        <div className={cn('h-full rounded-full transition-all duration-500', progressColor)} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
              {store.projects.filter(p => p.status === 'active').length === 0 && (
                <p className="text-sm text-[var(--color-ink-muted)] text-center py-8">No active projects.</p>
              )}
            </div>
          </section>

          {/* Spending Breakdown and Revenue Forecast widgets */}
          {((store.dashboardWidgets?.spendingBreakdown ?? true) || (store.dashboardWidgets?.revenueForecast ?? true)) && (
            <div className={cn(
              "grid grid-cols-1 gap-6",
              (store.dashboardWidgets?.spendingBreakdown ?? true) && (store.dashboardWidgets?.revenueForecast ?? true)
                ? "md:grid-cols-2"
                : "grid-cols-1"
            )}>
              {(store.dashboardWidgets?.spendingBreakdown ?? true) && (
                <section className="section-panel">
                  <h2 className="section-label mb-3">Spending Breakdown</h2>
                  {spendingBreakdownData.length === 0 ? (
                    <p className="text-xs text-[var(--color-ink-muted)] text-center py-8">
                      No expense data recorded. Start adding transactions to see your spending breakdown.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="h-44 w-44 shrink-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={spendingBreakdownData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {spendingBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        {spendingBreakdownData.map((item, index) => {
                          const totalSpent = spendingBreakdownData.reduce((sum, i) => sum + i.value, 0);
                          const percent = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
                          return (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-[var(--color-ink-secondary)] truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-medium text-[var(--color-ink)] ml-2">
                                <span><HiddenValue isHidden={isHidden}>{formatCurrency(item.value)}</HiddenValue></span>
                                <span className="text-[var(--color-ink-muted)] text-[10px] font-normal">({percent.toFixed(0)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(store.dashboardWidgets?.revenueForecast ?? true) && (
                <section className="section-panel">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="section-label">Revenue Forecast</h2>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)] mb-3">
                    Projected income based on active project deadlines & monthly average.
                  </p>
                  <div className="h-44 w-full -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#868C98' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#868C98' }} width={30} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ stroke: isDarkMode ? '#20232d' : '#e2e4e9', strokeDasharray: '4 4' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke={isDarkMode ? '#546fed' : '#405cf2'} 
                          name="Actual"
                          strokeWidth={2} 
                          dot={{ r: 3, fill: isDarkMode ? '#546fed' : '#405cf2' }} 
                          activeDot={{ r: 5 }} 
                          connectNulls
                        />
                        <Line 
                          type="monotone" 
                          dataKey="projected" 
                          stroke="#f17b2c" 
                          name="Projected"
                          strokeWidth={2} 
                          strokeDasharray="4 4" 
                          dot={{ r: 3, fill: '#f17b2c' }} 
                          activeDot={{ r: 5 }} 
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[14px] lg:rounded-[var(--radius-panel)]">
            <div className="insight-banner !rounded-[14px] lg:!rounded-none">
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

          {(store.dashboardWidgets?.tasksSummary ?? true) && (
            <section className="section-panel">
              <div className="flex justify-between items-center mb-3">
                <h2 className="section-label">Today&apos;s Focus</h2>
                <Link to="/tasks" className="section-link">View all →</Link>
              </div>
              
              <div className="design-card p-3 lg:p-4">
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
          )}

          {(store.dashboardWidgets?.upcomingPayments ?? true) && (
            <section className="section-panel">
              <div className="flex justify-between items-center mb-3">
                <h2 className="section-label">Upcoming Bills</h2>
                <Link to="/payments" className="section-link">View all →</Link>
              </div>
              <div className="design-card p-4">
                <div className="space-y-4">
                  {upcomingPayments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border-soft)] flex items-center justify-center text-[var(--color-ink-muted)]">
                          <BellRing className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{payment.name}</p>
                          <p className="text-xs text-[var(--color-ink-muted)] font-medium">Due on {payment.dayOfMonth}th</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-ink)] tabular-nums">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
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
  currencySymbol,
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
  currencySymbol: string;
  invertTrend?: boolean;
}) {
  const store = useStore();
  const isDarkMode = store.isDarkMode;
  const isPositive = invertTrend ? pct <= 0 : pct >= 0;
  const pctLabel = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(2)}% vs last month`;

  const activeLineColor = isDarkMode ? '#31353f' : '#cdd0d5';
  const prevLineColor = isDarkMode ? '#546fed' : '#405cf2';
  const cursorColor = isDarkMode ? '#20232d' : '#e2e4e9';

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
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#868C98' }} interval="preserveStartEnd" />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey={prevKey} stroke={prevLineColor} strokeWidth={1.5} dot={false} connectNulls />
            <Line type="monotone" dataKey={dataKey} stroke={activeLineColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: activeLineColor }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HeroMetricCard({
  eyebrow,
  icon,
  value,
  delta,
  deltaTone = 'neutral',
  footerText,
  footerLink,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  footerText?: string;
  footerLink?: { label: string; to: string };
}) {
  return (
    <div className="hero-metric-card h-full">
      <div className="hero-metric-eyebrow">
        <span className="hero-metric-eyebrow-label">
          {icon}
          <span>{eyebrow}</span>
        </span>
      </div>
      <div>
        <p className="hero-metric-value">{value}</p>
        {delta && (
          <p className={cn(
            'hero-metric-delta mt-1',
            deltaTone === 'positive' && 'hero-metric-delta-positive',
            deltaTone === 'negative' && 'hero-metric-delta-negative',
          )}>{delta}</p>
        )}
      </div>
      {(footerText || footerLink) && (
        <div className="hero-metric-footer mt-auto">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {footerText}
          </span>
          {footerLink && (
            <Link to={footerLink.to} className="hero-metric-footer-link">{footerLink.label}</Link>
          )}
        </div>
      )}
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
    <div className="chart-card h-full flex flex-col justify-between">
      <div className="chart-card-head flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">{title}</span>
        <div className="h-8 w-8 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[var(--color-ink)] mt-3 leading-none tracking-tight">{value}</p>
      <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-soft)]">
        {badge}
        {subText && <p className="text-[11px] text-[var(--color-ink-muted)] font-medium">{subText}</p>}
      </div>
    </div>
  );
}

function DualBalanceCard({ personalBalance, currentBalance, isHidden, currencySymbol }: { personalBalance: number; currentBalance: number; isHidden: boolean; currencySymbol: string }) {
  const store = useStore();
  const mode = store.balanceDisplayMode || 'net-worth';

  const isNetWorth = mode === 'net-worth';
  const mainLabel = isNetWorth ? 'NET WORTH' : 'LIQUID CASH';
  const mainValue = isNetWorth ? currentBalance : personalBalance;
  const footerLabel = isNetWorth ? 'Liquid Cash' : 'Net Worth';
  const footerValue = isNetWorth ? personalBalance : currentBalance;

  return (
    <div className="hero-metric-card h-full">
      <div className="hero-metric-eyebrow">
        <span className="hero-metric-eyebrow-label">
          <Wallet className="h-3.5 w-3.5" />
          <span>{mainLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => store.setBalanceDisplayMode(isNetWorth ? 'liquid-cash' : 'net-worth')}
          className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)] hover:underline transition-all focus:outline-none cursor-pointer"
        >
          Switch
        </button>
      </div>
      <div>
        <p className="hero-metric-value">
          <HiddenValue isHidden={isHidden}>{formatCurrency(mainValue)}</HiddenValue>
        </p>
      </div>
      <div className="hero-metric-footer mt-auto">
        <span className="text-[var(--color-ink-muted)]">{footerLabel}</span>
        <span className="font-semibold text-[var(--color-ink)] tabular-nums">
          <HiddenValue isHidden={isHidden} bulletCount={4} prefix={currencySymbol}>{formatCurrency(footerValue)}</HiddenValue>
        </span>
      </div>
    </div>
  );
}
