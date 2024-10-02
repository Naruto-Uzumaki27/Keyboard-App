var mainkeyboard_data = [];
var scriptkeyboard_data = [];

// script.js 
const Keyboard = {
    elements: {
        main: null,
        keysContainer: null,
        keys: [],
        capsKey: null,
    },
    properties: {
        comp_flag: 0,
        current_main_id: 1, //English,
        current_script_id: 1, //English,
        is_modified_keyboard: 0,
        lang_selection_key: [],
        list_of_languages: [],
        display_text: "",
        comp_chars_list: [],
        capslock_flag: false,
        keyboardInputs: null,
        keyLayout: [],
        current_script_name: "English",
        language_id: "",
        shift_flag: false,
        altgr_flag: false,
        is_changed: false,
        dbl_clicked_flag: false,
        selected: '0',
        jsons: [],
        main_list: [],
        script_list: [],
        reinit: 0,
        curr_lang_select: -1,
        first_time : 0
    },
    async onStartup() {
        try {
            const data = await window.chrome.webview.hostObjects.bridge.OnStartUpAsync();
            if (data) {
                let result = JSON.parse(data);
                this.properties.current_main_id = result.main_id;
                this.properties.current_script_id = result.current_id;
                this.properties.current_script_name = result.current_keyboard_name;
                this.properties.lang_selection_key = result.languages;
                this.properties.list_of_languages = result.list_of_languages;
                mainkeyboard_data = result.main_keyboards || [];
                scriptkeyboard_data = result.all_keyboards || [];

                if (mainkeyboard_data && mainkeyboard_data.length > 0 && scriptkeyboard_data && scriptkeyboard_data.length > 0) {
                    this.properties.main_list = [];
                    this.properties.script_list = [];
                    this.properties.jsons = {};
                    this.properties.list_of_languages = [];
                    scriptkeyboard_data.forEach((item) => {
                        this.properties.script_list.push({
                            main_keyboard: item.main_id,
                            keyboard_id: item.keyboard_id,
                            keyboard_name: item.keyboard_name,
                            is_modifiedone: item.is_modified,
                            compList: item.compList
                        });

                        this.properties.list_of_languages.push({
                            keyboard_id: item.keyboard_id,
                            keyboard_name: item.keyboard_name
                        });

                        this.properties.jsons[item.keyboard_id] = item.keys;

                        if (item.keyboard_id == this.properties.current_script_id) {
                            this.properties.is_modified_keyboard = item.is_modified;
                            this.properties.comp_chars_list = item.compList;
                        }
                    });

                    mainkeyboard_data.forEach((item) => {
                        this.properties.main_list.push({
                            mainlang_id: item.main_id,
                            mainlang_name: item.main_keyboard_name
                        });
                    });
                }
                let $mainSelect = $('#mains_changer');
                $mainSelect.html("");
                if (this.properties.main_list && this.properties.main_list.length > 0) {
                    $mainSelect.html("");
                    $.each(this.properties.main_list, function(index, lang) {
                        let option = $('<option></option>').val(lang.mainlang_id).text(lang.mainlang_name);
                        $mainSelect.append(option);
                    });

                    // Set the current selected value or default to the first option
                    if (this.properties.current_main_id) {
                        $mainSelect.val(this.properties.current_main_id);
                    } else {
                        $mainSelect.prop('selectedIndex', 0); 
                    }
                }

                $mainSelect.trigger('change'); // Notify any listeners of the change 
                $('#scripts_changer').val(result.current_id).trigger('change');
            }
        } catch (error) {
            console.error('Error during startup:', error);
        }
    },
    async initialize() {
        await this.onStartup();
        this.init();
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

        let nav_div = document.getElementById('navbarNavDropdown');
        nav_div.innerHTML = "";
        let restore_btn = document.createElement("button");
        let make_default = document.createElement("button");
        let clear_screen = document.createElement("button");

        // Create input for keyboard name
        let keyboard_name = document.createElement('input');
        keyboard_name.placeholder = 'keyboard name';
        keyboard_name.classList.add("keyboard_name_change_class", "form-control"); // Adds Bootstrap class for styling
        keyboard_name.id = "keyboard_name_change";

        // Create delete button
        let delete_keyboard = document.createElement("button");
        delete_keyboard.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
        delete_keyboard.title = "Deletes the keyboard.";
        delete_keyboard.classList.add("delete-action", "btn"); // Adds Bootstrap's 'btn' class
        delete_keyboard.id = "dodeleteitem";

        // Add class to the nav div
        // nav_div.classList.add("keyboard-actions");

        // Setup 'Make Default' button
        make_default.innerHTML = '<i class="fa-regular fa-star"></i> &nbsp;Make Default';
        make_default.title = "Sets current keyboard as Default";
        make_default.classList.add("restore-action", "btn"); // Adds Bootstrap's 'btn' class

        // Setup 'Reset' button
        restore_btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> &nbsp;Reset';
        restore_btn.title = "Reset current keyboard to default state.";
        restore_btn.classList.add("restore-action", "btn"); // Adds Bootstrap's 'btn' class

        // Setup 'Clear Screen' button
        clear_screen.innerHTML = '<i class="fa-solid fa-eraser"></i> &nbsp;Clear';
        clear_screen.title = "Clears the Screen.";
        clear_screen.classList.add("clear-screen", "btn"); // Adds Bootstrap's 'btn' class


        // Add the event listener to the button
        restore_btn.addEventListener("click", async function () {
            if (confirm("Are you sure you want to reset to default? This action is irreversible!")) {
                try {
                    let mainid = that.properties.current_main_id;
                    let keyid = that.properties.current_script_id;

                    let result = await window.chrome.webview.hostObjects.bridge.DoRestoreDefaultAsync(that.properties.current_script_id);
                    await that.onStartup();
                    $('#mains_changer').val(mainid).trigger('change');
                    $('#scripts_changer').val(keyid).trigger('change');
                } catch (error) {
                    console.error("Error updating JSON:", error);
                }
            }
        });

        make_default.addEventListener("click", function () {
            if (confirm("Are you sure you want to set the current keyboard as the default?")) {
                window.chrome.webview.hostObjects.bridge.DoMakeDefaultAsync(that.properties.current_script_id).then((result) => {
                    console.log("Update successful:", result);
                }).catch((error) => {
                    console.error("Error updating JSON:", error);
                });
                that.initialize();
            }
        });

        delete_keyboard.addEventListener("click", function () {
            if (confirm("Are you sure you want to delete? This action is irreversible!")) {
                window.chrome.webview.hostObjects.bridge.DoDeleteKeyboardAsync(that.properties.current_script_id).then((result) => {
                    console.log("Update successful:", result);
                }).catch((error) => {
                    console.error("Error updating JSON:", error);
                });
                that.initialize();
            }
        });

        clear_screen.addEventListener("click", function () {
            that.properties.display_text = "";
            that._updateValueInTarget();
        });

        //if ([1, 2, 3].indexOf(this.properties.current_script_id) != -1)
        //    nav_div.appendChild(delete_keyboard);

        nav_div.appendChild(delete_keyboard);
        nav_div.appendChild(make_default);
        nav_div.appendChild(restore_btn);
        nav_div.appendChild(clear_screen);
        nav_div.appendChild(keyboard_name);

        document.body.appendChild(this.elements.main);

        //if ([1, 2, 3].indexOf(this.properties.current_script_id) != -1) {
        //    keyboard_name.disabled = true;
        //} else {
        //    keyboard_name.disabled = false;
        //}

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

        document.getElementById('keyboard_name_change').value = this.properties.current_script_name;

        $('#keyboard_name_change').off('change').on('change', async function () {
            let newKeyboardName = $(this).val().trim();
            if (newKeyboardName) {  // Check if the input is not empty or just whitespace
                let prev_main_id = that.properties.current_main_id;
                let prev_script_id = that.properties.current_script_id;

                try {
                    const result = await window.chrome.webview.hostObjects.bridge.DoRenameKeyboardAsync(prev_script_id, newKeyboardName);
                    if (result == 1) {
                        await that.onStartup(); 
                        $('#mains_changer').val(prev_main_id).trigger('change');
                        $('#scripts_changer').val(prev_script_id).trigger('change');
                    }
                    else if (result == -1) {
                        alert("Keyboard name not available.");
                        $(this).val(that.properties.current_script_name);
                    }
                    else {
                        alert('Something went wrong.')
                        $(this).val(that.properties.current_script_name);
                    }
                } catch (error) {
                    console.error("Error renaming keyboard:", error);
                }
            } else {
                alert("Enter a valid keyboard name");
                $(this).val(that.properties.current_script_name);
            }
        });
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
        return this.properties.list_of_languages[language];
    },
    async saveFile() {
        try {
            let prev_main = this.properties.current_main_id;
            let prev_script = this.properties.current_script_id;
            const jsonString = JSON.stringify(this.properties.jsons[this.properties.current_script_id]);
            //const result = await window.chrome.webview.hostObjects.bridge.DoUpdateJsonAsync(jsonString, this.properties.current_id);
            window.chrome.webview.hostObjects.bridge.DoUpdateJsonAsync(jsonString, this.properties.current_script_id).then((result) => {
                console.log("Update successful:", result);
            }).catch((error) => {
                console.error("Error updating JSON:", error);
            });

            await this.onStartup();
            $('#mains_changer').val(prev_main).trigger('change');
            $('#scripts_changer').val(prev_script).trigger('change');
            this.properties.reinit = 1;
        } catch (error) {
            console.error("Error updating JSON:", error);
        }
    },
    _createIconHTML(icon_name) {
        if (icon_name == 'check_circle') {
            return '<i class="far fa-save"></i> &nbsp; Save';
        }
        else
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
    createdropdown(that) {
        let main_select = $('#mains_changer');
        main_select.empty();

        if (that.properties.main_list && that.properties.main_list.length > 0) {
            main_select.html("");
            $.each(that.properties.main_list, function(index, lang) {
                let option = $('<option></option>').val(lang.mainlang_id).text(lang.mainlang_name);
                main_select.append(option);
            });

            if (that.properties.current_main_id) {
                main_select.val(that.properties.current_main_id);
            } else {
                main_select.prop('selectedIndex', 0); 
            } 
        } 
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
        if (this.properties.shift_flag) {
            shift = 1;
        }
        else if (this.properties.altgr_flag) {
            shift = 2;
        }
        that = this;
        this.properties.script_list.forEach((item) => {
            if (item.keyboard_id == this.properties.current_script_id) {
                jsons[item.keyboard_id][index][shift].modchar = that.properties.keyLayout[index];
                jsons[item.keyboard_id][index][shift].mod = 1;
            }
        });
        this.properties.jsons[this.properties.current_script_id] = jsons[this.properties.current_script_id];
    },
    showLanguageSelector(pos, lang) {
    if (this.properties.curr_lang_select != -1) return;

    this.properties.curr_lang_select = pos;
    this.properties.dbl_clicked_flag = true;

    // Create the modal using jQuery
    const modal = $('<div class="custom-prompt"></div>');
    const label1 = $('<label></label>').html('Language&nbsp;&nbsp;' + (pos + 1) + ':&nbsp;&nbsp;');
    const dropdown = $('<select class="lang_changer_2"></select>');
    for (let l = 0; l < this.properties.list_of_languages.length; l++) {
        const option1 = $('<option></option>')
            .val(this.properties.list_of_languages[l].keyboard_id)
            .text(this.properties.list_of_languages[l].keyboard_name);
        dropdown.append(option1);
    }
        dropdown.prop('selectedIndex', 0); // Set selected index

        if (lang)
            dropdown.val(lang);
    // Create submit button
    const submitButton = $('<button class="btn restore-action">Ok</button>').on('click', () => {
        this.properties.dbl_clicked_flag = false;
        const index = dropdown.prop('selectedIndex');
        pos = this.properties.curr_lang_select;
        this.properties.lang_selection_key[pos] = index + 1;

        window.chrome.webview.hostObjects.bridge.DoUpdateLanguageShortcutAsync(pos, index + 1)
            .then((result) => {
                console.log("Update successful:", result);
            })
            .catch((error) => {
                console.error("Error updating JSON:", error);
            });

        modal.remove(); // Close the modal
        this.init();
        this.properties.curr_lang_select = -1;
        return index;
    });

    const cancelButton = $('<button class="btn clear-screen">Cancel</button>').on('click', () => {
        this.properties.dbl_clicked_flag = false;
        this.properties.curr_lang_select = -1;
        modal.remove(); // Close the modal
        return;
    });

    // Append elements to modal
    modal.append(label1, dropdown, $('<br>'), submitButton, cancelButton);

    // Display the modal
    $('body').append(modal);
},
    _createKeys() {
        const fragment = document.createDocumentFragment();
        let keyLayout = [];
        let shift = 0;
        if (this.properties.shift_flag) {
            shift = 1;
        } else if (this.properties.altgr_flag) {
            shift = 2;
        }
        let current_id = this.properties.current_script_id;
        jsons = this.properties.jsons;
        that = this;
        this.properties.keyLayout = [];

        this.properties.script_list.forEach((item) => {
            if (item.keyboard_id == current_id) {
                for (var i = 0; i < jsons[item.keyboard_id].length; i++) {
                    if (this.properties.is_modified_keyboard == 1 && jsons[item.keyboard_id][i][shift].mod == 1)
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
            const insertLineBreak = ["br"].indexOf(key) !== -1;
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
                    this.keyElement.addEventListener("click", () => {
                        let that = this;
                        $('#customModal3').modal('show');

                        // Unbind previous event listener to avoid multiple bindings
                        $('#customModal3').off('shown.bs.modal').on('shown.bs.modal', () => {
                            renderTable(); // Render table when modal is shown
                           // $(".use-keyboard-input").prop("disabled", true);
                            resetInputFields(); // Reset input fields when modal opens
                            $('#addcompButton').show(); // Show Add button
                            $('#savecompButton').hide(); // Hide Save button
                            $('#cancelcompButton').hide(); // Hide Cancel button
                        });

                        // Add Button Click Event
                        $('#addcompButton').off('click').on('click', () => {
                            that.properties.is_changed = true;
                            const combination = $('#combination').val().trim();
                            const value = $('#value').val().trim();

                            // Check if the combination and value are provided
                            if (combination && value) {
                                // Add new combination to properties.comp_chars_list
                                that.properties.comp_chars_list.push({ compName: combination, compValue: value });

                                // Clear input fields
                                resetInputFields();

                                // Re-render the table
                                renderTable();
                            } else {
                                alert("Please enter both combination and value.");
                            }
                        });

                        // Function to render the table based on properties.comp_chars_list
                        function renderTable() {
                            let str = "";

                            // Check if there are any combinations in comp_chars_list
                            if (that.properties.comp_chars_list && that.properties.comp_chars_list.length > 0) {
                                that.properties.comp_chars_list.forEach((item, index) => {
                                    str += `<tr>
                                                <td>${item.compName}</td>
                                                <td>${item.compValue}</td>
                                                <td>
                                                    <button class='btn btn-warning btn-sm updateRow' data-index='${index}'>Update</button>
                                                    <button class='btn btn-danger btn-sm deleteRow'>Delete</button>
                                                </td>
                                             </tr>`;
                                });
                            } else {
                                str = "<tr><td colspan='3'>No mappings found;</td></tr>";
                            }

                            // Update the table body with the constructed rows
                            $('#comp_keys_table tbody').html(str);
                        }

                        // Event listener for deleting rows
                        $(document).on('click', '.deleteRow', function () {
                            that.properties.is_changed = true;
                            const row = $(this).closest('tr');
                            const index = row.index(); // Get the index of the row
        
                            // Remove item from properties.comp_chars_list
                            if (that.properties.comp_chars_list && index >= 0 && index < that.properties.comp_chars_list.length) {
                                that.properties.comp_chars_list.splice(index, 1);
                            }

                            // Remove the row from the table
                            row.remove();

                            // Re-render the table after deletion
                            renderTable();
                        });

                        // Event listener for updating rows
                        $(document).on('click', '.updateRow', function () {
                            that.properties.is_changed = true;
                            const index = $(this).data('index'); // Get index from data attribute
                            const item = that.properties.comp_chars_list[index]; // Get the item

                            // Load data into input fields
                            $('#combination').val(item.compName);
                            $('#value').val(item.compValue);

                            // Switch to save mode
                            $('#addcompButton').hide(); // Hide Add button
                            $('#savecompButton').show().off('click').on('click', () => {
                                // Update the item
                                item.compName = $('#combination').val().trim();
                                item.compValue = $('#value').val().trim();

                                // Re-render the table
                                renderTable();
                                resetInputFields(); // Clear input fields
                                $('#addcompButton').show(); // Show Add button again
                                $('#savecompButton').hide(); // Hide Save button
                                $('#cancelcompButton').hide(); // Hide Cancel button
                            });

                            // Show Cancel button and add cancel logic
                            $('#cancelcompButton').show().off('click').on('click', () => {
                                resetInputFields(); // Clear the input fields
                                $('#addcompButton').show(); // Show Add button
                                $('#savecompButton').hide(); // Hide Save button
                                $('#cancelcompButton').hide(); // Hide Cancel button
                            });
                        });

                        // Function to reset input fields
                        // Function to reset input fields
                        function resetInputFields() {
                            $('#combination').val('');
                            $('#value').val('');
                        }
                    });
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
                            if (this.properties.comp_flag != 0) {
                                this.properties.display_text = "";
                            }
                            else
                                this.properties.display_text = this.properties.display_text.slice(0, -1);
                            this._updateValueInTarget();
                        });
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = "English";
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = this.properties.list_of_languages.find(
                        item => item.keyboard_id === this.properties.lang_selection_key[0]
                    )?.keyboard_name || "Default Keyboard Name";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.showLanguageSelector(0, this.properties.lang_selection_key[0]);
                            }
                        );
                    fragment.appendChild(this.keyElement);
                    this._createKeyBtn();
                    this.keyElement.textContent = this.properties.list_of_languages.find(
                        item => item.keyboard_id === this.properties.lang_selection_key[1]
                    )?.keyboard_name || "Default Keyboard Name";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.showLanguageSelector(1, this.properties.lang_selection_key[1]);
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
                                if (this.properties.comp_flag != 0) {
                                    this.properties.display_text = "\t";
                                }
                                else
                                    this.properties.display_text += '\t';
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
                    if (this.properties.shift_flag)
                        this.keyElement.textContent = "SHIFT";
                    else
                        this.keyElement.textContent = "shift";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.properties.shift_flag = !this.properties.shift_flag;
                                if (this.properties.shift_flag && this.properties.altgr_flag) {
                                    alert("shift and altgr cannot be active at the same time");
                                    this.properties.shift_flag = false;
                                } else
                                    this.init();
                            });
                    break;
                case "altGr":
                    this._createKeyBtn();
                    if (this.properties.altgr_flag)
                        this.keyElement.textContent = "ALTGR";
                    else
                        this.keyElement.textContent = "altgr";
                    this.keyElement
                        .addEventListener(
                            "click",
                            () => {
                                this.properties.altgr_flag = !this.properties.altgr_flag;
                                if (this.properties.shift_flag && this.properties.altgr_flag) {
                                    alert("shift and altgr cannot be active at the same time");
                                    this.properties.altgr_flag = false;
                                } else
                                    this.init();
                            });
                    break;

                case "enter":
                    keycount += 1;
                    this._createKeyBtn(
                        "keyboard_return", "keyboard__key--wide",
                        () => {
                            if (this.properties.comp_flag != 0) {
                                this.properties.display_text = "\n";
                            }
                            else
                                this.properties.display_text += "\n";
                            this._updateValueInTarget();
                        });
                    break;

                case "space":
                    this._createKeyBtn(
                        "space_bar", "keyboard__key--extra--wide",
                        () => {
                            this.properties.display_text += " ";
                            this._updateValueInTarget();
                        });
                    break;

                case "done":
                    //this._createKeyBtn(
                    //    "check_circle",
                    //    "keyboard__key--dark",
                    //);
                    //this.keyElement
                    //    .addEventListener(
                    //        "click",
                    //        () => {
                    //            if (this.properties.is_changed)
                    //                this.saveFile();
                               
                    //        });
                    //this.keyElement.title = "Save Keyboard";
                    break;
                case "Languages":
                    // this.createdropdown(this);
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

                        // Handle single click event
                        $(this.keyElement).on("click", () => {
                            if (this.properties.dbl_clicked_flag === true) {
                                return;
                            }
                            if (key != "empty") {

                                if (this.properties.comp_flag != 2)
                                    this.properties.display_text += key;
                                else {
                                    $(".use-keyboard-input").prop("disabled", false); // Replaces `document.querySelector`
                                    this.properties.display_text = key;
                                }
                                this._updateValueInTarget();
                            }
                        });

                        // Handle double-click event
                        function handleDoubleClick(obj, key, count) {
                            if (obj.properties.dbclicked === true) {
                                return;
                            }
                            if (obj.properties.display_text)
                                obj.properties.display_text = obj.properties.display_text.slice(0, -2);
                            else
                                obj.properties.display_text = "";
                            obj._updateValueInTarget();
                            obj.showCustomPrompt(key, count);
                        }

                        // Attach double-click event using jQuery
                        $(this.keyElement).on("dblclick", handleDoubleClick.bind(null, this, key, keycount));

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
        const targetInput = document.querySelector(".use-keyboard-input"); // Target input element

        if (this.properties.comp_flag === 1) {
            if (targetInput) {
                targetInput.disabled = true; // Disable the input if comp_flag is 1
            }
            this.properties.comp_flag = 2; // Update comp_flag to indicate the state
        } else {
            if (targetInput) {
                targetInput.disabled = false; // Enable the input if comp_flag is not 1
            }
            this.properties.comp_flag = 0; // Reset comp_flag to 0
        }

        // Update the value of the target input
        if (targetInput) {
            targetInput.value = this.properties.display_text; // Set input value to display_text
        }
    }, 
    _toggleCapsLock() {
        this.properties.capslock_flag =
            !this.properties.capslock_flag;

        for (let key of this.elements.keys) {
            if (key.childElementCount === 0) {
                key.textContent =
                    this.properties.capslock_flag
                        ? key.textContent.toUpperCase()
                        : key.textContent.toLowerCase();
            }
        }
    },
    open(initialValue, oninput) {
        if (this.elements && this.elements.main) {
            this.properties.display_text = initialValue || "";  // Fallback to empty string if initialValue is undefined
            this.elements.main.classList.remove("keyboard--hidden");  // Safely remove the class
        } else {
            console.error("Cannot open keyboard: 'main' element is undefined.");
        }
    },
    close() {
        if (this.properties && this.elements && this.elements.main) {
            this.properties.display_text = this.properties.display_text || ""; // Ensure display_text is safe
            this.elements.main.classList.add("keyboard--hidden");
        } else {
            console.error("Cannot close keyboard: properties or main element is undefined.");
        }
    },
    showCustomPrompt(obj, count) {
        this.properties.dbl_clicked_flag = true;

        const $charLabel1 = $('#charLabel1');
        const $charInput1 = $('#charInput1');
        const $charLabel2 = $('#charLabel2');
        const $charInput2 = $('#charInput2');
        const $submitButton = $('#submitButton');
        const $cancelButton = $('#cancelButton');

        // Set labels based on flags
        if (this.properties.shift_flag) {
            $charLabel1.html('Char + shift :&nbsp;&nbsp;');
            $charLabel2.html('Unicode + shift :&nbsp;&nbsp;');
        } else if (this.properties.altgr_flag) {
            $charLabel1.html('Char + altgr :&nbsp;&nbsp;');
            $charLabel2.html('Unicode + altgr :&nbsp;&nbsp;');
        } else {
            $charLabel1.html('Char :&nbsp;&nbsp;');
            $charLabel2.html('Unicode :&nbsp;&nbsp;');
        }

        // Reset input fields
        $charInput1.val("");
        $charInput2.val("");
        $charInput1.focus();

        // Handle submit button click
        $submitButton.off('click').on('click', () => {
            this.properties.dbl_clicked_flag = false;

            const textValue = $charInput1.val().trim();
            const unicodeValue = $charInput2.val().trim();

            if (textValue && unicodeValue) {
                alert('Please input either char or unicode');
                return;
            }

            let Key = unicodeValue ? String.fromCodePoint(parseInt(unicodeValue, 16)) : textValue;

            const index = this.properties.keyLayout.indexOf(obj);
            if (index !== -1) {
                this.properties.keyLayout[count] = Key;
                this.tempsave(count);
                this.properties.is_modified_keyboard = 1;
                this.properties.is_changed = true;
            }

            $('#customModal').modal('hide');
            this.init();
        });

        $cancelButton.off('click').on('click', () => {
            this.properties.dbl_clicked_flag = false;
            $('#customModal').modal('hide');
        });

        $('#customModal').modal('show');
        $('#customModal').on('shown.bs.modal', function () {
            $('#charInput1').focus();
        });
    }
};

window.addEventListener("DOMContentLoaded", function () {

    //window.addEventListener("contextmenu", function (event) {
    //    event.preventDefault();
    //});
    Keyboard.initialize();

    $('#mains_changer').on("change", async function () {
        const that = Keyboard; 
        const $this = $(this);
        const selected_main = $this.val(); 
        const previous_main = that.properties.current_main_id; 

        if (that.properties.is_changed) {
            if (!confirm("There are unsaved changes. Continue without saving?")) {
                $this.val(previous_main); 
                return; 
            }
        }

        that.properties.current_main_id = selected_main;
        that.properties.is_changed = false;
        that.properties.comp_flag = 0;
        that.properties.shift_flag = false;
        that.properties.altgr_flag = false;

        let $scriptSelect = $('#scripts_changer');
        $scriptSelect.empty();
        if (that.properties.script_list) {
            that.properties.script_list
                .filter(rec => rec.main_keyboard == selected_main)
                .forEach((lang) => {
                    let option = $('<option></option>').val(lang.keyboard_id).text(lang.keyboard_name);
                    $scriptSelect.append(option);  
                });
        }

        that.properties.current_script_id = $scriptSelect.val();
        $scriptSelect.prop('selectedIndex', 0).trigger('change');   
        that.init(); 
    });

    $('#scripts_changer').on("change", async function () {
        const that = Keyboard;  
        const selected = $(this).val();
        const previousValue = that.properties.current_script_id; 

        if (that.properties.is_changed) {
            if (!confirm("There are unsaved changes. Continue without saving?")) {
                $(this).val(previousValue);
                return;
            }
        }

        that.properties.is_changed = false;
        that.properties.comp_flag = 0;
        that.properties.script_list.forEach((item) => {
            if (item.keyboard_id === Number(selected)) {
                that.properties.current_script_id = item.keyboard_id;
                that.properties.current_script_name = item.keyboard_name;
                that.properties.is_modified_keyboard = item.is_modifiedone;
                that.properties.comp_chars_list = item.compList;
                that.properties.shift_flag = false;
                that.properties.altgr_flag = false;
                that.properties.is_changed = false;
                that.init(); 
            }
        });
    });

    $('#add_newkeyboard').on('click', function () {
        if (Keyboard.properties.is_changed) {
            if (confirm("There are unsaved changes. Continue without saving?") === false) {
                return;
            } else {
                $('#customModal2').modal('show');
            }
        }
        else
            $('#customModal2').modal('show');
    });
    
    $('#save_keyboard_current').on('click', function () {
        if (Keyboard.properties.is_changed) {
            Keyboard.saveFile(); 
            Keyboard.properties.is_changed = false;
            alert("Your changes have been successfully saved.");
        } 
    });
    
    $('#download_option').on('click', function () {
        let that = Keyboard;
        let jsons = that.properties.jsons;
        var languages_id = that.properties.script_list
            .filter(rec => rec.main_keyboard == that.properties.current_main_id)  // Filter for matching main_id
            .map(rec => rec.keyboard_id);  // Extract all matching keyboard_id values
        var finalList = [];  // Final list of objects for all language IDs
        languages_id.forEach((languageId) => {
            var modified_keys = [];
            that.properties.script_list.forEach((item) => {
                if (item.keyboard_id == languageId) {
                    for (var i = 0; i < jsons[item.keyboard_id].length; i++) {
                        modified_keys.push(jsons[item.keyboard_id][i][0]);
                        modified_keys.push(jsons[item.keyboard_id][i][1]);
                        modified_keys.push(jsons[item.keyboard_id][i][2]);
                    }
                }
            });

            // Group keys by scancode
            const groupedBySC = that.groupBy(modified_keys, 'sc');
            const groupedArray = Object.keys(groupedBySC).map(key => groupedBySC[key]);

            var scancodes = [];
            var jsonstring = [];
            var index = 0;

            // Process each group of scancodes
            groupedArray.forEach((item) => {
                var unicode = ["ffff", "ffff", "ffff", "ffff", "ffff", "ffff"];
                var SC = "";

                item.forEach((subitem) => {
                    switch (subitem.app) {
                        case "None":
                            unicode[0] = that.getUnicode(subitem.char);
                            break;
                        case "leftshift":
                            unicode[1] = that.getUnicode(subitem.char);
                            break;
                        case "leftaltgr":
                            unicode[2] = that.getUnicode(subitem.char);
                            break;
                        case "rightshift":
                            unicode[3] = that.getUnicode(subitem.char);
                            break;
                        case "RSLS":
                            unicode[4] = that.getUnicode(subitem.char);
                            break;
                        case "CARS":
                            unicode[5] = that.getUnicode(subitem.char);
                            break;
                    }
                    SC = subitem.sc;
                });

                jsonstring[index] = `{"scancode":"${SC}","unicode":${JSON.stringify(unicode)}}`;
                index++;
            });

            // Create language-specific data
            var languageData = {
                language: languageId,
                scancodes: JSON.stringify(jsonstring)
            };

            finalList.push(languageData);
        });

        // Add language selection keys
        var lang_selection_keys = {
            lan_selection_key: [that.properties.lang_selection_key[0], that.properties.lang_selection_key[1]]
        };

        // Add the final language selection key object to the final list
        finalList.push(lang_selection_keys);

        // Create a Blob containing the final data for all languages
        var blob = new Blob([JSON.stringify(finalList)], { type: "text/plain" });
        // Create a URL for the Blob
        var url = window.URL.createObjectURL(blob);

        // Create a link element
        var link = document.createElement("a");
        link.href = url;
        link.download = "ml_keyboard_modified_keys_" + new Date().getTime().toString() + ".json";

        // Click the link to trigger the download
        document.body.appendChild(link);
        link.click();

        window.chrome.webview.hostObjects.bridge.DoSaveFileInLocal(JSON.stringify(finalList)).then((result) => {
            console.log("Update successful:", result);
        }).catch((error) => {
            console.error("Error updating JSON:", error);
        });

        // Clean up
        that.properties.is_changed = false;
        alert("Your changes have been successfully saved.");
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    });

    $(".use-keyboard-input").on('change', function () {
        Keyboard.properties.display_text = $(this).val();
    });

    $('#createnewkeyboard').on('click', function () {
        let languageName = $('#languageName').val();
        let scriptName = $('#scriptName').val();

        if (languageName && scriptName) {
            try {
                window.chrome.webview.hostObjects.bridge.DoCreateOrGroupNewKeyboard(languageName, scriptName)
                    .then((result) => {
                        if (result !== -1) {
                            if (result === 0) {
                                Keyboard.onStartup(); // Initialize the keyboard
                                $('#customModal2').modal('hide'); // Hide the modal
                            } else {
                                alert(scriptName + ' - script name already exists');
                            }
                        } else {
                            console.error("Keyboard creation failed.");
                        }
                    })
                    .catch((error) => {
                        console.error("Caught error:", error);
                    });
            } catch (error) {
                console.error("Caught exception:", error);
            }
        } else {
            alert("Please provide both a language name and a script name.");
        }
    }); 
     
    $('#UpdateCompToDB').on('click', async function () { 
       const jsonString = JSON.stringify(Keyboard.properties.comp_chars_list);
            window.chrome.webview.hostObjects.bridge.DoUpdateCompData(jsonString, Keyboard.properties.current_script_id).then((result) => {
                console.log("Update successful:", result);
            }).catch((error) => {
                console.error("Error updating JSON:", error);
            });
            let main = Keyboard.properties.current_main_id ;
            let script = Keyboard.properties.current_script_idcurrent_main_id ;
            await Keyboard.onStartup();
            Keyboard.properties.current_main_id = main;
            Keyboard.properties.script = script;
            Keyboard.init();
    });
});
