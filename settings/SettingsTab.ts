import NewFileRenamer from "main";
import { App, PluginSettingTab, setIcon, Setting, TextComponent, TFile } from "obsidian";
import { TemplateFileSuggest } from "suggesters/FileSuggester";

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

        containerEl.createEl("h2", { text: "Renaming Rules" });

        const table = containerEl.createEl("table");
        table.style.width = "100%";
        const thead = table.createEl("thead");
        const tbody = table.createEl("tbody");
        const headerRow = thead.createEl("tr");

        ["File Name (Regex)", "New Name (Regex)", "Template to Apply", "Actions"].forEach((text) => {
            const th = headerRow.createEl("th", { text });
            th.style.padding = "8px";
            th.style.borderBottom = "1px solid var(--background-modifier-border)";
        });

        const updateTable = () => {
            tbody.empty();
            this.plugin.settings.tableEntries.forEach((entry, index) => {
                const row = tbody.createEl("tr");

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
                };
                new TemplateFileSuggest(templateInput, this.plugin, this.getTemplatesFolder());

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
}