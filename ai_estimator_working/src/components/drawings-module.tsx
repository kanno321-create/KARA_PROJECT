import React, { useState } from "react";
import {
  Image, Upload, Grid, List, Filter, Download, Eye, CheckCircle,
  AlertCircle, Archive, Plus, X, File, FileText, Clock, Copy, Share
} from "lucide-react";

interface DrawingsModuleProps {
  tabData: any;
  updateTabData: (tabId: string, data: any) => void;
  activeTabId: string;
}

export function DrawingsModule({ tabData, updateTabData, activeTabId }: DrawingsModuleProps) {
  const [files, setFiles] = useState(tabData.files || []);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'version'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUpload, setShowUpload] = useState(false);

  const addFile = (file: any) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
      version: '1.0',
      status: 'active',
      downloadCount: 0,
      lastViewed: null
    };
    const newFiles = [...files, newFile];
    setFiles(newFiles);
    updateTabData(activeTabId, { files: newFiles });
  };

  const updateFileStatus = (fileId: string, status: 'active' | 'archived' | 'approved' | 'rejected') => {
    const newFiles = files.map((f: any) =>
      f.id === fileId
        ? { ...f, status, lastModified: new Date().toISOString() }
        : f
    );
    setFiles(newFiles);
    updateTabData(activeTabId, { files: newFiles });
  };

  const filteredFiles = files.filter((file: any) =>
    file.name.toLowerCase().includes(filter.toLowerCase()) ||
    file.category?.toLowerCase().includes(filter.toLowerCase()) ||
    file.tags?.some((tag: string) => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  const sortedFiles = [...filteredFiles].sort((a: any, b: any) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'date':
        aVal = new Date(a.uploadedAt).getTime();
        bVal = new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        aVal = a.size || 0;
        bVal = b.size || 0;
        break;
      case 'version':
        aVal = parseFloat(a.version || '1.0');
        bVal = parseFloat(b.version || '1.0');
        break;
      default:
        aVal = a.uploadedAt;
        bVal = b.uploadedAt;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'dwg':
      case 'dxf':
      case 'autocad':
        return <Image className="w-8 h-8 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-8 h-8 text-green-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '반려됨';
      case 'archived':
        return '보관중';
      default:
        return '활성';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Drawings Header */}
      <div className="border-b p-4 bg-gradient-to-r from-purple-50 to-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">도면 관리</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="도면 검색..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date-desc">최신순</option>
              <option value="date-asc">오래된순</option>
              <option value="name-asc">이름순</option>
              <option value="name-desc">이름 역순</option>
              <option value="size-desc">크기 큰순</option>
              <option value="size-asc">크기 작은순</option>
              <option value="version-desc">버전 높은순</option>
            </select>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Upload size={16} />
              도면 업로드
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Image size={16} />
            <span>총 {files.length}개 파일</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{files.filter((f: any) => f.status === 'approved').length}개 승인</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{files.filter((f: any) => f.status === 'active').length}개 대기</span>
          </div>
          <div className="flex items-center gap-2">
            <Archive size={16} />
            <span>{files.filter((f: any) => f.status === 'archived').length}개 보관</span>
          </div>
        </div>
      </div>

      {/* Drawings Content */}
      <div className="flex-1 p-4 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiles.map((file: any) => (
              <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.name)}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(file.status)}`}>
                      {getStatusText(file.status)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Eye size={14} />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2" title={file.name}>
                  {file.name}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>버전:</span>
                    <span className="font-medium">{file.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>크기:</span>
                    <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>업로드:</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {file.tags && file.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {file.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {file.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{file.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {file.status === 'active' && (
                    <>
                      <button
                        onClick={() => updateFileStatus(file.id, 'approved')}
                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateFileStatus(file.id, 'rejected')}
                        className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        반려
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => updateFileStatus(file.id, 'archived')}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                  >
                    보관
                  </button>
                </div>
              </div>
            ))}

            {/* Upload Card */}
            <button
              onClick={() => setShowUpload(true)}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-colors text-center min-h-[200px] flex flex-col items-center justify-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">도면 업로드</h3>
              <p className="text-sm text-gray-500 mt-1">새 도면 파일을 추가하세요</p>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">파일명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">버전</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">크기</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">업로드일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedFiles.map((file: any) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          {file.description && (
                            <div className="text-sm text-gray-500">{file.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(file.status)}`}>
                        {getStatusText(file.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{file.version}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedFile(file)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          <Download size={16} />
                        </button>
                        {file.status === 'active' && (
                          <>
                            <button
                              onClick={() => updateFileStatus(file.id, 'approved')}
                              className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => updateFileStatus(file.id, 'rejected')}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => updateFileStatus(file.id, 'archived')}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Archive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedFiles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>도면 파일이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-full">
            <h3 className="text-lg font-semibold mb-4">도면 업로드</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addFile({
                name: formData.get('name'),
                category: formData.get('category'),
                description: formData.get('description'),
                tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
                size: Math.floor(Math.random() * 10000000) + 1000000 // 시뮬레이션
              });
              setShowUpload(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">파일명</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="도면 파일명.dwg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="floor-plan">평면도</option>
                    <option value="elevation">입면도</option>
                    <option value="section">단면도</option>
                    <option value="detail">상세도</option>
                    <option value="electrical">전기도면</option>
                    <option value="mechanical">기계도면</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="도면에 대한 설명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태그 (쉼표로 구분)</label>
                  <input
                    name="tags"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="건축, 전기, 기계, 내부도면"
                  />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">파일을 드래그하거나 클릭하여 업로드하세요</p>
                  <p className="text-xs text-gray-500 mt-1">지원 형식: DWG, DXF, PDF, JPG, PNG (10MB 이하)</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[700px] max-w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">도면 상세 정보</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getFileIcon(selectedFile.name)}
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedFile.name}</h4>
                  <p className="text-gray-600">{selectedFile.description || '설명 없음'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFile.status)}`}>
                  {getStatusText(selectedFile.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">버전:</span>
                  <span className="ml-2">{selectedFile.version}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">크기:</span>
                  <span className="ml-2">{selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">업로드 일시:</span>
                  <span className="ml-2">{new Date(selectedFile.uploadedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">다운로드 횟수:</span>
                  <span className="ml-2">{selectedFile.downloadCount}회</span>
                </div>
              </div>

              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">태그:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedFile.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 미리보기 영역 */}
              <div className="border-2 border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">도면 미리보기</p>
                <p className="text-sm text-gray-500 mt-1">실제 구현에서는 도면 이미지가 여기에 표시됩니다</p>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={16} />
                  다운로드
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Copy size={16} />
                  복사
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share size={16} />
                  공유
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock size={16} />
                  버전 내역
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}