---
name: bodhi-model-switch
description: Switch the active AI model between Claude and local Ollama.
triggers:
  - /claude
  - /ollama
user-invocable: true
disable-model-invocation: false
---

# bodhi-model-switch

Switches the gateway model by editing `~/.openclaw/openclaw.json`. The gateway hot-reloads the change within ~3 seconds — no restart needed.

## On `/claude`

```bash
python3 -c "
import json, os, pathlib
cfg = pathlib.Path(os.path.expanduser('~/.openclaw/openclaw.json'))
d = json.loads(cfg.read_text())
d['agents']['defaults']['model'] = 'anthropic/claude-sonnet-4-6'
d['agents']['defaults']['thinkingDefault'] = 'low'
cfg.write_text(json.dumps(d, indent=2))
print('switched')
"
```

Reply: `Switched to Claude (Sonnet). Vision and extended thinking enabled.`

## On `/ollama`

Reply without running any command:

```
Ollama gateway mode is not available on this hardware.
Local Ollama handles enrichment automatically — no switch needed.
For lowest-cost chat: /model haiku
```

## Rules

- Run the bash command, then reply with the status line. Nothing else.
- Never expose the config file path or token in the reply.
- If the command fails, reply: `Switch failed — check server logs.`
