const fs = require('fs');

const prevLogPath = '/Users/hohoangson/.gemini/antigravity-ide/brain/9added5c-e362-412d-ab1d-84cb5fa82456/.system_generated/logs/transcript.jsonl';
if (fs.existsSync(prevLogPath)) {
    console.log("Previous conversation log exists!");
    const lines = fs.readFileSync(prevLogPath, 'utf8').split('\n');
    console.log("Read", lines.length, "lines from previous log");
    
    let count = 0;
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'PLANNER_RESPONSE') {
                const toolCalls = obj.tool_calls || [];
                for (const tc of toolCalls) {
                    const args = tc.args || {};
                    if (args.TargetFile && args.TargetFile.includes('managerdashboard.jsx')) {
                        console.log(`Step ${obj.step_index}: Tool: ${tc.name}`);
                        count++;
                    }
                }
            }
        } catch (e) {}
    }
    console.log("Found", count, "tool calls targeting managerdashboard.jsx in previous log");
} else {
    console.log("Previous conversation log does NOT exist at:", prevLogPath);
}
