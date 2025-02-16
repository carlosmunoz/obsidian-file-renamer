import { matches, transform } from "../regex/Regex";

describe("Regular Expression tests", () => {
    test("Match All markdown files", () => {
        const fileNameMatcher = new RegExp(".*\\.md");
        const fileName = "file.md";
        expect(matches(fileName, fileNameMatcher)).toBe(true);
    });

    test("Match markdown files with prefix", () => {
        const fileNameMatcher = new RegExp("Prefix-.*\\.md");
        expect(matches("Prefix-I should match.md", fileNameMatcher)).toBe(true);
        expect(matches("Prefix-With some sumbers 4-5-6.md", fileNameMatcher)).toBe(true);
        expect(matches("Prefix-.md", fileNameMatcher)).toBe(true);

        expect(matches("Prefix2-I should NOT match.md", fileNameMatcher)).toBe(false);
        expect(matches("Pre-I should NOT match.md", fileNameMatcher)).toBe(false);
        expect(matches("Prefix: I should NOT match.md", fileNameMatcher)).toBe(false);
        expect(matches("A random file name.md", fileNameMatcher)).toBe(false);
    });

    test("Match markdown files with a suffix", () => {
        const fileNameMatcher = new RegExp(".*-Suffix\\.md");
        expect(matches("I should match-Suffix.md", fileNameMatcher)).toBe(true);
        expect(matches("12345-Suffix.md", fileNameMatcher)).toBe(true);
        expect(matches("-Suffix.md", fileNameMatcher)).toBe(true);

        expect(matches("I should NOT match-Suffix2.md", fileNameMatcher)).toBe(false);
        expect(matches("I should NOT match-Suff.md", fileNameMatcher)).toBe(false);
        expect(matches("I should NOT match :Suffix.md", fileNameMatcher)).toBe(false);
        expect(matches("A random file name.md", fileNameMatcher)).toBe(false);
    });

    test("Simple positional replacement", () => {
        const fileNameMatcher = /Prefix-(.*)\.md/;
        
        expect(transform("Prefix-And I should match.md", fileNameMatcher, "$1.md")).toBe("And I should match.md");
    });

    test("Replace multiple positional groups", () => {
        const fileNameMatcher = /([a-zA-Z]+)-([0-9]+)-([a-zA-Z]+)\.md/;
        
        expect(transform("abc-123456-ABCD.md", fileNameMatcher, "$3\:$2\:$1.md")).toBe("ABCD:123456:abc.md");
    });

    test("Simple named group replacement", () => {
        const fileNameMatcher = /Prefix-(?<core>.*)\.md/;
        
        expect(transform("Prefix-And I should match.md", fileNameMatcher, "$core.md")).toBe("And I should match.md");
    });

    test("No replacements needed", () => {
        const fileNameMatcher = /Prefix-(\d*)-(?<core>.*)\.md/;
        
        expect(transform("Prefix-12345-and_some_text.md", fileNameMatcher, "No rename.md")).toBe("No rename.md");
    });

    test("Replace multiple named groups", () => {
        const fileNameMatcher = /Prefix-(?<id>\d*)-(?<core>.*)\.md/;
        
        expect(transform("Prefix-12345-and_some_text.md", fileNameMatcher, "$id-$core.md")).toBe("12345-and_some_text.md");
    });

    test("Combination of positional and named groups", () => {
        const fileNameMatcher = /Prefix-(\d*)-(?<core>.*)\.md/;
        
        expect(transform("Prefix-12345-and_some_text.md", fileNameMatcher, "$core-$1.md")).toBe("and_some_text-12345.md");
    });

    test("Positional arguments not found", () => {
        const fileNameMatcher = /Prefix-(.*)\.md/;
        
        expect(transform("Prefix-Suffix.md", fileNameMatcher, "$1-$2.md")).toBe("Suffix-$2.md");
    });

    test("Named group not found", () => {
        const fileNameMatcher = /Prefix-(.*)\.md/;
        
        expect(transform("Prefix-Suffix.md", fileNameMatcher, "$1-$group.md")).toBe("Suffix-$group.md");
    });
});