import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile } from 'obsidian';
import { PluginSettings, SettingsTab } from './settings/SettingsTab';
import { matches, transform } from 'regex/Regex';
import * as path from 'path';

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
						var templateFile = this.app.vault.getFileByPath(template);
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

		/**
		 * The code below is from the original sample plugin
		 */

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
