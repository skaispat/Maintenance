import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle, Clock, Loader } from "lucide-react";
import { fetchAllTasks, fetchAllMaintenanceChecklistItems } from "../services/machineService";

interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  status: "completed" | "pending" | "in-progress";
  type: string;
}

import useAuthStore from '../store/authStore';

const Calendar = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const [allTasksData, checklistItemsData] = await Promise.all([
          fetchAllTasks(),
          fetchAllMaintenanceChecklistItems(),
        ]);

        // Process Repair Tasks
        const repairTasks = allTasksData
          .filter((t: any) => t.type === 'Repair')
          .map((t: any) => ({
            id: t.id,
            title: t.taskTitle || t.type,
            description: t.description || '',
            date: t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt),
            status: t.status,
            type: 'Repair',
            assignedTo: t.assignedTo || t.doer_name // Capture assignedTo
          }));

        // Process Maintenance Tasks (Checklist Items)
        const maintenanceTasks = checklistItemsData.map((item: any) => {
          // Try to extract date from description if possible, otherwise use created_at
          let taskDate = new Date(item.created_at);
          const description = item.description || '';
          const dateMatch = description.match(/(\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch) {
            const [day, month, year] = dateMatch[0].split('/');
            taskDate = new Date(Number(year), Number(month) - 1, Number(day));
          }

          return {
            id: `mt-${item.id}`,
            title: item.task_no || 'Maintenance Task',
            description: item.description || '',
            date: taskDate,
            status: item.status === 'approved' ? 'completed' : (item.status === 'rejected' ? 'pending' : item.status),
            type: 'Maintenance',
            assignedTo: item.maintenance?.assigned_to // Capture assigned_to
          };
        });

        setTasks([...repairTasks, ...maintenanceTasks]);
      } catch (error) {
        console.error("Error loading calendar tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]); // Add user dependency



  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) =>
        task.date.getDate() === date.getDate() &&
        task.date.getMonth() === date.getMonth() &&
        task.date.getFullYear() === date.getFullYear() &&
        (user?.pageAccess === 'Admin' ||
          ((task as any).assignedTo === user?.employeeName || (task as any).assignedTo === user?.username))
    );
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderMonthView = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startingDayOfWeek + 1;
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = isValidDay ? new Date(year, month, dayNumber) : null;
      const dayTasks = date ? getTasksForDate(date) : [];
      const isToday = date && date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={i}
          className={`min-h-20 md:min-h-24 p-1 md:p-2 border flex flex-col transition-all duration-200 relative ${!isValidDay
            ? "bg-gray-50 border-gray-200"
            : isSelected
              ? "bg-primary/5 border-primary shadow-sm z-10"
              : "bg-white hover:bg-gray-50 border-gray-200"
            } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""} cursor-pointer`}
          onClick={() => {
            if (date) {
              setSelectedDate(date);
              setCurrentDate(date);
            }
          }}
        >
          {isValidDay && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs md:text-sm font-semibold ${isToday ? "text-primary" : isSelected ? "text-primary-dark" : "text-gray-900"
                    }`}
                >
                  {dayNumber}
                </span>
                {dayTasks.length > 0 && (
                  <span className="bg-primary text-white text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="space-y-1 hidden md:block">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1.5 rounded truncate ${task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in-progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                      }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium pl-1">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
              {/* Mobile: Show dots for tasks */}
              <div className="md:hidden flex flex-wrap gap-1 mt-auto justify-center pb-1">
                {dayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className={`w-1.5 h-1.5 rounded-full ${task.status === "completed"
                      ? "bg-green-500"
                      : task.status === "in-progress"
                        ? "bg-blue-500"
                        : "bg-orange-500"
                      }`}
                  />
                ))}
                {dayTasks.length > 5 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-700 border-b border-gray-200">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayOffset);
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const dayNumber = date.getDate();

            return (
              <div
                key={dayOffset}
                className={`min-h-20 md:min-h-24 p-1 md:p-2 border flex flex-col transition-all duration-200 relative ${isSelected
                  ? "bg-primary/5 border-primary shadow-sm z-10"
                  : "bg-white hover:bg-gray-50 border-gray-200"
                  } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""} cursor-pointer`}
                onClick={() => {
                  setSelectedDate(date);
                  setCurrentDate(date);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs md:text-sm font-semibold ${isToday ? "text-primary" : isSelected ? "text-primary-dark" : "text-gray-900"
                      }`}
                  >
                    {dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="bg-primary text-white text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1 hidden md:block">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1.5 rounded truncate ${task.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium pl-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
                {/* Mobile: Show dots for tasks */}
                <div className="md:hidden flex flex-wrap gap-1 mt-auto justify-center pb-1">
                  {dayTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className={`w-1.5 h-1.5 rounded-full ${task.status === "completed"
                        ? "bg-green-500"
                        : task.status === "in-progress"
                          ? "bg-blue-500"
                          : "bg-orange-500"
                        }`}
                    />
                  ))}
                  {dayTasks.length > 5 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
          {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </h3>
        {dayTasks.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tasks scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {task.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{task.title}</p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {task.type}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 capitalize">{task.status}</p>
                </div>
                <span
                  className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${task.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : task.status === "in-progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                    }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">View and manage scheduled tasks</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
            <button
              onClick={() => setView("day")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "day"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "week"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "month"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={view === "day" ? previousDay : view === "week" ? previousWeek : previousMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-xl font-bold text-gray-900 text-center">
              {view === "day"
                ? currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
            {currentDate.toDateString() === new Date().toDateString() && (
              <button
                onClick={goToToday}
                className="text-xs font-medium text-primary hover:text-primary px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded-md transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={view === "day" ? nextDay : view === "week" ? nextWeek : nextMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Selected Date Details - Mobile Friendly */}
        {selectedDate && (view === "month" || view === "week") && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">
              Tasks for {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h3>
            {getTasksForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No tasks scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {getTasksForDate(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : task.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base truncate">{task.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {task.type}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    </div>
                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${task.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {view === "month" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-700 border-b border-gray-200">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">{renderMonthView()}</div>
          </div>
        )}

        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}



      </div>
    </div>
  );
};

export default Calendar;