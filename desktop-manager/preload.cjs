const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("managerApi", {
  snapshot: () => ipcRenderer.invoke("manager:snapshot"),
  createPost: (payload) => ipcRenderer.invoke("manager:createPost", payload),
  createSnippet: (payload) => ipcRenderer.invoke("manager:createSnippet", payload),
  createProblem: (payload) => ipcRenderer.invoke("manager:createProblem", payload),
  updatePost: (payload) => ipcRenderer.invoke("manager:updatePost", payload),
  updateSnippet: (payload) => ipcRenderer.invoke("manager:updateSnippet", payload),
  updateProblem: (payload) => ipcRenderer.invoke("manager:updateProblem", payload),
  renameTag: (payload) => ipcRenderer.invoke("manager:renameTag", payload),
  openProject: () => ipcRenderer.invoke("manager:openProject"),
  openItem: (item) => ipcRenderer.invoke("manager:openItem", item),
  showInFolder: (item) => ipcRenderer.invoke("manager:showInFolder", item),
  publish: (payload) => ipcRenderer.invoke("manager:publish", payload),
  preview: () => ipcRenderer.invoke("manager:preview"),
  cleanupOpenNext: () => ipcRenderer.invoke("manager:cleanupOpenNext"),
  onLog: (callback) => {
    const listener = (_event, text) => callback(text);
    ipcRenderer.on("manager:log", listener);
    return () => ipcRenderer.removeListener("manager:log", listener);
  },
});
