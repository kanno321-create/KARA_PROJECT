const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API를 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // AI 채팅창 열기
    openAIChat: async (options = {}) => {
        try {
            return await ipcRenderer.invoke('open-ai-chat', options);
        } catch (error) {
            console.error('AI 채팅창 열기 실패:', error);
            return { success: false, error: error.message };
        }
    },

    // 멀티 모니터 정보 가져오기
    getDisplays: async () => {
        try {
            return await ipcRenderer.invoke('get-displays');
        } catch (error) {
            console.error('디스플레이 정보 가져오기 실패:', error);
            return [];
        }
    },

    // 창 위치 조정
    setWindowPosition: async (windowId, bounds) => {
        try {
            return await ipcRenderer.invoke('set-window-position', windowId, bounds);
        } catch (error) {
            console.error('창 위치 조정 실패:', error);
            return { success: false, error: error.message };
        }
    },

    // 시스템 정보
    platform: process.platform,

    // 이벤트 리스너
    onWindowMessage: (callback) => {
        const handler = (event, message) => callback(message);
        ipcRenderer.on('window-message', handler);
        // 정리 함수 반환
        return () => ipcRenderer.removeListener('window-message', handler);
    },

    // 창 상태 알림
    notifyWindowClosed: (windowId) => {
        try {
            ipcRenderer.send('window-closed', windowId);
        } catch (error) {
            console.error('창 닫힘 알림 실패:', error);
        }
    }
});

// 개발 모드 전용 (선택사항)
if (process.env.NODE_ENV === 'development') {
    contextBridge.exposeInMainWorld('electronDev', {
        openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
        reload: () => ipcRenderer.invoke('reload-window')
    });
}