import React, { useState, useCallback } from "react";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, X
} from "lucide-react";

interface CalendarModuleProps {
  tabData: any;
  updateTabData: (tabId: string, data: any) => void;
  activeTabId: string;
}

export function CalendarModule({ tabData, updateTabData, activeTabId }: CalendarModuleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState(tabData.events || []);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFilter, setEventFilter] = useState('');

  const addEvent = (event: any) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const newEvents = [...events, newEvent];
    setEvents(newEvents);
    updateTabData(activeTabId, { events: newEvents });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">일정 관리</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                월간보기
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                주간보기
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="일정 검색..."
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              새 일정
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-semibold text-gray-800">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">총 {events.length}개 일정</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">활성</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 gap-1 h-full">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={day} className={`p-3 text-center font-semibold ${
                idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {day}
              </div>
            ))}

            {/* 날짜 셀들 */}
            {Array.from({ length: 42 }, (_, i) => {
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6);
              const dayEvents = events.filter((event: any) => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === cellDate.toDateString();
              });

              return (
                <div key={i} className={`border border-gray-200 p-2 min-h-[80px] ${
                  cellDate.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'
                }`}>
                  <div className="font-medium text-sm mb-1">{cellDate.getDate()}</div>
                  {dayEvents.slice(0, 2).map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="text-xs p-1 mb-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2}개 더</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 주간 보기 */}
            <div className="grid grid-cols-8 gap-2">
              <div className="font-semibold text-gray-700">시간</div>
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="font-semibold text-center text-gray-700">{day}</div>
              ))}
            </div>

            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2 border-t border-gray-100">
                <div className="text-sm text-gray-500 p-2">{hour}:00</div>
                {Array.from({ length: 7 }, (_, day) => (
                  <div key={day} className="min-h-[40px] border border-gray-100 p-1 bg-white">
                    {/* 해당 시간대 이벤트 표시 */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">새 일정 추가</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addEvent({
                title: formData.get('title'),
                date: formData.get('date'),
                time: formData.get('time'),
                description: formData.get('description'),
                priority: formData.get('priority')
              });
              setShowEventForm(false);
            }}>
              <div className="space-y-4">
                <input
                  name="title"
                  type="text"
                  placeholder="일정 제목"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="time"
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">일반</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
                <textarea
                  name="description"
                  placeholder="일정 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>{selectedEvent.date}</span>
              </div>
              {selectedEvent.time && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span>{selectedEvent.time}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="text-gray-700">
                  <p className="font-medium mb-1">설명:</p>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedEvent.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  selectedEvent.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedEvent.priority === 'urgent' ? '긴급' :
                   selectedEvent.priority === 'high' ? '높음' : '일반'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}