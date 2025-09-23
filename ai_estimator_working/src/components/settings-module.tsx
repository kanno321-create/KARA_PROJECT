import React, { useState } from "react";
import {
  Settings, CheckCircle, AlertCircle, Database, Archive, Star,
  Save, RotateCcw, Clock
} from "lucide-react";

interface SettingsModuleProps {
  tabData: any;
  updateTabData: (tabId: string, data: any) => void;
  activeTabId: string;
  erpState: any;
  setErpState: (value: any) => void;
}

export function SettingsModule({ tabData, updateTabData, activeTabId, erpState, setErpState }: SettingsModuleProps) {
  const [currentSection, setCurrentSection] = useState<'defaults' | 'rules' | 'knowledge'>('defaults');
  const [settings, setSettings] = useState(erpState.settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateDefaults = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateRules = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const validateSettings = () => {
    const errors: Record<string, string> = {};

    if (!settings.defaults.brand) {
      errors.brand = '브랜드는 필수 선택 항목입니다.';
    }

    if (!settings.defaults.form) {
      errors.form = '형식은 필수 선택 항목입니다.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSettings = () => {
    if (!validateSettings()) {
      return;
    }

    setErpState(prev => ({
      ...prev,
      settings: {
        ...settings,
        knowledgeVersion: {
          ...settings.knowledgeVersion,
          updated: new Date().toISOString().split('T')[0]
        }
      }
    }));
    setHasChanges(false);
    setShowSaveConfirm(false);
  };

  const resetToDefaults = () => {
    setSettings({
      defaults: {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        location: 'INDOOR',
        mount: 'FLUSH'
      },
      rules: {
        singleBrand: true,
        antiPoleMistake: true,
        antiDeviceConfuse: true,
        antiInstallMismatch: true
      },
      knowledgeVersion: {
        rules: 'v1.0',
        tables: 'v1.0',
        updated: new Date().toISOString().split('T')[0]
      }
    });
    setHasChanges(true);
    setValidationErrors({});
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Settings Header */}
      <div className="border-b p-4 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">시스템 설정</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentSection('defaults')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSection === 'defaults' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                기본값 설정
              </button>
              <button
                onClick={() => setCurrentSection('rules')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSection === 'rules' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                비즈니스 규칙
              </button>
              <button
                onClick={() => setCurrentSection('knowledge')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSection === 'knowledge' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                지식베이스
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">저장되지 않은 변경사항이 있습니다</span>
              </div>
            )}
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} />
              초기화
            </button>
            <button
              onClick={() => setShowSaveConfirm(true)}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={16} />
              설정 저장
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span>마지막 업데이트: {settings.knowledgeVersion.updated}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>규칙 버전: {settings.knowledgeVersion.rules}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={16} />
            <span>테이블 버전: {settings.knowledgeVersion.tables}</span>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-auto">
        {currentSection === 'defaults' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">기본값 설정</h3>
              <p className="text-gray-600 mb-6">새로운 견적서 작성시 기본으로 적용될 값들을 설정합니다.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 브랜드
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={settings.defaults.brand}
                    onChange={(e) => updateDefaults('brand', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      validationErrors.brand ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">브랜드 선택</option>
                    <option value="SANGDO">상도전기</option>
                    <option value="LS">엘에스산전</option>
                    <option value="EATON">이튼</option>
                    <option value="SIEMENS">지멘스</option>
                    <option value="SCHNEIDER">슈나이더</option>
                  </select>
                  {validationErrors.brand && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.brand}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 형식
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={settings.defaults.form}
                    onChange={(e) => updateDefaults('form', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      validationErrors.form ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">형식 선택</option>
                    <option value="ECONOMIC">에코노믹</option>
                    <option value="STANDARD">스탠다드</option>
                    <option value="PREMIUM">프리미엄</option>
                    <option value="WATERPROOF">방수형</option>
                    <option value="EXPLOSION_PROOF">방폭형</option>
                  </select>
                  {validationErrors.form && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.form}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기본 설치위치</label>
                  <select
                    value={settings.defaults.location}
                    onChange={(e) => updateDefaults('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="INDOOR">실내</option>
                    <option value="OUTDOOR">실외</option>
                    <option value="SEMI_OUTDOOR">반외부</option>
                    <option value="UNDERGROUND">지하</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기본 설치방식</label>
                  <select
                    value={settings.defaults.mount}
                    onChange={(e) => updateDefaults('mount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="FLUSH">매입형</option>
                    <option value="SURFACE">노출형</option>
                    <option value="WALL">벽부형</option>
                    <option value="POLE">폴대형</option>
                    <option value="CABINET">캐비넷형</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">기본값 설정 안내</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      이 설정들은 새로운 견적서 작성시 자동으로 적용되며,
                      사용자가 개별적으로 변경할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'rules' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">비즈니스 규칙 설정</h3>
              <p className="text-gray-600 mb-6">견적서 작성 및 검증 과정에서 적용될 비즈니스 규칙들을 설정합니다.</p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id="singleBrand"
                      checked={settings.rules.singleBrand}
                      onChange={(e) => updateRules('singleBrand', e.target.checked)}
                      className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="singleBrand" className="font-medium text-gray-800">
                        단일 브랜드 제한
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        하나의 견적서에서는 하나의 브랜드만 사용하도록 제한
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    settings.rules.singleBrand ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {settings.rules.singleBrand ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id="antiPoleMistake"
                      checked={settings.rules.antiPoleMistake}
                      onChange={(e) => updateRules('antiPoleMistake', e.target.checked)}
                      className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="antiPoleMistake" className="font-medium text-gray-800">
                        극 오생장 방지
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        전기 극성 오생장을 방지하기 위한 자동 검증 기능
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    settings.rules.antiPoleMistake ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {settings.rules.antiPoleMistake ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id="antiDeviceConfuse"
                      checked={settings.rules.antiDeviceConfuse}
                      onChange={(e) => updateRules('antiDeviceConfuse', e.target.checked)}
                      className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="antiDeviceConfuse" className="font-medium text-gray-800">
                        장비 혼동 방지
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        비슷한 장비 간의 혼동을 방지하기 위한 경고 시스템
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    settings.rules.antiDeviceConfuse ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {settings.rules.antiDeviceConfuse ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id="antiInstallMismatch"
                      checked={settings.rules.antiInstallMismatch}
                      onChange={(e) => updateRules('antiInstallMismatch', e.target.checked)}
                      className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="antiInstallMismatch" className="font-medium text-gray-800">
                        설치 불일치 방지
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        선택된 제품과 설치 방식 간의 불일치를 자동 검증
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    settings.rules.antiInstallMismatch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {settings.rules.antiInstallMismatch ? '활성' : '비활성'}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">비즈니스 규칙 안내</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      이 규칙들은 견적서 작성 및 검증 과정에서 자동으로 적용되어
                      오류를 방지하고 품질을 향상시킵니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'knowledge' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">지식베이스 버전 관리</h3>
              <p className="text-gray-600 mb-6">시스템에서 사용하는 지식베이스와 업무 규칙의 버전 정보를 관리합니다.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-800">규칙 엔진</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현재 버전:</span>
                      <span className="font-medium">{settings.knowledgeVersion.rules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">마지막 업데이트:</span>
                      <span className="font-medium">{settings.knowledgeVersion.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">상태:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        정상
                      </span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    규칙 업데이트 확인
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Archive className="w-8 h-8 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-800">데이터 테이블</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현재 버전:</span>
                      <span className="font-medium">{settings.knowledgeVersion.tables}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">마지막 업데이트:</span>
                      <span className="font-medium">{settings.knowledgeVersion.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">상태:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        정상
                      </span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    데이터 업데이트 확인
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">업데이트 내역</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded border">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">v1.0 - 초기 버전</div>
                        <div className="text-sm text-gray-600">2024-09-20 - 기본 비즈니스 규칙 및 데이터 테이블 초기 설정</div>
                      </div>
                      <span className="text-xs text-gray-500">Current</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-blue-800">v1.1 - 예정</div>
                        <div className="text-sm text-blue-600">2024-10-15 - 향상된 오류 검증 로직 및 새로운 제품 데이터 추가</div>
                      </div>
                      <span className="text-xs text-blue-600">Planned</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">지식베이스 가이드</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      시스템의 지식베이스는 지속적으로 업데이트되며,
                      새로운 업무 규칙과 제품 데이터가 추가되어 정확성을 향상시킵니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold">설정 저장 확인</h3>
            </div>
            <p className="text-gray-600 mb-6">
              변경된 설정을 저장하시겠습니까? 이 설정은 시스템 전체에 영향을 미칩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}