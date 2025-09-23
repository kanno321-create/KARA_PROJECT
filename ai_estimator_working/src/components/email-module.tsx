import React, { useState } from "react";
import {
  Mail, Plus, Users2, Building2, MapPin, Phone, Clock,
  CheckCircle, Upload, Save, Send, Filter, Download, Eye, Copy, Share
} from "lucide-react";

interface EmailModuleProps {
  tabData: any;
  updateTabData: (tabId: string, data: any) => void;
  activeTabId: string;
}

export function EmailModule({ tabData, updateTabData, activeTabId }: EmailModuleProps) {
  const [groups, setGroups] = useState(tabData.groups || []);
  const [emails, setEmails] = useState(tabData.emails || []);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [currentView, setCurrentView] = useState<'inbox' | 'sent' | 'compose' | 'groups'>('groups');
  const [emailFilter, setEmailFilter] = useState('');

  const addGroup = (group: any) => {
    const newGroup = {
      ...group,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      memberCount: group.members?.length || 0
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    updateTabData(activeTabId, { groups: newGroups, emails });
  };

  const addEmail = (email: any) => {
    const newEmail = {
      ...email,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    const newEmails = [...emails, newEmail];
    setEmails(newEmails);
    updateTabData(activeTabId, { groups, emails: newEmails });
  };

  const getGroupByDomain = (email: string) => {
    const domain = email.split('@')[1];
    return groups.find(g => g.domain === domain);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Email Header */}
      <div className="border-b p-4 bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">이메일 관리</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('groups')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'groups' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                그룹관리
              </button>
              <button
                onClick={() => setCurrentView('compose')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'compose' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                메일작성
              </button>
              <button
                onClick={() => setCurrentView('sent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'sent' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                보낸편지함
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="이메일 검색..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {currentView === 'groups' && (
              <button
                onClick={() => setShowGroupForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                새 그룹
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users2 size={16} />
            <span>총 {groups.length}개 그룹</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>총 {emails.length}개 메일</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>활성 상태</span>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 p-4 overflow-auto">
        {currentView === 'groups' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group: any) => (
                <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {group.memberCount}명
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{group.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{group.description || '설명 없음'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>마지막 사용: {new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedGroup(group.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      멤버 보기
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      편집
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Group Card */}
              <button
                onClick={() => setShowGroupForm(true)}
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 hover:bg-green-50 transition-colors text-center"
              >
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">새 그룹 추가</h3>
                <p className="text-sm text-gray-500 mt-1">도메인별로 이메일 그룹을 관리하세요</p>
              </button>
            </div>
          </div>
        )}

        {currentView === 'compose' && (
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addEmail({
                to: formData.get('to'),
                subject: formData.get('subject'),
                content: formData.get('content'),
                group: getGroupByDomain(formData.get('to') as string)?.name || '미분류'
              });
              (e.target as HTMLFormElement).reset();
            }}>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">받는 사람</label>
                  <input
                    name="to"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    name="subject"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="메일 제목을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    name="content"
                    required
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="메일 내용을 입력하세요"
                  />
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Upload size={16} />
                      첨부파일
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Save size={16} />
                      임시저장
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send size={16} />
                    보내기
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {currentView === 'sent' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">보낸 메일 ({emails.length}개)</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <Filter size={16} />
                  필터
                </button>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <Download size={16} />
                  내보내기
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg divide-y">
              {emails.map((email: any) => (
                <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-800">{email.to}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {email.group}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(email.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">{email.subject}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{email.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                      <Eye size={14} />
                      보기
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                      <Copy size={14} />
                      복사
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                      <Share size={14} />
                      공유
                    </button>
                  </div>
                </div>
              ))}
              {emails.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>보낸 메일이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">새 그룹 추가</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addGroup({
                name: formData.get('name'),
                domain: formData.get('domain'),
                description: formData.get('description'),
                members: []
              });
              setShowGroupForm(false);
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  placeholder="그룹 이름"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="domain"
                  type="text"
                  placeholder="도메인 (예: company.com)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <textarea
                  name="description"
                  placeholder="그룹 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGroupForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}