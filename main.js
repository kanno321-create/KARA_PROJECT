const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

// 전역 참조로 가비지 컬렉션 방지
let mainWindow = null;
let popupWindows = new Map(); // 독립 창들 관리

// 개발 모드 체크
const isDev = process.argv.includes('--dev');

function createMainWindow() {
    // 메인 창 상태 관리
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1400,
        defaultHeight: 900
    });

    // 메인 창 생성
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 1200,
        minHeight: 800,
        title: 'KIS CORE V2 - 분전반 견적 시스템',
        icon: path.join(__dirname, 'assets', 'icon.ico'), // 아이콘 있으면 추가
        frame: true,
        movable: true,
        resizable: true,
        show: false, // ready-to-show에서 표시
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            nativeWindowOpen: true
        }
    });

    // 상태 관리
    mainWindowState.manage(mainWindow);

    // 메인 HTML 로드
    const indexPath = isDev
        ? path.join(__dirname, 'ui', 'ai-manager-integrated.html')
        : path.join(__dirname, 'dist', 'index.html');

    mainWindow.loadFile(indexPath);

    // 깜빡임 방지
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // 창 닫힘 이벤트
    mainWindow.on('closed', () => {
        mainWindow = null;
        // 모든 팝업 창들도 닫기
        popupWindows.forEach(popup => {
            if (popup && !popup.isDestroyed()) {
                popup.close();
            }
        });
        popupWindows.clear();
    });
}

// 독립 창 생성 함수 (핵심: parent 없음, modal: false)
function createIndependentWindow(options = {}) {
    const {
        width = 450,
        height = 700,
        x = 100,
        y = 100,
        url = '',
        windowId = Date.now().toString(),
        alwaysOnTop = false,
        skipTaskbar = false
    } = options;

    // 창 상태 복원
    let windowState = windowStateKeeper({
        defaultWidth: width,
        defaultHeight: height,
        file: `window-state-${windowId}.json`
    });

    const popup = new BrowserWindow({
        x: windowState.x || x,
        y: windowState.y || y,
        width: windowState.width || width,
        height: windowState.height || height,
        minWidth: 300,
        minHeight: 400,
        // 핵심: 독립 창 설정
        parent: null, // 절대 parent 설정하지 않음
        modal: false,
        frame: true,
        movable: true,
        resizable: true,
        alwaysOnTop: alwaysOnTop,
        skipTaskbar: skipTaskbar,
        show: false,
        title: 'AI 견적 상담',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            nativeWindowOpen: true
        }
    });

    // 상태 관리
    windowState.manage(popup);

    // 항상 위 설정 (Windows 최강 레벨)
    if (alwaysOnTop && process.platform === 'win32') {
        popup.setAlwaysOnTop(true, 'screen-saver');
    } else if (alwaysOnTop) {
        popup.setAlwaysOnTop(true, 'floating');
    }

    // Mac에서 모든 워크스페이스에 표시
    if (process.platform === 'darwin') {
        popup.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    // URL 로드
    if (url) {
        if (url.startsWith('file://') || url.startsWith('http')) {
            popup.loadURL(url);
        } else {
            popup.loadFile(url);
        }
    }

    // 깜빡임 방지 + 포커스
    popup.once('ready-to-show', () => {
        popup.show();
        popup.focus();
    });

    // 창 관리
    popupWindows.set(windowId, popup);

    popup.on('closed', () => {
        popupWindows.delete(windowId);
    });

    return { popup, windowId };
}

// IPC 핸들러들
ipcMain.handle('open-ai-chat', async (event, options = {}) => {
    try {
        const chatPath = path.join(__dirname, 'ui', 'ai-chat-window.html');

        const result = createIndependentWindow({
            width: 450,
            height: 700,
            url: chatPath,
            windowId: 'ai-chat-' + Date.now(),
            alwaysOnTop: options.alwaysOnTop || false,
            skipTaskbar: options.skipTaskbar || false,
            ...options
        });

        return { success: true, windowId: result.windowId };
    } catch (error) {
        console.error('AI 채팅창 생성 실패:', error);
        return { success: false, error: error.message };
    }
});

// 멀티 모니터 정보 제공
ipcMain.handle('get-displays', async () => {
    const displays = screen.getAllDisplays();
    return displays.map(display => ({
        id: display.id,
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        primary: display.primary
    }));
});

// 창 위치 조정
ipcMain.handle('set-window-position', async (event, windowId, bounds) => {
    const popup = popupWindows.get(windowId);
    if (popup && !popup.isDestroyed()) {
        popup.setBounds(bounds);
        return { success: true };
    }
    return { success: false, error: 'Window not found' };
});

// 앱 이벤트들
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 보안: 새 창 생성 제어
app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // 허용된 URL만 새 창으로 열기
        if (url.startsWith('file://') || url.includes('localhost')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    frame: true,
                    resizable: true,
                    movable: true,
                    parent: null, // 독립 창
                    modal: false,
                    webPreferences: {
                        contextIsolation: true,
                        nodeIntegration: false,
                        preload: path.join(__dirname, 'preload.js')
                    }
                }
            };
        }
        return { action: 'deny' };
    });
});

// 개발 도구 (선택사항)
if (isDev) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
            hardResetMethod: 'exit'
        });
    } catch (e) {
        console.log('electron-reload not available, skipping...');
    }
}