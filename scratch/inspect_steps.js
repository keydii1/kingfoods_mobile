const fs = require('fs');

const logPath = '/Users/hohoangson/.gemini/antigravity-ide/brain/72c90c2b-b093-4bd1-844c-01c22028af70/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index >= 100 && obj.step_index <= 125) {
            const str = JSON.stringify(obj);
            if (str.toLowerCase().includes('managerdashboard.jsx')) {
                console.log(`Step ${obj.step_index}: Type: ${obj.type}`);
                if (obj.tool_calls) {
                    console.log("  Tool calls:", obj.tool_calls.map(tc => ({ name: tc.name, args: tc.args })));
                } else {
                    console.log("  No tool calls in this entry");
                }
            }
        }
    } catch (e) {}
}
