import React, { useState } from "react";
import { X, Search, Upload, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";

interface WorkspaceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceSettings({ isOpen, onClose }: WorkspaceSettingsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/20" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="w-[720px] bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="h2-20 text-[var(--color-text-strong)] font-semibold">
            워크스페이스 설정
          </h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="p-2"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="staff" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-6 grid w-full grid-cols-4">
              <TabsTrigger value="staff">직원</TabsTrigger>
              <TabsTrigger value="clients">거래처</TabsTrigger>
              <TabsTrigger value="inventory">재고</TabsTrigger>
              <TabsTrigger value="permissions">권한</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="staff" className="space-y-4">
                <StaffTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              </TabsContent>
              
              <TabsContent value="clients" className="space-y-4">
                <ClientsTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-4">
                <InventoryTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4">
                <PermissionsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
      <Input
        placeholder="검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 h-9 bg-[var(--color-surface)] border-[var(--color-border)]"
      />
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Upload size={16} />
        CSV 가져오기
      </Button>
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Download size={16} />
        템플릿 다운로드
      </Button>
    </div>
  );
}

function StaffTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  const staff = [
    { id: 1, name: "김철수", department: "영업팀", position: "팀장", email: "kim@company.com", phone: "010-1234-5678" },
    { id: 2, name: "이영희", department: "기술팀", position: "선임", email: "lee@company.com", phone: "010-2345-6789" },
    { id: 3, name: "박민수", department: "관리팀", position: "대리", email: "park@company.com", phone: "010-3456-7890" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <ActionButtons />
      </div>
      
      <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--color-surface-2)]">
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>연락처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id} className="hover:bg-[var(--color-surface-2)]">
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.department}</TableCell>
                <TableCell>{person.position}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{person.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ClientsTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  const clients = [
    { id: 1, name: "A사", type: "제조업", contact: "홍길동", email: "hong@a-company.com", phone: "02-1234-5678" },
    { id: 2, name: "B사", type: "유통업", contact: "김영수", email: "kim@b-company.com", phone: "02-2345-6789" },
    { id: 3, name: "C사", type: "서비스업", contact: "이민정", email: "lee@c-company.com", phone: "02-3456-7890" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <ActionButtons />
      </div>
      
      <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--color-surface-2)]">
            <TableRow>
              <TableHead>회사명</TableHead>
              <TableHead>업종</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>연락처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-[var(--color-surface-2)]">
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.type}</TableCell>
                <TableCell>{client.contact}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function InventoryTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  const inventory = [
    { id: 1, name: "부품 A", category: "기계부품", stock: 150, unit: "개", supplier: "공급업체1" },
    { id: 2, name: "부품 B", category: "전자부품", stock: 200, unit: "개", supplier: "공급업체2" },
    { id: 3, name: "자재 C", category: "원자재", stock: 50, unit: "kg", supplier: "공급업체3" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <ActionButtons />
      </div>
      
      <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--color-surface-2)]">
            <TableRow>
              <TableHead>품목명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>재고량</TableHead>
              <TableHead>단위</TableHead>
              <TableHead>공급업체</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id} className="hover:bg-[var(--color-surface-2)]">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.supplier}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PermissionsTab() {
  const roles = [
    {
      name: "관리자",
      description: "모든 기능에 대한 전체 액세스 권한",
      permissions: {
        aiManager: true,
        quotes: true,
        erp: true,
        schedule: true,
        email: true,
        blueprints: true,
      }
    },
    {
      name: "일반 사용자",
      description: "기본적인 업무 기능 사용 권한",
      permissions: {
        aiManager: true,
        quotes: true,
        erp: false,
        schedule: true,
        email: true,
        blueprints: false,
      }
    },
    {
      name: "뷰어",
      description: "읽기 전용 권한",
      permissions: {
        aiManager: false,
        quotes: false,
        erp: false,
        schedule: true,
        email: false,
        blueprints: false,
      }
    }
  ];

  return (
    <div className="space-y-6">
      {roles.map((role, index) => (
        <div key={index} className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="body-16 font-medium text-[var(--color-text-strong)]">
                {role.name}
              </h3>
              <p className="body-14 text-[var(--color-text-subtle)]">
                {role.description}
              </p>
            </div>
            <Badge variant="outline">
              {Object.values(role.permissions).filter(Boolean).length}개 권한
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="body-14">업무 AI매니저</span>
              <Switch checked={role.permissions.aiManager} />
            </div>
            <div className="flex items-center justify-between">
              <span className="body-14">견적</span>
              <Switch checked={role.permissions.quotes} />
            </div>
            <div className="flex items-center justify-between">
              <span className="body-14">ERP</span>
              <Switch checked={role.permissions.erp} />
            </div>
            <div className="flex items-center justify-between">
              <span className="body-14">스케쥴</span>
              <Switch checked={role.permissions.schedule} />
            </div>
            <div className="flex items-center justify-between">
              <span className="body-14">이메일</span>
              <Switch checked={role.permissions.email} />
            </div>
            <div className="flex items-center justify-between">
              <span className="body-14">도면</span>
              <Switch checked={role.permissions.blueprints} />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button size="sm" variant="outline">
              변경사항 저장
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}