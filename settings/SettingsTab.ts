import NewFileRenamer from "main";
import { App, PluginSettingTab, setIcon, Setting, TextComponent, TFile } from "obsidian";

export interface PluginSettings {
	tableEntries: { fileNameMatcher: string; newFileReplacePattern: string, template: string }[];
}

export class SettingsTab extends PluginSettingTab {
    plugin: NewFileRenamer;

    constructor(app: App, plugin: NewFileRenamer) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Table Settings" });

        const table = containerEl.createEl("table");
        table.style.width = "100%";
        const thead = table.createEl("thead");
        const tbody = table.createEl("tbody");
        const headerRow = thead.createEl("tr");

        ["File Name Matcher", "New Name Expression", "Template to Apply", "Actions"].forEach((text) => {
            const th = headerRow.createEl("th", { text });
            th.style.padding = "8px";
            th.style.borderBottom = "1px solid var(--background-modifier-border)";
        });

        const updateTable = () => {
            tbody.empty();
            this.plugin.settings.tableEntries.forEach((entry, index) => {
                const row = tbody.createEl("tr");
                row.draggable = true;

                // File name matcher field
                const keyTd = row.createEl("td");
                const keyInput = keyTd.createEl("input", { type: "text", value: entry.fileNameMatcher });
                keyInput.style.width = "100%";
                keyInput.oninput = () => {
                    this.plugin.settings.tableEntries[index].fileNameMatcher = keyInput.value;
                    this.plugin.saveSettings();
                };

                // New file name replacer field
                const valueTd = row.createEl("td");
                const fileNameReplacerInput = valueTd.createEl("input", { type: "text", value: entry.newFileReplacePattern });
                fileNameReplacerInput.style.width = "100%";
                fileNameReplacerInput.oninput = () => {
                    this.plugin.settings.tableEntries[index].newFileReplacePattern = fileNameReplacerInput.value;
                    this.plugin.saveSettings();
                };

                // Template to Apply field
                const templateTd = row.createEl("td");
                const templateInput = templateTd.createEl("input", { type: "text", value: entry.template });
                templateInput.style.width = "100%";
                templateInput.oninput = () => {
                    this.plugin.settings.tableEntries[index].template = templateInput.value;
                    this.plugin.saveSettings();
                    this.showTemplateSuggestions(templateInput, templateInput.value, index);
                };
                templateInput.onfocus = () => {
                    this.showTemplateSuggestions(templateInput, templateInput.value, index);
                };

                // Remove button
                const actionsTd = row.createEl("td");
                const removeBtn = actionsTd.createEl("button");
                setIcon(removeBtn, "trash");
                removeBtn.onclick = () => {
                    this.plugin.settings.tableEntries.splice(index, 1);
                    this.plugin.saveSettings();
                    updateTable();
                };
                // Move up buttons
                if(index > 0) {
                    const moveUpBtn = actionsTd.createEl("button");
                    setIcon(moveUpBtn, "chevron-up");
                    moveUpBtn.onclick = () => {
                        if (index < this.plugin.settings.tableEntries.length) {
                            [this.plugin.settings.tableEntries[index], this.plugin.settings.tableEntries[index - 1]] = 
                                [this.plugin.settings.tableEntries[index - 1], this.plugin.settings.tableEntries[index]]; // Swap elements
                        }
                        this.plugin.saveSettings();
                        updateTable();
                    };
                }
                // Move Down button
                if(index < this.plugin.settings.tableEntries.length - 1) {
                    const moveDownBtn = actionsTd.createEl("button");
                    setIcon(moveDownBtn, "chevron-down");
                    moveDownBtn.onclick = () => {
                        if (index >= 0) {
                            [this.plugin.settings.tableEntries[index], this.plugin.settings.tableEntries[index + 1]] = 
                                [this.plugin.settings.tableEntries[index + 1], this.plugin.settings.tableEntries[index]]; // Swap elements
                        }
                        this.plugin.saveSettings();
                        updateTable();
                    };
                }

            });
        };

        updateTable();

        // Add row button
        new Setting(containerEl)
            .addButton((btn) => {
                btn.setButtonText("Add Entry")
                    .setCta()
                    .onClick(() => {
                        this.plugin.settings.tableEntries.push({ fileNameMatcher: "(.*).md", newFileReplacePattern: "$1.md", template: "" });
                        this.plugin.saveSettings();
                        updateTable();
                    });
            });
    }

    getTemplatesFolder(): any {
        // try to get the Templater folder first
        const plugins = (this.app as any).plugins;
        return plugins?.plugins["templater-obsidian"].settings.templates_folder;
    }

    showTemplateSuggestions(inputEl: HTMLInputElement, value: string, entryIdx: number) {
        let dropdown = inputEl.nextElementSibling as HTMLDivElement;
        const templateFolder = this.getTemplatesFolder();
        let templates = templateFolder ? 
            this.app.vault.getFolderByPath(templateFolder)?.children
                .filter(f => f instanceof TFile) 
                .map(f => f.path)
            : [];

        if(!templates) {
            templates = [];
        }
        
        // Remove existing dropdown if it exists
        if (dropdown && dropdown.classList.contains("suggestion-dropdown")) {
            dropdown.remove();
        }

        // Filter suggestions based on user input
        const filteredSuggestions = templates.filter((s) => 
            s.toLowerCase().includes(value.toLowerCase())
        );

        if (filteredSuggestions.length === 0) return;

        // Create dropdown
        dropdown = document.createElement("div");
        dropdown.classList.add("suggestion-dropdown");
        dropdown.style.position = "absolute";
        dropdown.style.backgroundColor = "var(--background-primary)";
        dropdown.style.border = "1px solid var(--background-modifier-border)";
        dropdown.style.padding = "5px";
        dropdown.style.width = `${inputEl.offsetWidth}px`;
        dropdown.style.zIndex = "1000";

        filteredSuggestions.forEach((suggestion) => {
            const item = document.createElement("div");
            item.classList.add("suggestion-item");
            item.textContent = suggestion;
            item.style.padding = "5px";
            item.style.cursor = "pointer";

            item.addEventListener("click", async () => {
                inputEl.value = suggestion;
                this.plugin.settings.tableEntries[entryIdx].template = suggestion;
                await this.plugin.saveSettings();
                dropdown.remove();
            });

            item.addEventListener("mouseover", () => {
                item.style.backgroundColor = "var(--background-modifier-hover)";
            });

            item.addEventListener("mouseout", () => {
                item.style.backgroundColor = "transparent";
            });

            dropdown.appendChild(item);
        });

        inputEl.parentElement?.appendChild(dropdown);
    }
}