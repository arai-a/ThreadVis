/* *****************************************************************************
 * This file is part of ThreadVis.
 * http://threadvis.github.io
 *
 * ThreadVis started as part of Alexander C. Hubmann-Haidvogel's Master's Thesis
 * titled "ThreadVis for Thunderbird: A Thread Visualisation Extension for the
 * Mozilla Thunderbird Email Client" at Graz University of Technology, Austria.
 * An electronic version of the thesis is available online at
 * http://www.iicm.tugraz.at/ahubmann.pdf
 *
 * Copyright (C) 2005, 2006, 2007 Alexander C. Hubmann
 * Copyright (C) 2007, 2008, 2009, 2010, 2011,
 *               2013, 2018 Alexander C. Hubmann-Haidvogel
 *
 * ThreadVis is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * ThreadVis is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with ThreadVis. If not, see <http://www.gnu.org/licenses/>.
 *
 * Version: $Id$
 * *****************************************************************************
 * JavaScript file for settings dialog
 ******************************************************************************/

var ThreadVis = (function(ThreadVis) {

    ThreadVis.Settings = {

        /**
         * Init the dialog, read all settings, build the account list, ...
         */
        init : function() {
            this.toggleHighlight();
            this.toggleTimescaling();
            this.buildAccountList();
            this.buildAccountPreference();
        },

        /**
         * Add attachments from file objects
         * 
         * @param composeFields
         *            Object to add the attachments to
         * @param attachments
         *            List of files to attach to the message
         */
        _addAttachments : function(composeFields, attachments) {
            for (var key in attachments) {
                var file = attachments[key];
                var attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"]
                        .createInstance(Components.interfaces.nsIMsgAttachment);
                var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
                var fileHandler = ios.getProtocolHandler("file")
                        .QueryInterface(
                                Components.interfaces.nsIFileProtocolHandler);
                attachment.url = fileHandler.getURLSpecFromFile(file);
                composeFields.addAttachment(attachment);
            }
        },

        /**
         * Build the account list Get all accounts, display checkbox for each
         */
        buildAccountList : function() {
            var accountBox = document.getElementById("enableAccounts");
            var pref = document.getElementById("hiddenDisabledAccounts").value;

            var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
                    .getService(Components.interfaces.nsIMsgAccountManager);
            for (let account of fixIterator(accountManager.accounts,
                    Components.interfaces.nsIMsgAccount)) {
                // get folders
                var rootFolder = account.incomingServer.rootFolder;
                var folders = this._getAllFolders(rootFolder);

                var checkbox = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "checkbox");
                checkbox.setAttribute("label",
                        account.incomingServer.prettyName);
                checkbox.setAttribute("oncommand",
                        "ThreadVis.Settings.buildAccountPreference();");
                checkbox.setAttribute("accountkey", account.key);
                checkbox.setAttribute("checkboxtype", "account");
                if (pref != "" && pref.indexOf(" " + account.key + " ") > -1) {
                    checkbox.setAttribute("checked", false);
                } else {
                    checkbox.setAttribute("checked", true);
                }

                var buttonAll = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "button");
                buttonAll.setAttribute("label", ThreadVis.strings
                        .getString("enabledaccounts.button.all"));
                buttonAll.setAttribute("accountkey", account.key);
                buttonAll.setAttribute("oncommand",
                        "ThreadVis.Settings.selectAll(this);");
                var buttonNone = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "button");
                buttonNone.setAttribute("label", ThreadVis.strings
                        .getString("enabledaccounts.button.none"));
                buttonNone.setAttribute("accountkey", account.key);
                buttonNone.setAttribute("oncommand",
                        "ThreadVis.Settings.selectNone(this);");
                var spacer = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "spacer");
                spacer.setAttribute("flex", "1");
                var hbox = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "hbox");

                hbox.appendChild(checkbox);
                hbox.appendChild(spacer);
                hbox.appendChild(buttonAll);
                hbox.appendChild(buttonNone);
                accountBox.appendChild(hbox);

                this._buildFolderCheckboxes(accountBox, folders,
                        account.key, 1);

                var separator = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "separator");
                separator.setAttribute("class", "groove");
                accountBox.appendChild(separator);
            }
        },

        /**
         * Create a string preference of all selected accounts
         */
        buildAccountPreference : function() {
            var accountBox = document.getElementById("enableAccounts");
            var pref = document.getElementById("hiddenDisabledAccounts");

            var prefString = " ";

            var checkboxes = accountBox.getElementsByAttribute("checkboxtype",
                    "account");

            for (var i = 0; i < checkboxes.length; i++) {
                var checkbox = checkboxes.item(i);
                if (!checkbox.checked) {
                    prefString += " " + checkbox.getAttribute("accountkey")
                            + " ";
                }

                var folderCheckboxes = accountBox.getElementsByAttribute(
                        "checkboxtype", "folder");
                for (var j = 0; j < folderCheckboxes.length; j++) {
                    var folderCheckbox = folderCheckboxes.item(j);
                    if (folderCheckbox.getAttribute("accountkey") == checkbox
                            .getAttribute("accountkey")) {
                        if (checkbox.checked) {
                            folderCheckbox.disabled = false;
                        } else {
                            folderCheckbox.disabled = true;
                        }
                    }
                }

            }
            pref.value = prefString;
            // We need to call doCommand(), because otherwise Thunderbird doesn't
            // update the underlying preference upon closing the window (i.e.
            // ignores
            // the new value of the textbox).
            pref.doCommand();
        },

        /**
         * Create checkbox elements for all folders
         * 
         * @param box
         *            The box to which to add the checkbox elements to
         * @param folders
         *            All folders for which to create checkboxes
         * @param account
         *            The account for which the checkboxes are created
         * @param indent
         *            The amount of indentation
         */
        _buildFolderCheckboxes : function(box, folders, account, indent) {
            var pref = document.getElementById("hiddenDisabledFolders").value;

            for (var i = 0; i < folders.length; i++) {
                var folder = folders[i];

                if (folder instanceof Array) {
                    this._buildFolderCheckboxes(box, folder,
                            account, indent + 1);
                    continue;
                }

                var checkbox = document.createElementNS(
                        ThreadVis.XUL_NAMESPACE, "checkbox");
                checkbox.setAttribute("label", folder.name);
                checkbox.setAttribute("oncommand",
                        "ThreadVis.Settings.buildFolderPreference();");
                checkbox.setAttribute("folderuri", folder.URI);
                checkbox.setAttribute("checkboxtype", "folder");
                checkbox.setAttribute("accountkey", account);
                checkbox.style.paddingLeft = indent + "em";
                if (pref != "" && pref.indexOf(folder.URI + " ") > -1) {
                    checkbox.setAttribute("checked", false);
                } else {
                    checkbox.setAttribute("checked", true);
                }
                box.appendChild(checkbox);
            }
        },

        /**
         * Create a string preference of all selected folders
         */
        buildFolderPreference : function() {
            var accountBox = document.getElementById("enableAccounts");
            var pref = document.getElementById("hiddenDisabledFolders");

            var prefString = " ";

            var checkboxes = accountBox.getElementsByAttribute("checkboxtype",
                    "folder");

            for (var i = 0; i < checkboxes.length; i++) {
                var checkbox = checkboxes.item(i);
                if (!checkbox.checked) {
                    prefString += " " + checkbox.getAttribute("folderuri")
                            + " ";
                }
            }
            pref.value = prefString;
            // We need to call doCommand(), because otherwise Thunderbird doesn't
            // update the underlying preference upon closing the window (i.e.
            // ignores
            // the new value of the textbox).
            pref.doCommand();
        },

        /**
         * Compose an email
         * 
         * @param to
         *            The address to which the email should be sent
         * @param subject
         *            The subject of the email
         * @param body
         *            The body of the email
         * @param attachments
         *            A list of files to attach to the email
         */
        _composeEmail : function(to, subject, body, attachments) {
            var msgComposeType = Components.interfaces.nsIMsgCompType;
            var msgComposFormat = Components.interfaces.nsIMsgCompFormat;
            var msgComposeService = Components.classes["@mozilla.org/messengercompose;1"]
                    .getService();
            msgComposeService = msgComposeService
                    .QueryInterface(Components.interfaces.nsIMsgComposeService);

            var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"]
                    .createInstance(Components.interfaces.nsIMsgComposeParams);

            if (params) {
                params.type = msgComposeType.New;
                params.format = msgComposFormat.Default;
                var composeFields = Components.classes["@mozilla.org/messengercompose/composefields;1"]
                        .createInstance(Components.interfaces.nsIMsgCompFields);
                if (composeFields) {
                    if (to) {
                        composeFields.to = to;
                    }
                    if (subject) {
                        composeFields.subject = subject;
                    }
                    if (body) {
                        composeFields.body = body;
                    }
                    if (attachments) {
                        this._addAttachments(composeFields,
                                attachments);
                    }
                    params.composeFields = composeFields;
                    msgComposeService.OpenComposeWindowWithParams(null, params);
                }
            }
        },

        /**
         * Get all subfolders starting from "folder" as array
         * 
         * @param folder
         *            The folder to check
         * @return An array of all subfolders
         */
        _getAllFolders : function(folder) {
            var folderEnumerator = folder.subFolders;
            var currentFolder = null;
            var folders = new Array();

            while (true) {
                try {
                    currentFolder = folderEnumerator.getNext();
                } catch (Exception) {
                    break;
                }

                if (currentFolder instanceof Components.interfaces.nsIMsgFolder) {
                    folders.push(currentFolder);
                }

                if (currentFolder.hasSubFolders) {
                    folders.push(this._getAllFolders(currentFolder));
                }

                try {
                    if (!folderEnumerator.hasMoreElements()) {
                        break;
                    }
                } catch (e) {
                    break;
                }
            }

            return folders;
        },

        /**
         * Open a homepage
         * 
         * @param url
         *            The URL to open
         */
        openURL : function(url) {
            var uri = Components.classes["@mozilla.org/network/standard-url;1"]
                    .createInstance(Components.interfaces.nsIURI);
            uri.spec = url;
            var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                    .getService(Components.interfaces.nsIExternalProtocolService);
            protocolSvc.loadUrl(uri);
        },

        /**
         * Enable or disable the highlight checkbox
         */
        toggleHighlight : function() {
            var colourRadio = document
                    .getElementById("visualisationColourAuthor");
            var highlightCheckbox = document
                    .getElementById("visualisationHighlight");
            if (colourRadio.selected) {
                highlightCheckbox.disabled = false;
            } else {
                highlightCheckbox.disabled = true;
            }
        },

        /**
         * Enable or disable the timescaling settings
         */
        toggleTimescaling : function() {
            var timescalingRadio = document
                    .getElementById("doTimeScalingEnabled");
            var timescalingMethod = document
                    .getElementById("timescalingMethod");
            var timescalingMinTimeDifference = document
                    .getElementById("timescalingMinTimeDifference");
            if (timescalingRadio.selected) {
                timescalingMethod.disabled = false;
                timescalingMinTimeDifference.disabled = false;
            } else {
                timescalingMethod.disabled = true;
                timescalingMinTimeDifference.disabled = true;
            }
        },

        /**
         * Write an email to the author
         */
        writeEmail : function() {
            this._composeEmail("ahubmann@gmail.com",
                    "[ThreadVis] <insert subject here>", null);
        },

        /**
         * Load preferences in about dialog
         */
        loadAboutPreference : function() {
            var disabledAccounts = ThreadVis.Preferences
                    .getPreference(ThreadVis.Preferences.PREF_DISABLED_ACCOUNTS);
            var disabledFolders = ThreadVis.Preferences
                    .getPreference(ThreadVis.Preferences.PREF_DISABLED_FOLDERS);
            var glodaEnabled = ThreadVis.Preferences
                    .getPreference(ThreadVis.Preferences.PREF_GLODA_ENABLED);
            document.getElementById("hiddenDisabledAccounts").value = disabledAccounts;
            document.getElementById("hiddenDisabledFolders").value = disabledFolders;
            document.getElementById("enableGloda").checked = glodaEnabled;
        },

        /**
         * Save preferences in about dialog
         */
        saveAboutSettings : function() {
            var disabledAccounts = document
                    .getElementById("hiddenDisabledAccounts").value;
            var disabledFolders = document
                    .getElementById("hiddenDisabledFolders").value;
            var notShowAgain = document.getElementById("donotshowagain").checked;
            var glodaEnabled = document.getElementById("enableGloda").checked;

            var about = ThreadVis.ABOUT;
            ThreadVis.Preferences.setPreference(
                    ThreadVis.Preferences.PREF_DISABLED_ACCOUNTS,
                    disabledAccounts);
            ThreadVis.Preferences.setPreference(
                    ThreadVis.Preferences.PREF_DISABLED_FOLDERS,
                    disabledFolders);
            if (notShowAgain) {
                ThreadVis.Preferences.setPreference(
                        ThreadVis.Preferences.PREF_ABOUT, about);
            }
            ThreadVis.Preferences.setPreference(
                    ThreadVis.Preferences.PREF_GLODA_ENABLED,
                    glodaEnabled);
        },

        /**
         * Select all folders for an account
         * 
         * @param element
         *            The account element
         */
        selectAll : function(element) {
            var accountKey = element.getAttribute("accountkey");

            var accountBox = document.getElementById("enableAccounts");
            var folderCheckboxes = accountBox.getElementsByAttribute(
                    "checkboxtype", "folder");
            for (var j = 0; j < folderCheckboxes.length; j++) {
                var folderCheckbox = folderCheckboxes.item(j);
                if (folderCheckbox.getAttribute("accountkey") == accountKey) {
                    folderCheckbox.checked = true;
                }
            }
            this.buildFolderPreference();
        },

        /**
         * Deselect all folders for an account
         * 
         * @param element
         *            The account element
         */
        selectNone : function(element) {
            var accountKey = element.getAttribute("accountkey");

            var accountBox = document.getElementById("enableAccounts");
            var folderCheckboxes = accountBox.getElementsByAttribute(
                    "checkboxtype", "folder");
            for (var j = 0; j < folderCheckboxes.length; j++) {
                var folderCheckbox = folderCheckboxes.item(j);
                if (folderCheckbox.getAttribute("accountkey") == accountKey) {
                    folderCheckbox.checked = false;
                }
            }
            this.buildFolderPreference();
        }
    };

    return ThreadVis;
}(ThreadVis || {}));
