export const matches = (str: string, regex: RegExp): boolean => {
    return str.match(regex) != null;
};

export const transform = (input: string, matchRegex: RegExp, replacementPattern: string): string => {
    const matches = input.match(matchRegex);
    if(!matches) {
        throw new Error(`No matches found for "${input}" using "${matchRegex}"`);
    }
    
    // Classify all the matches either by their position or by their group name
    const matchIndex = new Map<string | number, string>();
    matches?.forEach((match, index) => {
        matchIndex.set(index, match);
    });

    if (matches?.groups) {
        const groups = matches.groups as { [key: string]: string };
        for (const groupName in groups) {
            if (Object.prototype.hasOwnProperty.call(groups, groupName)) {
                matchIndex.set(groupName, groups[groupName]);
            }
        }
    }

    // Replace positional arguments
    let xformedName = replacementPattern.replace(/\$(\d+)/g, (match, ...args) => {        
        const matchIdx = args[0];
        if(matchIdx && matchIndex.has(parseInt(matchIdx))) {
            return matchIndex.get(parseInt(matchIdx)) || "";
        }
        return `\$${matchIdx}`; // Return the same match index if not found
    });

    // Replace named arguments
    xformedName = xformedName.replace(/\$(\w+)/g, (match, ...args) => {
        const matchIdx = args[0];
        if(matchIdx && matchIndex.has(matchIdx)) {
            return matchIndex.get(matchIdx) || "";
        }
        return `\$${matchIdx}`; // Return the same match index if not found
    });

    return xformedName;
};