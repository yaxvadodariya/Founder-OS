import React from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isToday, isBefore, addDays } from 'date-fns';
import { 
  TrendingUp, 
  Wallet, 
  FolderKanban, 
  CheckSquare, 
  BellRing,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  Plus,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

import { TransactionModal } from '../components/TransactionModal';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { HiddenValue } from '../components/HiddenValue';
import { ChartTooltip } from '../components/ChartTooltip';

export function Dashboard() {
  const store = useStore();
  const user = store.user;
  const isPrivacyMode = store.isPrivacyMode;
  
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  
  const isHidden = isPrivacyMode && !store.isPeeking;
  
  const today = new Date();
  
  // Calculate stats
  const totalIncome = store.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = store.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;
  
  const personalIncome = store.transactions.filter(t => t.type === 'income' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalExpenses = store.transactions.filter(t => t.type === 'expense' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0);
  const personalBalance = personalIncome - personalExpenses;
  
  const activeProjectsCount = store.projects.filter(p => p.status === 'active').length;
  const activeProjectsValue = store.projects
    .filter(p => p.status === 'active')
    .reduce((acc, p) => acc + p.value, 0);
  
  const pendingTasksToday = store.tasks.filter(t => 
    t.dueDate && isToday(new Date(t.dueDate)) && !t.completed
  ).length;
  const completedTasksToday = store.tasks.filter(t => 
    t.dueDate && isToday(new Date(t.dueDate)) && t.completed
  ).length;
  
  const upcomingPayments = store.recurringPayments.filter(rp => rp.active).slice(0, 3);
  const upcomingPaymentsAmount = upcomingPayments.reduce((acc, rp) => acc + rp.amount, 0);
  
  // Fake chart data
  const chartData = [
    { name: 'Mon', value: 1200 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2500 },
    { name: 'Thu', value: 4800 },
    { name: 'Fri', value: 3900 },
    { name: 'Sat', value: 6000 },
    { name: 'Sun', value: 5500 },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hey {user?.name.split(' ')[0]} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM do, yyyy')}</p>
            {isPrivacyMode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                <EyeOff className="h-3 w-3 mr-1" />
                Private Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <PrivacyToggle />
           <button 
             onClick={() => setIsQuickAddOpen(true)}
             className="btn-quick-add focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
           >
            <Plus className="h-[16px] w-[16px]" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
        <div className="flex items-center mb-4 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[4px]">
          <DualBalanceCard 
            personalBalance={personalBalance} 
            currentBalance={currentBalance} 
            isHidden={isHidden} 
          />
          <StatCard 
            title="Active Projects" 
            value={activeProjectsCount.toString()} 
            icon={<FolderKanban className="h-4 w-4 text-emerald-600" />}
            subLabel="Status"
            subValue={
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-700 text-xs">On track</span>
              </div>
            }
            subText="All operations nominal"
          />
          <StatCard 
            title="Tasks Due Today" 
            value={pendingTasksToday.toString()} 
            icon={<CheckSquare className="h-4 w-4 text-orange-600" />}
            subLabel="Priorities"
            subValue={
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", pendingTasksToday > 0 ? "bg-orange-500" : "bg-gray-300")}></span>
                <span className="text-gray-700 text-xs">{pendingTasksToday > 0 ? "Action needed" : "All clear"}</span>
              </div>
            }
            subText={pendingTasksToday > 0 ? "Review pending tasks" : "No urgent items today"}
          />
          <StatCard 
            title="Upcoming Bills" 
            value={upcomingPayments.length.toString()} 
            icon={<BellRing className="h-4 w-4 text-purple-600" />}
            subLabel="Timeline"
            subValue={
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", upcomingPaymentsAmount > 0 ? "bg-purple-500" : "bg-gray-300")}></span>
                <span className="text-gray-700 text-xs">{upcomingPaymentsAmount > 0 ? "Scheduled" : "No upcoming"}</span>
              </div>
            }
            subText={upcomingPaymentsAmount > 0 ? "Payments arriving soon" : "All caught up"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Financial Overview</h2>
              <Link to="/finance/personal" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 tracking-tight">VIEW ALL &rarr;</Link>
            </div>
            <div className="design-card p-6">
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Income this month</p>
                  <div className="flex items-end gap-2">
                    <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">
                      {formatCurrency(85000)}
                    </p>
                    <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8%
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block w-px bg-gray-100"></div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Expenses this month</p>
                  <div className="flex items-end gap-2">
                    <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">
                      {formatCurrency(32000)}
                    </p>
                    <span className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded leading-none">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" /> 2%
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                    <Tooltip 
                      content={<ChartTooltip />}
                      cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Active Projects</h2>
              <Link to="/projects" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 tracking-tight">VIEW ALL &rarr;</Link>
            </div>
            
            <div className="space-y-[14px]">
              {store.projects.filter(p => p.status === 'active').map(project => (
                <div key={project.id} className="design-card p-4 hover:border-blue-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.clientName}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      {formatCurrency(project.value)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {store.projects.filter(p => p.status === 'active').length === 0 && (
                <p className="text-sm text-gray-500text-center py-4">No active projects.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* AI Insights Panel */}
           <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Smart Insights</h2>
            </div>
            <div className="design-card bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-5">
              <div className="space-y-3">
                <p className="text-sm text-indigo-800 leading-relaxed text-balance">
                  You've spent <span className="font-semibold">12% less</span> on personal expenses this month compared to the last. Keep it up!
                </p>
                <div className="h-px bg-indigo-100/50"></div>
                <p className="text-sm text-indigo-800 leading-relaxed text-balance">
                  Your <span className="font-semibold">"Fintech Dashboard UI"</span> project is nearing its deadline. You still have 1 milestone pending.
                </p>
              </div>
            </div>
          </div>

          {/* Today's Focus (Tasks) */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Today's Focus</h2>
              <Link to="/tasks" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 tracking-tight">VIEW ALL &rarr;</Link>
            </div>
            
            <div className="design-card p-6">
              <div className="space-y-3">
                {store.tasks
                  .filter(t => !t.completed)
                  .sort((a, b) => {
                    if (a.priority === 'high') return -1;
                    if (b.priority === 'high') return 1;
                    return 0;
                  })
                  .slice(0, 4)
                  .map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                    <button 
                      onClick={() => store.toggleTaskCompletion(task.id)}
                      className={cn(
                        "mt-0.5 flex-shrink-0 h-5 w-5 rounded border border-gray-300 flex items-center justify-center transition-colors hover:border-blue-500",
                        task.completed ? "bg-blue-500 border-blue-500" : "bg-white"
                      )}
                    >
                      {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
                    </button>
                    <div>
                      <p className={cn("text-sm font-medium", task.completed ? "text-gray-400 line-through" : "text-gray-900")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.priority === 'high' && <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">High</span>}
                        {task.projectId && <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Project Work</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Upcoming Bills</h2>
              <Link to="/payments" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 tracking-tight">VIEW ALL &rarr;</Link>
            </div>
            <div className="design-card p-6">
              <div className="space-y-4">
                {upcomingPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                        <BellRing className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.name}</p>
                        <p className="text-xs text-gray-500">Due on {payment.dayOfMonth}th</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <TransactionModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        defaultType="expense"
      />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp,
  subLabel,
  subValue,
  subText,
  isHidden
}: { 
  title: string, 
  value: React.ReactNode, 
  icon: React.ReactNode, 
  trend?: string, 
  trendUp?: boolean,
  subLabel?: string,
  subValue?: React.ReactNode,
  subText?: string,
  isHidden?: boolean
}) {
  return (
    <div className="design-card p-5 h-full flex flex-col justify-start">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-[24px] font-medium leading-none tracking-tight text-gray-900 mt-1">{value}</h3>
          </div>
          <div className="p-1.5 bg-gray-50 rounded-md">
            {icon}
          </div>
        </div>
        
        {trend && (
           <p className={cn("text-xs font-medium mt-2 flex items-center", trendUp ? "text-emerald-600" : "text-red-600")}>
            {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {trend} from last month
          </p>
        )}

        {subLabel && (
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <p className="text-xs font-medium text-gray-400">{subLabel}</p>
                 <span className="text-[14px] font-medium tracking-tight text-gray-700">
                    {subValue}
                 </span>
              </div>
              {subText && <p className="text-[10px] text-gray-400">{subText}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DualBalanceCard({ personalBalance, currentBalance, isHidden }: { personalBalance: number; currentBalance: number; isHidden: boolean }) {
  return (
    <div className="design-card p-5 h-full flex flex-col justify-start">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-medium text-gray-500">Net Worth</p>
            <h3 className="text-[24px] font-medium leading-none tracking-tight text-gray-900 mt-1">
              <HiddenValue isHidden={isHidden}>{formatCurrency(currentBalance)}</HiddenValue>
            </h3>
          </div>
          <div className="p-1.5 bg-gray-50 rounded-md">
            <Wallet className="h-4 w-4 text-gray-600" />
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <p className="text-xs font-medium text-gray-400">Liquid Cash</p>
               <span className="text-[14px] font-medium tracking-tight text-gray-700">
                  <HiddenValue isHidden={isHidden} bulletCount={4}>{formatCurrency(personalBalance)}</HiddenValue>
               </span>
            </div>
            <p className="text-[10px] text-gray-400">Available for spending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
