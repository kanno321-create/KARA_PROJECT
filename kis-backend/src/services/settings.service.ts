import { PrismaClient } from '@prisma/client';
import type { Settings, SettingsUpdate } from '../lib/validators.js';
import { errors } from '../lib/errors.js';
import { config } from '../config.js';

// ============================================
// 설정 서비스 (싱글톤)
// ============================================

export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // 설정 조회 (싱글톤)
  // ========================================

  async getSettings(): Promise<Settings> {
    let settings = await this.prisma.setting.findFirst();

    // 설정이 없으면 기본 설정 생성
    if (!settings) {
      settings = await this.createDefaultSettings();
    }

    return this.toSettings(settings);
  }

  // ========================================
  // 설정 업데이트
  // ========================================

  async updateSettings(data: SettingsUpdate): Promise<Settings> {
    let settings = await this.prisma.setting.findFirst();

    if (!settings) {
      // 설정이 없으면 먼저 생성
      settings = await this.createDefaultSettings();
    }

    // 업데이트 데이터 준비
    const updateData: any = {};

    if (data.defaultBrand) updateData.defaultBrand = data.defaultBrand;
    if (data.defaultForm) updateData.defaultForm = data.defaultForm;
    if (data.defaultLocation) updateData.defaultLocation = data.defaultLocation;
    if (data.defaultMount) updateData.defaultMount = data.defaultMount;

    if (data.rules) {
      const currentRules = settings.rules as any || {};
      updateData.rules = {
        ...currentRules,
        ...data.rules,
      };
    }

    if (data.knowledgeVersion) {
      const currentVersion = settings.knowledgeVersion as any || {};
      updateData.knowledgeVersion = {
        ...currentVersion,
        ...data.knowledgeVersion,
        updated: new Date().toISOString(), // 항상 업데이트 시간 갱신
      };
    }

    const updatedSettings = await this.prisma.setting.update({
      where: { id: settings.id },
      data: updateData,
    });

    return this.toSettings(updatedSettings);
  }

  // ========================================
  // 설정 초기화
  // ========================================

  async resetSettings(): Promise<Settings> {
    // 기존 설정 삭제
    await this.prisma.setting.deleteMany();

    // 기본 설정 재생성
    const settings = await this.createDefaultSettings();

    return this.toSettings(settings);
  }

  // ========================================
  // 설정 내보내기
  // ========================================

  async exportSettings(): Promise<{
    settings: Settings;
    exportedAt: string;
    version: string;
  }> {
    const settings = await this.getSettings();

    return {
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  // ========================================
  // 설정 가져오기
  // ========================================

  async importSettings(importData: {
    settings: Partial<SettingsUpdate>;
    version?: string;
  }): Promise<Settings> {
    // 버전 호환성 검사 (필요시)
    if (importData.version && importData.version !== '1.0') {
      throw errors.invalidInput(
        `지원하지 않는 설정 버전입니다: ${importData.version}`,
        'version'
      );
    }

    // 설정 검증
    this.validateImportedSettings(importData.settings);

    // 설정 업데이트
    return await this.updateSettings(importData.settings);
  }

  // ========================================
  // 규칙 설정 관리
  // ========================================

  async updateRules(rules: Partial<{
    singleBrand: boolean;
    antiPoleMistake: boolean;
    allowMixedBrand: boolean;
    require3Gates: boolean;
    economicByDefault: boolean;
  }>): Promise<Settings> {
    return await this.updateSettings({ rules });
  }

  async getRules(): Promise<{
    singleBrand: boolean;
    antiPoleMistake: boolean;
    allowMixedBrand: boolean;
    require3Gates: boolean;
    economicByDefault: boolean;
  }> {
    const settings = await this.getSettings();
    return settings.rules;
  }

  // ========================================
  // 지식 버전 관리
  // ========================================

  async updateKnowledgeVersion(version: {
    rules?: string;
    tables?: string;
  }): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const currentVersion = currentSettings.knowledgeVersion;

    const newVersion = {
      rules: version.rules || currentVersion.rules,
      tables: version.tables || currentVersion.tables,
      updated: new Date().toISOString(),
    };

    return await this.updateSettings({ knowledgeVersion: newVersion });
  }

  async getKnowledgeVersion(): Promise<{
    rules: string;
    tables: string;
    updated: string;
  }> {
    const settings = await this.getSettings();
    return settings.knowledgeVersion;
  }

  // ========================================
  // 기본값 관리
  // ========================================

  async updateDefaults(defaults: {
    defaultBrand?: 'SANGDO' | 'LS' | 'MIXED';
    defaultForm?: 'ECONOMIC' | 'STANDARD';
    defaultLocation?: 'INDOOR' | 'OUTDOOR';
    defaultMount?: 'FLUSH' | 'SURFACE';
  }): Promise<Settings> {
    return await this.updateSettings(defaults);
  }

  async getDefaults(): Promise<{
    defaultBrand: string;
    defaultForm: string;
    defaultLocation: string;
    defaultMount: string;
  }> {
    const settings = await this.getSettings();
    return {
      defaultBrand: settings.defaultBrand,
      defaultForm: settings.defaultForm,
      defaultLocation: settings.defaultLocation,
      defaultMount: settings.defaultMount,
    };
  }

  // ========================================
  // 설정 검증
  // ========================================

  private validateImportedSettings(settings: Partial<SettingsUpdate>): void {
    // 브랜드 검증
    if (settings.defaultBrand && !['SANGDO', 'LS', 'MIXED'].includes(settings.defaultBrand)) {
      throw errors.invalidInput(
        `잘못된 기본 브랜드: ${settings.defaultBrand}`,
        'defaultBrand'
      );
    }

    // 형태 검증
    if (settings.defaultForm && !['ECONOMIC', 'STANDARD'].includes(settings.defaultForm)) {
      throw errors.invalidInput(
        `잘못된 기본 형태: ${settings.defaultForm}`,
        'defaultForm'
      );
    }

    // 위치 검증
    if (settings.defaultLocation && !['INDOOR', 'OUTDOOR'].includes(settings.defaultLocation)) {
      throw errors.invalidInput(
        `잘못된 기본 위치: ${settings.defaultLocation}`,
        'defaultLocation'
      );
    }

    // 설치방식 검증
    if (settings.defaultMount && !['FLUSH', 'SURFACE'].includes(settings.defaultMount)) {
      throw errors.invalidInput(
        `잘못된 기본 설치방식: ${settings.defaultMount}`,
        'defaultMount'
      );
    }

    // 규칙 검증
    if (settings.rules) {
      const validRuleKeys = ['singleBrand', 'antiPoleMistake', 'allowMixedBrand', 'require3Gates', 'economicByDefault'];
      const invalidKeys = Object.keys(settings.rules).filter(key => !validRuleKeys.includes(key));

      if (invalidKeys.length > 0) {
        throw errors.invalidInput(
          `잘못된 규칙 키: ${invalidKeys.join(', ')}`,
          'rules'
        );
      }
    }
  }

  // ========================================
  // 기본 설정 생성
  // ========================================

  private async createDefaultSettings() {
    return await this.prisma.setting.create({
      data: {
        defaultBrand: config.defaults.brand,
        defaultForm: config.defaults.form,
        defaultLocation: config.defaults.location,
        defaultMount: config.defaults.mount,
        rules: {
          singleBrand: true,
          antiPoleMistake: true,
          allowMixedBrand: config.features.allowMixedBrand,
          require3Gates: true,
          economicByDefault: true,
        },
        knowledgeVersion: {
          rules: config.knowledge.rulesVersion,
          tables: config.knowledge.tablesVersion,
          updated: new Date().toISOString(),
        },
      },
    });
  }

  // ========================================
  // 헬퍼 함수
  // ========================================

  private toSettings(settings: any): Settings {
    return {
      id: settings.id,
      defaultBrand: settings.defaultBrand,
      defaultForm: settings.defaultForm,
      defaultLocation: settings.defaultLocation,
      defaultMount: settings.defaultMount,
      rules: settings.rules,
      knowledgeVersion: settings.knowledgeVersion,
    };
  }

  // ========================================
  // 설정 상태 검사
  // ========================================

  async validateSettingsIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const settings = await this.getSettings();

      // 필수 필드 검증
      if (!settings.defaultBrand) issues.push('기본 브랜드가 설정되지 않음');
      if (!settings.defaultForm) issues.push('기본 형태가 설정되지 않음');
      if (!settings.defaultLocation) issues.push('기본 위치가 설정되지 않음');
      if (!settings.defaultMount) issues.push('기본 설치방식이 설정되지 않음');

      // 규칙 검증
      if (!settings.rules) {
        issues.push('규칙이 설정되지 않음');
      } else {
        const requiredRules = ['singleBrand', 'antiPoleMistake', 'allowMixedBrand', 'require3Gates', 'economicByDefault'];
        requiredRules.forEach(rule => {
          if (!(rule in settings.rules)) {
            issues.push(`규칙 '${rule}'이 누락됨`);
          }
        });
      }

      // 지식 버전 검증
      if (!settings.knowledgeVersion) {
        issues.push('지식 버전이 설정되지 않음');
      } else {
        if (!settings.knowledgeVersion.rules) issues.push('규칙 버전이 누락됨');
        if (!settings.knowledgeVersion.tables) issues.push('테이블 버전이 누락됨');
        if (!settings.knowledgeVersion.updated) issues.push('업데이트 시간이 누락됨');
      }

    } catch (error) {
      issues.push(`설정 조회 오류: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}