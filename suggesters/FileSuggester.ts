// Credit for this goes to SilentVoid13's templater plugin suggesters:
// https://github.com/SilentVoid13/Templater/blob/master/src/settings/suggesters/FileSuggester.ts

import { Plugin, TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";
import TemplaterPlugin from "main";

export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class TemplateFileSuggest extends TextInputSuggest<TFile> {
    constructor(
        public inputEl: HTMLInputElement,
        private plugin: Plugin,
        private rootFolder: string
    ) {
        super(plugin.app, inputEl);
    }

    getSuggestions(input_str: string): TFile[] {
        let templateFiles =
            this.app.vault.getFolderByPath(this.rootFolder)?.children
                .filter(f => f instanceof TFile)
                .map(f => f as TFile)
                .filter(f => f.extension === "md")
                .filter(f => f.path.toLowerCase().contains(input_str.toLowerCase()));
                //.map(f => f.path)

        return templateFiles ? templateFiles.slice(0, 1000) : [];
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}