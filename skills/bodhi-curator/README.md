# bodhi-curator

**Status:** Planned (Phase 2)
**Trigger:** Real-time — incoming message via Signal or WhatsApp
**Schedule:** N/A (event-driven)

---

## What It Does

The Curator is the entry point for all captures. Every message you send to Bodhi
flows through the Curator before anything else touches it.

It classifies the message, generates tags, prompts for an energy level,
and writes the resulting node to the vault.

---

## Input

An incoming message object from the OpenClaw Gateway:

```typescript
{
  channel: "signal" | "whatsapp",
  sender: string,        // phone number or contact ID
  content: string,       // raw message text
  timestamp: string,     // ISO 8601
  attachments?: string[] // file paths, if any
}
```

---

## Output

A vault node written to `vault/nodes/YYYY-MM/{uuid}.json` and indexed in ChromaDB.

```typescript
{
  id: string,            // UUID v4
  type: NodeType,        // one of 6
  content: string,       // original message text
  energy_level: number,  // 1-5, user-assigned
  created_at: string,    // ISO 8601
  source: "signal" | "whatsapp",
  tags: string[]         // AI-generated
}
```

An acknowledgment message sent back to the user via the same channel.

---

## Classification Flow

```
Incoming message
    ↓
Complexity assessment (Claude Sonnet 4.6)
    ↓
Simple → classify type + generate tags → prompt energy → write node
Complex → ask 2-3 clarifying questions → collect responses → classify → write node
```

**Simple message criteria:**
- Single clear thought
- One sentence or two closely related sentences
- No embedded questions or contradictions

**Complex message criteria:**
- Multiple distinct ideas
- Contains an emotional frame + an intellectual frame
- Contradicts something the user said recently
- Is a question (may route to general Claude response instead of filing)

---

## Energy Level Protocol

After classification, Curator sends:

> "Energy level 1-5?"

User replies with a single digit. If no reply within 30 minutes, defaults to 3.

Energy levels:
- **1** — low resonance, background thought
- **2** — mild interest
- **3** — moderate (default)
- **4** — strong pull, worth revisiting
- **5** — urgent or highly charged

---

## Planned Implementation

- [ ] Register with OpenClaw Gateway as `bodhi-curator` skill
- [ ] Implement complexity classifier via Claude Sonnet 4.6
- [ ] Implement tag generator (2-5 tags, lowercase, hyphenated)
- [ ] Implement energy level conversation handler
- [ ] Implement vault write module (JSON + ChromaDB)
- [ ] Implement acknowledgment response formatter
- [ ] Handle URL-only messages (store as `reference` tag, skip energy prompt)
- [ ] Handle question messages (route to general Claude, do not file)
- [ ] Tests for each handler path
