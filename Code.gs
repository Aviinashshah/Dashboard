/**
 * Serves the main index.html file and passes the Web App URL to it.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  // Pass the published URL to the frontend for internal routing if needed
  template.pubUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('The Hunger Gains - Executive')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns an OAuth token for the frontend to use the Drive REST API natively.
 * This is crucial for handling large files without hitting Apps Script execution limits.
 */
function getAuthToken() {
  return ScriptApp.getOAuthToken();
}

/**
 * Scans the target directory for Sales Ledgers (CSV or Excel).
 * Supports both standard My Drive and Shared Drives.
 * * @param {string} folderId - The Google Drive Folder ID
 * @returns {Array} Array of file metadata objects
 */
function getFilesList(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const fileList = [];
    
    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      const name = file.getName();
      
      // Filter strictly for CSV or Excel files
      if (mimeType === MimeType.CSV || 
          mimeType === MimeType.MICROSOFT_EXCEL ||
          mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          name.toLowerCase().endsWith('.csv') || 
          name.toLowerCase().endsWith('.xlsx')) {
        
        fileList.push({
          id: file.getId(),
          name: name,
          updated: file.getLastUpdated().getTime(),
          type: name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
          size: file.getSize()
        });
      }
    }
    
    // Sort by last updated, newest first
    return fileList.sort((a, b) => b.updated - a.updated);
    
  } catch (e) {
    console.error("Error fetching files from folder " + folderId + ": " + e.toString());
    throw new Error("Cannot access folder. Check permissions or ensure the folder ID is correct.");
  }
}

/**
 * Legacy backend check for the Global Cache file.
 * (The frontend now primarily uses the native REST API to bypass Shared Drive limitations, 
 * but this acts as a safe fallback/support function).
 * * @param {string} folderId - The Google Drive Folder ID
 * @param {string} fileName - The name of the cache file
 * @returns {Object} {exists: boolean, id: string, updated: number}
 */
function checkGlobalCacheExists(folderId, fileName) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    
    if (files.hasNext()) {
      const file = files.next();
      return {
        exists: true,
        id: file.getId(),
        updated: file.getLastUpdated().getTime()
      };
    }
  } catch (e) {
    console.error("Error checking cache: " + e.toString());
  }
  return { exists: false, id: null };
}
