const fs = require('fs');

const logPath = '/Users/hohoangson/.gemini/antigravity-ide/brain/72c90c2b-b093-4bd1-844c-01c22028af70/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist");
    process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
console.log("Read", lines.length, "lines");

let fileContent = fs.readFileSync('/Users/hohoangson/Documents/my_study/Application_v1/frontend/app/(warehouse_manager)/managerdashboard.jsx', 'utf8');

let currentContent = fileContent;
console.log("Starting with original content of length:", currentContent.length);

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.type === 'PLANNER_RESPONSE') {
            const toolCalls = obj.tool_calls || [];
            for (const tc of toolCalls) {
                if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
                    const args = tc.args || {};
                    const targetFile = args.TargetFile || '';
                    
                    // Parse strings safely if they are wrapped in quotes
                    const parseVal = (val) => {
                        if (!val) return '';
                        if (typeof val === 'string') {
                            if (val.startsWith('"') && val.endsWith('"')) {
                                try {
                                    return JSON.parse(val);
                                } catch (e) {
                                    // Fallback if not double-escaped
                                    return val.substring(1, val.length - 1);
                                }
                            }
                            return val;
                        }
                        return String(val);
                    };

                    const cleanTargetFile = parseVal(targetFile);

                    if (cleanTargetFile.includes('managerdashboard.jsx')) {
                        console.log(`Step ${obj.step_index}: Found tool ${tc.name}`);
                        if (tc.name === 'write_to_file' && args.CodeContent) {
                            currentContent = parseVal(args.CodeContent);
                            console.log(`  write_to_file set content to length: ${currentContent.length}`);
                        } else if (tc.name === 'replace_file_content') {
                            const target = parseVal(args.TargetContent);
                            const replacement = parseVal(args.ReplacementContent);
                            
                            // Normalize newlines to avoid \r\n vs \n issues
                            const normContent = currentContent.replace(/\r\n/g, '\n');
                            const normTarget = target.replace(/\r\n/g, '\n');
                            const normReplacement = replacement.replace(/\r\n/g, '\n');

                            if (normContent.includes(normTarget)) {
                                currentContent = normContent.replace(normTarget, normReplacement);
                                console.log(`  replace_file_content succeeded! Length: ${currentContent.length}`);
                            } else {
                                console.log(`  replace_file_content target NOT found!`);
                                console.log(`  Expected target length: ${target.length}`);
                                // Compare small chunks to diagnose
                                const startChunk = normTarget.substring(0, 40);
                                console.log(`  Target start chunk: [${startChunk}]`);
                                console.log(`  Includes start chunk? ${normContent.includes(startChunk)}`);
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Parse error:", e.message);
    }
}

fs.writeFileSync('/Users/hohoangson/Documents/my_study/Application_v1/frontend/app/(warehouse_manager)/managerdashboard.jsx', currentContent);
console.log("Successfully restored managerdashboard.jsx to the latest step in transcript!");
