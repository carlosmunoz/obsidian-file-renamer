import { Notice, Plugin, TFile } from 'obsidian';
import * as path from 'path';
import { matches, transform } from 'regex/Regex';
import { PluginSettings, SettingsTab } from './settings/SettingsTab';

const DEFAULT_SETTINGS: PluginSettings = {
	tableEntries: []
}

export default class NewFileRenamer extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {

			// Find the first xformation entry that matches the file path
			const xformEntry = this.settings.tableEntries.find(entry => 
				matches(file.name, new RegExp(entry.fileNameMatcher))
			);

			if (xformEntry) {
				// Rename the file using the newFileReplacePattern
				const newFileName = 
					transform(file.name, new RegExp(xformEntry.fileNameMatcher), xformEntry.newFileReplacePattern);
				const newFilePath = file.parent?.path + path.sep + newFileName;

				console.log(`File renamer - renaming file: ${file.path} to ${newFilePath}`);

				const previousContent = 
					file instanceof TFile ? await this.app.vault.cachedRead(file) : "";

				// create a new file and remove the old one, so that the rename event isn't triggered again
				const newFile = await this.app.vault.create(newFilePath, previousContent);
				// show the file in the current editor
				if (newFile) {
					await this.app.workspace.getLeaf().openFile(newFile);
				} else {
					console.log("[ERROR] File renamer - new file not found: " + newFilePath);
				}
				// delete the old file
				this.app.vault.delete(file, true);

				// Apply the template if there is one
				if(xformEntry.template) {
					const template = xformEntry.template;
					if(previousContent === "") {
						const tp = await this.getTemplater();
						const templateFile = this.app.vault.getFileByPath(template);
						tp.write_template_to_file(templateFile, newFile);
					}
					else {
						new Notice(`${newFile.path} already has content. Not overwriting it.`);
					}
				}
			}
			else {
				console.log("No pattern match found. Regular rename proceeding");
			}
		}));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getTemplater(): Promise<any> {
        // try to get the Templater folder first
        const plugins = (this.app as any).plugins;
		const tp = plugins.getPlugin("templater-obsidian").templater;
		// if templater is installed
		if(tp) {
			return tp;
		}
        return undefined;
    }
}
