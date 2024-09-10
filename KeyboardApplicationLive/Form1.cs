using KeyBoardApplicationDemo.Models;
using Microsoft.Web.WebView2.Core;
using Microsoft.Win32;
using System.Diagnostics;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;
using KeysMapps = KeyBoardApplicationDemo.Models.Keys;

namespace KeyboardApplicationLive
{
    public partial class Form1 : Form
    {
        private string appDataPath;
        private string logFilePath;
        public Form1()
        {
            InitializeComponent();
            appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KeyboardApp");
            Directory.CreateDirectory(appDataPath);
            logFilePath = Path.Combine(appDataPath, "log.txt");
            this.Load += MainForm_Load;
        }
        private void MainForm_Load(object sender, EventArgs e)
        {
            // Root folder where your application's original files are located
            //string rootFolderPath = Application.StartupPath;

            //// List of directories to copy (e.g., wwwroot, runtimes)
            //string[] directoriesToCopy = { "wwwroot"};

            //// Iterate through each directory and ensure it exists in the appDataPath
            //foreach (var directory in directoriesToCopy)
            //{
            //    if (directory == "ManageFolder")
            //    {
            //        string sourceDirPath = Path.Combine(rootFolderPath, directory);
            //        string targetDirPath = Path.Combine(appDataPath, directory);

            //        // Copy the directory if it does not exist in appDataPath
            //        if (!Directory.Exists(targetDirPath))
            //        {
            //            DirectoryCopy(sourceDirPath, targetDirPath, true);
            //        }
            //    }
            //}

            InitializeWebView2Async().ConfigureAwait(false);

            // Set the form to full screen
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.WindowState = FormWindowState.Maximized;

            // Set WebView2 to fill the form
            webView21.Dock = DockStyle.Fill;

            // Attach the FormClosing event to ensure resources are properly disposed of
            this.FormClosing += Form1_FormClosing;
        }
        private static void DirectoryCopy(string sourceDirPath, string destDirPath, bool copySubDirs)
        {
            DirectoryInfo dir = new DirectoryInfo(sourceDirPath);
            DirectoryInfo[] dirs = dir.GetDirectories();

            // If the destination directory doesn't exist, create it
            if (!Directory.Exists(destDirPath))
            {
                Directory.CreateDirectory(destDirPath);
            }

            // Get the files in the directory and copy them to the new location
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string tempPath = Path.Combine(destDirPath, file.Name);
                file.CopyTo(tempPath, true);
            }

            // If copying subdirectories, copy them and their contents to the new location
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string tempPath = Path.Combine(destDirPath, subdir.Name);
                    DirectoryCopy(subdir.FullName, tempPath, copySubDirs);
                }
            }
        }
        private void Log(string message)
        {
            try
            {
                File.AppendAllText(logFilePath, $"{DateTime.Now}: {message}{Environment.NewLine}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to write to log file: {ex.Message}");
            }
        }
        private async Task InitializeWebView2Async()
        {
            try
            {
                if (webView21.CoreWebView2 != null)
                {
                    webView21.Dispose();
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                    await Task.Delay(500); // 500 milliseconds
                }

                webView21 = new Microsoft.Web.WebView2.WinForms.WebView2
                {
                    Dock = DockStyle.Fill // Ensure proper sizing and docking
                };
                this.Controls.Add(webView21);

                var environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Application.StartupPath, "wwwroot"));
                await webView21.EnsureCoreWebView2Async(environment);

                var temp = Path.Combine(Application.StartupPath, "wwwroot", "index.html");
                webView21.CoreWebView2.Navigate("file:///" + temp);

                // Add the bridge object to the script
                webView21.CoreWebView2.AddHostObjectToScript("bridge", new Bridge());
            }
            catch (Exception ex)
            {
                Log(ex.ToString());
                MessageBox.Show("Failed to initialize WebView2: " + ex.Message);
                this.Close();
            }
        }
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            webView21?.Dispose();
        }

        //private bool IsAdministrator()
        //{
        //    var identity = WindowsIdentity.GetCurrent();
        //    var principal = new WindowsPrincipal(identity);
        //    return principal.IsInRole(WindowsBuiltInRole.Administrator);
        //}
        //private void SetFullControl(string path)
        //{
        //    try
        //    {
        //        DirectoryInfo dirInfo = new DirectoryInfo(path);
        //        DirectorySecurity dirSecurity = dirInfo.GetAccessControl();
        //        var currentUser = WindowsIdentity.GetCurrent().User;

        //        if (currentUser == null) return;

        //        dirSecurity.AddAccessRule(new FileSystemAccessRule(
        //            currentUser,
        //            FileSystemRights.FullControl,
        //            InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
        //            PropagationFlags.None,
        //            AccessControlType.Allow
        //        ));

        //        dirInfo.SetAccessControl(dirSecurity);

        //        // Set a flag in the registry to indicate that full control has been set
        //        SetFullControlFlag();
        //        Log("Full control has been successfully set on the application folder.");
        //    }
        //    catch (Exception ex)
        //    {
        //        Log($"Failed to set full control on the application folder: {ex.Message}");
        //        MessageBox.Show("Failed to set full control on the application folder. The application will now close.");
        //        this.Close();
        //    }
        //}
        //private bool IsFullControlSet()
        //{
        //    const string appName = "KeyboardApplication";  // Replace with your application's name
        //    const string keyName = @"HKEY_CURRENT_USER\Software\" + appName;
        //    const string valueName = "FullControlSet";

        //    // Check if the full control flag is set in the registry
        //    return (int?)Registry.GetValue(keyName, valueName, 0) == 1;
        //}
        //private void SetFullControlFlag()
        //{
        //    const string appName = "KeyboardApplication";  // Replace with your application's name
        //    const string keyName = @"HKEY_CURRENT_USER\Software\" + appName;
        //    const string valueName = "FullControlSet";

        //    // Set the full control flag in the registry
        //    Registry.SetValue(keyName, valueName, 1);
        //}
        //private bool HasFullControl(string folderPath)
        //{
        //    try
        //    {
        //        DirectoryInfo directory = new DirectoryInfo(folderPath);
        //        DirectorySecurity directorySecurity = directory.GetAccessControl();

        //        foreach (FileSystemAccessRule rule in directorySecurity.GetAccessRules(true, true, typeof(System.Security.Principal.NTAccount)))
        //        {
        //            if ((rule.FileSystemRights & FileSystemRights.FullControl) == FileSystemRights.FullControl &&
        //                rule.AccessControlType == AccessControlType.Allow)
        //            {
        //                return true; // Full control granted
        //            }
        //        }

        //        return false; // Full control not granted
        //    }
        //    catch (UnauthorizedAccessException)
        //    {
        //        Log("Access denied while checking full control permissions.");
        //        return false; // Access denied
        //    }
        //    catch (Exception ex)
        //    {
        //        Log($"Exception occurred while checking full control permissions: {ex.Message}");
        //        return false;
        //    }
        //}

        private void Form1_Load(object sender, EventArgs e)
        {
            this.Text = "Keyboard Application";
        }
    }
    public class Bridge
    {
        //private static readonly string appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KeyboardApp");
        private static readonly string appDataPath = Application.StartupPath;
        private readonly string DownloadPath = Path.Combine(appDataPath, "wwwroot", "Downloads");
        private readonly string ApplicationManager = Path.Combine(appDataPath, "wwwroot", "ManageFolder", "ApplicationManage.json");
        private readonly string Keyboards = Path.Combine(appDataPath, "wwwroot", "ManageFolder", "Keyboards.json");
        public string ReadJsonFile(string filePath)
        {
            return File.Exists(filePath) ? File.ReadAllText(filePath) : "{}";
        }
        public void WriteJsonFile(string filePath, string jsonData)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            File.WriteAllText(filePath, jsonData);
        }
        public string OnStartUpAsync()
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);

                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);

                // Validate the JSON strings
                if (string.IsNullOrWhiteSpace(applicationManagerString) || string.IsNullOrWhiteSpace(keyboardsString))
                {
                    // Handle error, maybe log it
                    return "{}";
                }

                if (applicationManagerData != null && keyboardsData != null)
                {
                    var last = keyboardsData.Where(rec => rec.deleteflag == 0 && rec.keyboard_id == applicationManagerData.last_used_keyboard_id).ToList();
                    if (last == null)
                    {
                        applicationManagerData.last_used_keyboard_id = 1;
                        applicationManagerData.keyboard_name = "Template";
                    }

                    var KeyboardsList = new
                    {
                        current_id = applicationManagerData.last_used_keyboard_id,
                        current_keyboard_name = applicationManagerData.keyboard_name,
                        list_of_languages = applicationManagerData.list_of_languages,
                        languages = applicationManagerData.languages,
                        all_keyboards = keyboardsData.Where(rec => rec.deleteflag == 0).ToList()
                    };

                    return JsonSerializer.Serialize(KeyboardsList);
                }
                return string.Empty;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return string.Empty;
            }
        }
        public bool DoUpdateLanguageShortcutAsync(int pos, int newLanguage)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                if (applicationManagerData != null)
                {
                    applicationManagerData.languages[pos] = newLanguage;
                    string updatedApplicationManagerString = JsonSerializer.Serialize(applicationManagerData);
                    WriteJsonFile(ApplicationManager, updatedApplicationManagerString);
                }
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
        public bool DoMakeDefaultAsync(int keyboardId)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);
                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                if (applicationManagerData != null && keyboardsData != null)
                {
                    applicationManagerData.last_used_keyboard_id = keyboardId;
                    applicationManagerData.keyboard_name = keyboardsData.FirstOrDefault(rec => rec.keyboard_id == keyboardId && rec.deleteflag == 0)?.keyboard_name;
                    string updatedApplicationManagerString = JsonSerializer.Serialize(applicationManagerData);
                    WriteJsonFile(ApplicationManager, updatedApplicationManagerString);
                }
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
        public int DoRenameKeyboardAsync(int keyboardId, string? keyboardName)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);

                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);


                if (string.IsNullOrEmpty(keyboardName))
                {
                    return 0;
                }

                if (applicationManagerData != null && keyboardsData != null)
                {
                    var keyboardNames = keyboardsData.Where(rec => rec.deleteflag == 0 && rec.keyboard_id != keyboardId && rec.keyboard_name != null).Select(rec => rec.keyboard_name.ToLower());
                    var keyboardtorename = keyboardsData.FirstOrDefault(rec => rec.keyboard_id == keyboardId);
                    if (keyboardNames.Contains(keyboardName.ToLower()))
                    {
                        return -1;
                    }

                    if (keyboardtorename != null)
                    {
                        if (applicationManagerData.last_used_keyboard_id == keyboardId)
                            applicationManagerData.keyboard_name = keyboardName;
                        keyboardtorename.keyboard_name = keyboardName;
                    }

                    // Serialize the updated data back to JSON strings
                    string updatedApplicationManagerString = JsonSerializer.Serialize(applicationManagerData);
                    string updatedKeyboardsString = JsonSerializer.Serialize(keyboardsData);

                    // Write the updated JSON strings back to the files
                    WriteJsonFile(ApplicationManager, updatedApplicationManagerString);
                    WriteJsonFile(Keyboards, updatedKeyboardsString);
                }
                return 1;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return 0;
            }
        }
        public bool DoDeleteKeyboardAsync(int keyboardId)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);

                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);

                if (applicationManagerData != null && keyboardsData != null)
                {
                    if (applicationManagerData.last_used_keyboard_id == keyboardId)
                    {
                        applicationManagerData.last_used_keyboard_id = 1;
                        applicationManagerData.keyboard_name = keyboardsData.FirstOrDefault(rec => rec.keyboard_id == 1 && rec.deleteflag == 0)?.keyboard_name;
                        string updatedApplicationManagerString = JsonSerializer.Serialize(applicationManagerData);
                        WriteJsonFile(ApplicationManager, updatedApplicationManagerString);
                    }

                    var keyboardToRemove = keyboardsData.FirstOrDefault(rec => rec.keyboard_id == keyboardId);
                    if (keyboardToRemove != null)
                    {
                        keyboardToRemove.deleteflag = 1;
                    }

                    // Serialize the updated data back to JSON strings
                    string updatedKeyboardsString = JsonSerializer.Serialize(keyboardsData);

                    // Write the updated JSON strings back to the files
                    WriteJsonFile(Keyboards, updatedKeyboardsString);
                }
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
        public bool DoRestoreDefaultAsync(int keyboardId)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);

                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);

                if (applicationManagerData != null && keyboardsData != null)
                {
                    foreach (var item in keyboardsData)
                    {
                        if (item.keyboard_id == keyboardId)
                        {
                            foreach (var row in item.keys)
                            {
                                foreach (var key in row)
                                {
                                    key.modchar = "";
                                    key.mod = 0;
                                }
                            }
                            item.is_modified = 0;
                        }
                    }

                    // Serialize the updated data back to JSON strings 
                    string updatedKeyboardsString = JsonSerializer.Serialize(keyboardsData);

                    // Write the updated JSON strings back to the files 
                    WriteJsonFile(Keyboards, updatedKeyboardsString);
                }

                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
        public bool DoUpdateJsonAsync(string json, int keyboardId)
        {
            try
            {
                string applicationManagerString = ReadJsonFile(ApplicationManager);
                string keyboardsString = ReadJsonFile(Keyboards);

                var applicationManagerData = JsonSerializer.Deserialize<ApplicationManagerModel>(applicationManagerString);
                var keyboardsData = JsonSerializer.Deserialize<List<KeyboardsModel>>(keyboardsString);

                if (applicationManagerData != null && keyboardsData != null)
                {
                    var keysData = JsonSerializer.Deserialize<List<List<KeysMapps>>>(json);
                    if (keyboardId != 1)
                    {
                        applicationManagerData.last_used_keyboard_id = keyboardId;
                        applicationManagerData.keyboard_name = keyboardsData.FirstOrDefault(rec => rec.keyboard_id == keyboardId && rec.deleteflag == 0)?.keyboard_name;
                        foreach (var item in keyboardsData)
                        {
                            if (item.keyboard_id == keyboardId)
                            {
                                if (keysData != null)
                                {
                                    item.keys = keysData;
                                    item.is_modified = 1;
                                }
                                else
                                {
                                    item.keys = new List<List<KeysMapps>>();
                                }
                                item.deleteflag = 0;
                            }
                        }
                    }
                    else
                    {
                        var newKeyboard = new KeyboardsModel
                        {
                            keyboard_id = keyboardsData.Count + 1,
                            keyboard_name = "Keyboard-" + (keyboardsData.Count(rec => rec.keyboard_name != null && rec.keyboard_name.Contains("Keyboard-")) + 1).ToString(),
                            deleteflag = 0,
                            is_modified = 0
                        };

                        if (keysData != null)
                        {
                            foreach (var row in keysData)
                            {
                                foreach (var key in row)
                                {
                                    if (key.mod == 1)
                                    {
                                        key.@char = key.modchar;
                                        key.modchar = string.Empty;
                                        key.mod = 0;
                                    }
                                    else
                                    {
                                        key.modchar = string.Empty;
                                    }
                                }
                            }

                            newKeyboard.keys = keysData;
                            keyboardsData.Add(newKeyboard);

                            applicationManagerData.last_used_keyboard_id = newKeyboard.keyboard_id;
                            applicationManagerData.keyboard_name = newKeyboard.keyboard_name;
                        }
                    }

                    // Serialize the updated data back to JSON strings
                    string updatedApplicationManagerString = JsonSerializer.Serialize(applicationManagerData);
                    string updatedKeyboardsString = JsonSerializer.Serialize(keyboardsData);

                    // Write the updated JSON strings back to the files
                    WriteJsonFile(ApplicationManager, updatedApplicationManagerString);
                    WriteJsonFile(Keyboards, updatedKeyboardsString);
                }

                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
        public bool DoSaveFileInLocal(string jsonstring)
        {
            try
            {
                if (!string.IsNullOrEmpty(jsonstring))
                {
                    if (!Directory.Exists(DownloadPath))
                    {
                        Directory.CreateDirectory(DownloadPath);
                    }
                    string filename = "ml_keyboard_mdofied_keys_" + DateTime.Now.ToString("ddMMyyyyHHmmss") + ".json";
                    WriteJsonFile(Path.Combine(DownloadPath, filename), jsonstring);
                }
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception if necessary
                File.AppendAllText(Path.Combine(appDataPath, "error_log.txt"), ex.ToString());
                return false;
            }
        }
    }
}
