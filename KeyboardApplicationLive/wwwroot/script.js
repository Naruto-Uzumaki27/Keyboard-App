// script.js 
const Keyboard = {
    elements: {
        main: null,
        keysContainer: null,
        keys: [],
        capsKey: null,
    },
    properties: {
        iscomp: 0,
        current_id: 2, //English,
        ismodified: 0,
        lan_selection_key: [],
        listoflanguages: [],
        value: [],
        compList: [],
        capsLock: false,
        keyboardInputs: null,
        keyLayout: [],
        Language: "English",
        Language_ID: "",
        shift: false,
        altgr: false,
        modified: false,
        dbclicked: false,
        selected: '0',
        jsons: [],
        lang_list: [],
        reinit: 0,
        curr_lang_select: -1
    },
    async onStartup() {
        try {
            const data = await window.chrome.webview.hostObjects.bridge.OnStartUpAsync();
            console.log('onstartup', data);
            if (data) {
                let result = JSON.parse(data);
                this.properties.current_id = result.current_id;
                this.properties.Language = result.current_keyboard_name;
                this.properties.lan_selection_key = result.languages;
                this.properties.listoflanguages = result.list_of_languages;

                if (result.all_keyboards && result.all_keyboards.length > 0) {
                    let keyboardObj = result.all_keyboards;
                    this.properties.lang_list = [];
                    this.properties.jsons = {};

                    keyboardObj.forEach((item) => {
                        this.properties.lang_list.push({
                            keyboard_id: item.keyboard_id,
                            keyboard_name: item.keyboard_name,
                            is_modifiedone: item.is_modified,
                            compList: item.compList
                        });

                        this.properties.jsons[item.keyboard_id] = item.keys;

                        if (item.keyboard_id == result.current_id) {
                            this.properties.ismodified = item.is_modified;
                            this.properties.compList = item.compList;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error during startup:', error);
        }
    },
    async initialize() {
        await this.onStartup();
        this.init();  // Assuming `init()` is a method to create the keyboard layout
        this.properties.reinit = 1;
    },
    init() {
        let keyboard = document.querySelector(".keyboard");
        if (this.properties.reinit == 1 && keyboard) {
            keyboard.remove();
        }
        let that = this;
        // create and setup main element
        this.elements.main = document.createElement("div");
        this.elements.main.classList.add("keyboard", "keyboard--hidden");

        let restore_div = document.createElement("div");
        let restore_btn = document.createElement("button");
        let make_default = document.createElement("button");
        let clear_screen = document.createElement("button");
        let keyboard_name = document.createElement('input');
        keyboard_name.placeholder = 'keyboard name';
        keyboard_name.classList.add("keyboard_name_change_class")
        keyboard_name.id = "keyboard_name_change";

        let delete_keyboard = document.createElement("button");
        restore_div.classList.add("keyboard-actions")
        make_default.textContent = "Make Default";
        make_default.title = "Sets current keyboard as Default";
        make_default.classList.add("restore-action")
        restore_btn.textContent = "Reset";
        restore_btn.title = "Reset current keyboard to default state.";
        restore_btn.classList.add("restore-action")
        delete_keyboard.textContent = "Delete";
        delete_keyboard.title = "Deletes the keyboard.";
        delete_keyboard.classList.add("delete-action")
        delete_keyboard.id = "dodeleteitem";
        clear_screen.textContent = "Clear";
        clear_screen.title = "Clears the Screen.";
        clear_screen.classList.add("clear-screen")

        // Add the event listener to the button
        restore_btn.addEventListener("click", async function () {
            if (confirm("Are you sure you want to reset to default? This action is irreversible!")) {
                try {
                    let keyid = that.properties.current_id;
                    let keyname = that.properties.Language;
                    let complist = that.properties.compList;

                    let result = await window.chrome.webview.hostObjects.bridge.DoRestoreDefaultAsync(that.properties.current_id);
                    console.log("Update successful:", result);

                    await that.onStartup();

                    that.properties.current_id = keyid;
                    that.properties.Language = keyname;
                    that.properties.compList = complist;
                    that.init();
                } catch (error) {
                    console.error("Error updating JSON:", error);
                }
            }
        });

        make_default.addEventListener("click", function () {
            if (confirm("Are you sure you want to set the current keyboard as the default?")) {
                window.chrome.webview.hostObjects.bridge.DoMakeDefaultAsync(that.properties.current_id).then((result) => {
                    console.log("Update successful:", result);
                }).catch((error) => {
                    console.error("Error updating JSON:", error);
                });
                that.initialize();
            }
        });

        delete_keyboard.addEventListener("click", function () {
            if (confirm("Are you sure you want to delete? This action is irreversible!")) {
                window.chrome.webview.hostObjects.bridge.DoDeleteKeyboardAsync(that.properties.current_id).then((result) => {
                    console.log("Update successful:", result);
                }).catch((error) => {
                    console.error("Error updating JSON:", error);
                });
                that.initialize();
            }
        });

        // Common function to handle renaming the keyboard
        async function handleKeyboardRename(newKeyboardName) {
            const keyboardId = that.properties.current_id;
            let complist = that.properties.compList;

            if (!newKeyboardName) {
                alert("Enter valid keyboard name");
                return;
            }
            try {
                // Call the async method to rename the keyboard
                const result = await window.chrome.webview.hostObjects.bridge.DoRenameKeyboardAsync(keyboardId, newKeyboardName);
                if (result == 1) {
                    // Reinitialize
                    await that.onStartup();
                    that.properties.current_id = keyboardId;
                    that.properties.Language = newKeyboardName;
                    that.properties.compList = complist;
                    that.init();
                }
                else if (result == -1)
                    alert("Keyboard name not available.");
                else {
                    alert('Something went wrong.')
                    return;
                }

            } catch (error) {
                console.error("Error renaming keyboard:", error);
            }
        }

        keyboard_name.addEventListener("blur", function () {
            if (this.value.trim()) {  // Check if the input is not empty or just whitespace
                handleKeyboardRename(this.value);
            } else {
                alert("Enter a valid keyboard name");
            }
        });

        keyboard_name.addEventListener("keydown", function (event) {
            if ((event.key === "Enter" || event.key === "Tab") && this.value.trim()) {
                event.preventDefault();
                handleKeyboardRename(this.value);
            } else if ((event.key === "Enter" || event.key === "Tab") && !this.value.trim()) {
                alert("Enter a valid keyboard name");
                event.preventDefault(); // Prevent default behavior to avoid further unnecessary events
            }
        });

        clear_screen.addEventListener("click", function () {
            that.properties.value = "";
            that._updateValueInTarget();
        });

        restore_div.appendChild(keyboard_name);
        if ([1, 2, 3, 4].indexOf(this.properties.current_id) == -1)
            restore_div.appendChild(delete_keyboard);

        restore_div.appendChild(make_default);
        restore_div.appendChild(restore_btn);
        restore_div.appendChild(clear_screen);
        this.elements.main.appendChild(restore_div);
        document.body.appendChild(this.elements.main);

        if ([1, 2, 3, 4].indexOf(this.properties.current_id) != -1) {
            keyboard_name.disabled = true;
            keyboard_name.style.color = 'white';
            keyboard_name.style.border = '1px solid white';
        } else {
            keyboard_name.disabled = false;
            keyboard_name.style.color = 'black';
            keyboard_name.style.border = 'none';
        }

        // create and setup child container component
        this.elements.keysContainer = document.createElement("div");
        this.elements.keysContainer.classList.add("keyboard__keys");
        this.elements.main.appendChild(this.elements.keysContainer);

        // create and setup key elements
        this.elements.keysContainer.appendChild(this._createKeys());
        this.elements.keys = this.elements.keysContainer.querySelectorAll(".keyboard__key");

        // open keyboard for elements with .use-keyboard-input
        this.properties.keyboardInputs =
            document.querySelectorAll(
                ".use-keyboard-input"
            );

        this.properties
            .keyboardInputs
            .forEach((element) => {
                element.addEventListener("focus", () => {
                    this
                        .open(element.value, (currentValue) => {
                            element.value = currentValue;
                        });
                });
            });

        document.getElementById('keyboard_name_change').value = this.properties.Language;
        //this.properties.value = "";
        //this._updateValueInTarget();
    },
    truncateString(str, maxLength = 5) {
        if (str.length <= maxLength) {
            return str;
        } else {
            return str.slice(0, maxLength) + "...";
        }
    },
    getUnicode(C) {
        uString = "";
        return C;
    },
    groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            // Extract the value by the key
            let groupKey = currentValue[key];

            // If the key doesn't exist in the result yet, create it
            if (!result[groupKey]) {
                result[groupKey] = [];
            }

            // Add the current item to the group
            result[groupKey].push(currentValue);

            return result;
        }, {});
    },
    getLangID(language) {
        return this.properties.listoflanguages.indexOf(language);
    },
    async saveFile() {
        try {
            const jsonString = JSON.stringify(this.properties.jsons[this.properties.current_id]);
            //const result = await window.chrome.webview.hostObjects.bridge.DoUpdateJsonAsync(jsonString, this.properties.current_id);
            window.chrome.webview.hostObjects.bridge.DoUpdateJsonAsync(jsonString, this.properties.current_id).then((result) => {
                console.log("Update successful:", result);
            }).catch((error) => {
                console.error("Error updating JSON:", error);
            });

            await this.onStartup();
            this.init();
            this.properties.reinit = 1;
        } catch (error) {
            console.error("Error updating JSON:", error);
        }

        var modified_keys = [];
        const Language = this.properties.Language
        this.properties.lang_list.forEach((item) => {
            if (item.keyboard_name == Language) {
                //console.log(jsons[key].length);
                for (var i = 0; i < jsons[item.keyboard_id].length; i++) {
                    if (jsons[item.keyboard_id][i][0].mod == 1) {
                        modified_keys.push(jsons[item.keyboard_id][i][0]);
                    }
                    if (jsons[item.keyboard_id][i][1].mod == 1) {
                        modified_keys.push(jsons[item.keyboard_id][i][0]);
                    }
                    if (jsons[item.keyboard_id][i][2].mod == 1) {
                        modified_keys.push(jsons[item.keyboard_id][i][0]);
                    }
                }
                //console.log(keyLayout);
            }
        });
        //console.log(modified_keys);
        const groupedBySC = this.groupBy(modified_keys, 'sc');
        //console.log(groupedBySC);
        // Convert the grouped object back to an array (if needed)
        const groupedArray = Object.keys(groupedBySC).map(key => groupedBySC[key]);
        //console.log(groupedArray);
        scancodes = [];
        jsonstring = [];
        index = 0;
        groupedArray.forEach((item) => {
            //console.log(item);
            unicode = ["ffff", "ffff", "ffff", "ffff", "ffff", "ffff",]
            SC = "";
            item.forEach((subitem) => {
                //console.log(subitem);
                if (subitem.app == "None")
                    unicode[0] = this.getUnicode(subitem.char);
                else if (subitem.app == "leftshift")
                    unicode[1] = this.getUnicode(subitem.char);
                else if (subitem.app == "leftaltgr")
                    unicode[2] = this.getUnicode(subitem.char);
                else if (subitem.app == "rightshift")
                    unicode[3] = this.getUnicode(subitem.char);
                else if (subitem.app == "RSLS")
                    unicode[4] = this.getUnicode(subitem.char);
                else if (subitem.app == "CARS")
                    unicode[5] = this.getUnicode(subitem.char);
                SC = subitem.sc;
            });
            //console.log(unicode);
            jsonstring[index] = '{"scanode":"' + SC + '","unicode":' + JSON.stringify(unicode) + '}';
            //console.log(jsonstring[index]);
            //jsonstring = jsonstring+'{"scanode":"'+SC+'","unicode":'+JSON.stringify(unicode)+'},';
            index = index + 1;
        });
        //console.log(jsonstring.toString);
        var data = "";
        var js = JSON.stringify(jsonstring);
        //console.log(js);
        data = '[{"language" :"' + this.properties.listoflanguages.indexOf(this.properties.Language) + '","scancodes":[' + JSON.stringify(jsonstring) + ']},';
        //console.log(data);
        lang_seclec_keys = '{"lan_selection_key":[' + this.properties.lan_selection_key[0] + ',' + this.properties.lan_selection_key[1] + ']}]';
        var data2 = [data, lang_seclec_keys]
        // Create a Blob containing the data
        var blob = new Blob(data2, { type: "text/plain" });

        // Create a URL for the Blob
        var url = window.URL.createObjectURL(blob);

        // Create a link element
        var link = document.createElement("a");
        link.href = url;
        link.download = "ml_keyboard_mdofied_keys_" + new Date().getTime().toString() + ".json";

        // Click the link to trigger the download
        document.body.appendChild(link);
        link.click();

        window.chrome.webview.hostObjects.bridge.DoSaveFileInLocal(data2.toString()).then((result) => {
            console.log("Update successful:", result);
        }).catch((error) => {
            console.error("Error updating JSON:", error);
        });

        // Clean up
        this.properties.modified = false;
        alert("Your changes have been successfully saved.");
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
    _createIconHTML(icon_name) {
        return `<span class="material-icons">${icon_name}</span>`;
    },
    _createKeyBtn(iconName, class1, onclick, class2, count) {
        this.keyElement = document.createElement("button");
        // add common attributes and classes
        this.keyElement.setAttribute("type", "button");
        this.keyElement.classList.add("keyboard__key");
        // add specific listeners and classes
        this.keyElement.classList.add(class1, class2);
        this.keyElement.innerHTML = this._createIconHTML(iconName);
        this.keyElement.addEventListener("click", onclick);
        this.keyElement.setAttribute("count", count);
    },
    createdropdown() {
        this.keyElement = document.createElement('select');
        this.keyElement.classList.add("change-language");

        // Populate the dropdown with options
        this.properties.lang_list.forEach((lang) => {
            let option = document.createElement('option');
            option.value = lang.keyboard_id;
            option.textContent = lang.keyboard_name;
            this.keyElement.appendChild(option);
        });

        this.keyElement.value = this.properties.current_id;
    },
    get_keyLayout(jsons) {
        var normallist = [];
        var shiftlist = [];
        var altgrlist = [];
        for (var i = 0; i < jsons.length; i++) {
            normallist.push(jsons[i][0].char);
            shiftlist.push(jsons[i][1].char);
            altgrlist.push(jsons[i][2].char);
        }
        return { normallist, shiftlist, altgrlist };
    },
    tempsave(index) {
        let jsons = this.properties.jsons;

        let shift = 0;
        if (this.properties.shift) {
            shift = 1;
        }
        else if (this.properties.altgr) {
            shift = 2;
        }
        that = this;
        this.properties.lang_list.forEach((item) => {
            if (item.keyboard_id == this.properties.current_id) {
                jsons[item.keyboard_id][index][shift].modchar = that.properties.keyLayout[index];
                jsons[item.keyboard_id][index][shift].mod = 1;
            }
        });
        this.properties.jsons[this.properties.current_id] = jsons[this.properties.current_id];
        //console.log('json list', jsons[this.properties.current_id]);
    },
    showlanguageselector(pos, lang) {
        //		console.log("Language selector");
        if (this.properties.curr_lang_select != -1)
            return;
        this.properties.curr_lang_select = pos;
        this.properties.dbclicked = true;
        const modal = document.createElement('div');
        modal.classList.add('custom-prompt');

        // Create input fields
        const label1 = document.createElement('label');
        label1.innerHTML = 'Language&nbsp;&nbsp;' + (pos + 1) + ':&nbsp;&nbsp;';
        const dropdown = document.createElement('select');
        for (let l = 0; l < this.properties.listoflanguages.length; l++) {
            var option1 = document.createElement("option");
            option1.value = l;
            option1.textContent = this.properties.listoflanguages[l + 1];
            dropdown.appendChild(option1);
        }
        dropdown.selectedIndex = lang - 1;
        const label2 = document.createElement('label');
        label2.innerHTML = '<br><br>&nbsp;&nbsp;';
        const label3 = document.createElement('label');
        label3.innerHTML = '&nbsp;&nbsp;';

        // Create a submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Ok';
        submitButton.addEventListener('click', () => {
            this.properties.dbclicked = false;
            index = dropdown.selectedIndex;
            pos = this.properties.curr_lang_select;
            this.properties.lan_selection_key[pos] = index + 1;

            window.chrome.webview.hostObjects.bridge.DoUpdateLanguageShortcutAsync(pos, index + 1).then((result) => {
                console.log("Update successful:", result);
            }).catch((error) => {
                console.error("Error updating JSON:", error);
            });
            modal.remove(); // Close the modal
            this.init();
            this.properties.curr_lang_select = -1;
            return index;
        });
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'cancel';
        cancelButton.addEventListener('click', () => {
            this.properties.dbclicked = false;
            this.properties.curr_lang_select = -1;
            modal.remove();
            return;
        });
        // Append input fields and submit button to the modal
        modal.appendChild(label1);
        modal.appendChild(dropdown);
        modal.appendChild(label2);
        modal.appendChild(submitButton);
        modal.appendChild(label3);
        modal.appendChild(cancelButton);
        // Display the modal
        document.body.appendChild(modal);
    },
    _createKeys() {
        const fragment = document.createDocumentFragment();
        let keyLayout = [];
        let shift = 0;
        if (this.properties.shift) {
            shift = 1;
        } else if (this.properties.altgr) {
            shift = 2;
        }
        let current_id = this.properties.current_id;
        jsons = this.properties.jsons;
        that = this;
        this.properties.keyLayout = [];

        this.properties.lang_list.forEach((item) => {
            if (item.keyboard_id == current_id) {
                for (var i = 0; i < jsons[item.keyboard_id].length; i++) {
                    if (this.properties.ismodified == 1 && jsons[item.keyboard_id][i][shift].mod == 1)
                        that.properties.keyLayout.push(jsons[item.keyboard_id][i][shift].modchar);
                    else
                        that.properties.keyLayout.push(jsons[item.keyboard_id][i][shift].char);
                }
            }
        });

        if (that.properties.keyLayout.length == 0) { 
            window.chrome.webview.hostObjects.bridge.DoMakeDefaultAsync(1).then((result) => {
                console.log("Update successful:", result);
            }).catch((error) => {
                console.error("Error updating JSON:", error);
            });
            this.initialize();
        }

        let keycount = 0;
        that.properties.keyLayout.forEach((key) => {
            const insertLineBreak =
                ["br"].indexOf(key) !== -1;
            switch (key) {
                case "br":
                    keycount += 1;
                    break;
                case "ctrl":
                case "alt":
                case "os":
                    keycount += 1;
                    this._createKeyBtn();
                    this.keyElement.textContent = key;
                    break;
                case "comp":
                    keycount += 1;
                    this._createKeyBtn();
                    this.keyElement.textContent = key;
                    this.keyElement.addEventListener(
                        "click",
                        () => {
                            this.properties.value = "";
                            let str = "";
                            if (this.properties.compList && this.properties.compList.length > 0) {
                                this.properties.compList.forEach((item) => {
                                    str += item.compName + " : " + item.compValue + "\n";
                                })
                            }
                            else {
                                str = "No mappings found;";
                            }
                            this.properties.value = str;
                            this.properties.iscomp = 1;
                            this._updateValueInTarget();
                            document.querySelector(".use-keyboard-input").disabled = true;
                        }
                    );

                    //this.keyElement.textContent = key.toLowerCase();
                    break;
                case "Eng":
                    keycount += 1;
                    this._createKeyBtn();
                    this.keyElement.textContent = key;
                    //this.keyElement.textContent = key.toLowerCase();
                    break;
                case "backspace":
                    keycount += 1;
                    this._createKeyBtn(
                        "backspace", "keyboard__key--wide",
                        () => {
                            if (this.properties.iscomp != 0) {
                                this.properties.value = "";
                            }
                            else
                                this.properties.value.pop()
                            this._updateValueInTarget();
                        });
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = "English";
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = this.properties.listoflanguages[this.properties.lan_selection_key[0]];
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.showlanguageselector(0, this.properties.lan_selection_key[0]);
                            }
                        );
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = this.properties.listoflanguages[this.properties.lan_selection_key[1]];
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.showlanguageselector(1, this.properties.lan_selection_key[1]);
                            }
                        );
                    //					fragment.appendChild(this.keyElement);
                    break;
                case "tab":
                    keycount += 1;
                    this._createKeyBtn();
                    this.keyElement.textContent =
                        key.toLowerCase();
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                if (this.properties.iscomp != 0) {
                                    this.properties.value = "\t";
                                }
                                else
                                    this.properties.value+='\t';
                                this._updateValueInTarget();


                            });
                    break;
                case "caps":
                    keycount += 1;
                    this._createKeyBtn(
                        "keyboard_capslock",
                        "keyboard__key--activatable",
                        () => {
                            this.elements.capsKey
                                .classList
                                .toggle("keyboard__key--active");
                            this._toggleCapsLock();
                        },
                        "keyboard__key--wide"
                    );
                    this.elements.capsKey = this.keyElement;
                    break;
                case "shift":
                    keycount += 1;
                    this._createKeyBtn();
                    if (this.properties.shift)
                        this.keyElement.textContent = "SHIFT";
                    else
                        this.keyElement.textContent = "shift";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.properties.shift = !this.properties.shift;
                                if (this.properties.shift && this.properties.altgr) {
                                    alert("shift and altgr cannot be active at the same time");
                                    this.properties.shift = false;
                                } else
                                    this.init();
                            });
                    break;
                case "altGr":
                    this._createKeyBtn();
                    if (this.properties.altgr)
                        this.keyElement.textContent = "ALTGR";
                    else
                        this.keyElement.textContent = "altgr";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.properties.altgr = !this.properties.altgr;
                                if (this.properties.shift && this.properties.altgr) {
                                    alert("shift and altgr cannot be active at the same time");
                                    this.properties.altgr = false;
                                } else
                                    this.init();
                            });
                    break;

                case "enter":
                    keycount += 1;
                    this._createKeyBtn(
                        "keyboard_return", "keyboard__key--wide",
                        () => {
                            if (this.properties.iscomp != 0) {
                                this.properties.value = "\n";
                            }
                            else
                                this.properties.value+="\n";
                            this._updateValueInTarget();
                        });
                    break;

                case "space":
                    this._createKeyBtn(
                        "space_bar", "keyboard__key--extra--wide",
                        () => {
                            this.properties.value+=" ";
                            this._updateValueInTarget();
                        });
                    break;

                case "done":
                    this._createKeyBtn(
                        "check_circle",
                        "keyboard__key--dark",
                    );
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                //alert("done");
                                if (this.properties.modified)
                                    this.saveFile();
                                else
                                    alert("No changes to save");
                            });
                    this.keyElement.title = "Save Keyboard";
                    break;
                case "Languages":
                    this.createdropdown();
                    let that = this;
                    this.keyElement.addEventListener("change", async function () {
                        const that = Keyboard; // Reference to the Keyboard object
                        let selected = that.keyElement.value;

                        if (that.properties.modified) {
                            if (confirm("There are unsaved changes. Continue without saving?") === false) {
                                that.keyElement.value = that.properties.selected;
                                return;
                            } else {
                                await that.onStartup();  // Use 'that' to reference the correct object
                            }
                        }

                        that.properties.modified = false;

                        if (selected != that.properties.current_id) {
                            that.properties.iscomp = 0;
                            that.properties.lang_list.forEach((item) => {
                                if (item.keyboard_id == selected) {
                                    that.properties.current_id = item.keyboard_id;
                                    that.properties.Language = item.keyboard_name;
                                    that.properties.ismodified = item.is_modifiedone;
                                    that.properties.compList = item.compList;
                                    that.properties.shift = false;
                                    that.properties.altgr = false;
                                    that.properties.modified = false;
                                    that.init(); // Use 'that' to ensure correct context
                                }
                            });
                        }
                    });
                    break;
                default:
                    this._createKeyBtn();
                    {
                        if (key === "empty") {
                            this.keyElement.textContent = "";
                            this.keyElement.title = "";
                        }
                        else {
                            this.keyElement.textContent = this.truncateString(key);
                            this.keyElement.title = key;
                        }

                        //key.toLowerCase();
                        this.keyElement
                            .addEventListener(
                                "click",
                                () => {
                                    if (this.properties.dbclicked === true) {
                                        return;
                                    }
                                    if (key != "empty") {
                                        if (this.properties.iscomp != 2)
                                            this.properties.value+=key;
                                        else {
                                            document.querySelector(".use-keyboard-input").disabled = false;
                                            this.properties.value = key;
                                        }
                                        this._updateValueInTarget();
                                    }
                                });
                        function handleDoubleClick(obj, key, count) {
                            if (obj.properties.dbclicked === true) {
                                return;
                            }
                            obj.properties.value = obj.properties.value.slice(0, -2);
                            obj._updateValueInTarget();
                            obj.showCustomPrompt(key, count);
                        };
                        this.keyElement
                            .addEventListener("dblclick", handleDoubleClick.bind(null, this, key, keycount));
                    }
                    keycount += 1;
                    break;
            }


            fragment.appendChild(this.keyElement);

            if (insertLineBreak) {
                fragment
                    .appendChild(document.createElement("br"));
            }
        });
        return fragment;
    },
    _updateValueInTarget() {
        if (this.properties.iscomp == 1) {
            document.querySelector(".use-keyboard-input").disabled = true;
            this.properties.iscomp = 2;
        }
        else {
            document.querySelector(".use-keyboard-input").disabled = false;
            this.properties.iscomp = 0;
        }

        const targetInput = document.querySelector(".use-keyboard-input"); // Replace with specific selector if needed
        if (targetInput) {
            targetInput.value = this.properties.value;
        }
    },
    _toggleCapsLock() {
        this.properties.capsLock =
            !this.properties.capsLock;

        for (let key of this.elements.keys) {
            if (key.childElementCount === 0) {
                key.textContent =
                    this.properties.capsLock
                        ? key.textContent.toUpperCase()
                        : key.textContent.toLowerCase();
            }
        }
    },
    open(initialValue, oninput) {
        this.properties.value =initialValue || "";
        this.elements.main
            .classList
            .remove("keyboard--hidden");
    },
    close() {
        this.properties.value = this.properties.value;
        this.elements.main
            .classList.add("keyboard--hidden");
    },
    showCustomPrompt(obj, count) {
        this.properties.dbclicked = true;
        const modal = document.createElement('div');
        modal.classList.add('custom-prompt');

        // Create input fields
        const label1 = document.createElement('label');
        if (this.properties.shift)
            label1.innerHTML = 'char + shift :&nbsp;&nbsp;';
        else if (this.properties.altgr)
            label1.innerHTML = 'char + altgr :&nbsp;&nbsp;';
        else
            label1.innerHTML = 'char :&nbsp;&nbsp;';
        const label2 = document.createElement('label');
        label2.innerHTML = '<br><br>&nbsp;';
        const label4 = document.createElement('label');
        label4.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
        const input1 = document.createElement('input');
        input1.placeholder = 'Char';

        // Create a submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click', () => {
            this.properties.dbclicked = false;

            // Get the input value and replace all Unicode sequences with their corresponding characters
            const inputValue = input1.value.trim();

            // Use a regular expression to find all \uXXXX sequences and replace them with the corresponding character
            const charValue = inputValue.replace(/\\u[0-9A-Fa-f]{4}/g, (match) => {
                return String.fromCharCode(parseInt(match.slice(2), 16));
            });

            // find the element in the keyLayout.Properties and replace it
            var index = this.properties.keyLayout.indexOf(obj);
            if (~index) {
                this.properties.keyLayout[count] = charValue;
                this.tempsave(count);
                this.properties.ismodified = 1;
                this.properties.modified = true;
            }

            modal.remove(); // Close the modal
            this.init();
            return;
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'cancel';
        cancelButton.addEventListener('click', () => {
            this.properties.dbclicked = false;
            modal.remove();
            return;
        });
        // Append input fields and submit button to the modal
        modal.appendChild(label1)
        modal.appendChild(input1);
        modal.appendChild(label2);
        modal.appendChild(submitButton);
        modal.appendChild(label4)
        modal.appendChild(cancelButton);
        // Display the modal
        document.body.appendChild(modal);
        input1.focus();
    },
};

window.addEventListener("DOMContentLoaded", function () {
    Keyboard.initialize();
});
