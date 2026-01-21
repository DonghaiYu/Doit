const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 导出数据 - 打开保存对话框
  saveFile: (data, defaultFileName) => {
    return ipcRenderer.invoke('save-file', data, defaultFileName);
  },
  
  // 导入数据 - 打开文件选择对话框
  openFile: () => {
    return ipcRenderer.invoke('open-file');
  }
});
