# cbt-self-help

Guided self-help sessions based on cognitive behavioral therapy (CBT), run inside Claude Code and backed by
the researched CBT knowledge graph bundled in `kg\`.

**This is not therapy.** It does not replace a therapist, doctor or other professional care. The creator
claims no therapeutic benefit and accepts no legal liability for its use. If you are in crisis: US, call or
text 988 or call 911; UK, Samaritans 116 123, text SHOUT to 85258, NHS 111 or 999; elsewhere,
findahelpline.com.

## Commands

| Command | What it does |
|---|---|
| `/cbt-session` | Shows the notice and starts a session. Claude follows the CBT session structure from the knowledge graph: mood check and safety screen, homework review, agenda, one piece of work, summary, practice task, feedback. |
| `/cbt-end` | Wraps up and closes the session (it is saved step by step as it goes). A session that stopped before anything worth keeping happened is discarded, not saved. |
| `/cbt-record` | Shows your saved record: goals, mood and questionnaire scores over time, current practice task. |
| `/cbt-formulation` | Exports your formulation so the formulation page can import it. |
| `/cbt-forget confirm` | Erases your record. |

## How it works

- `protocol.md` is the session protocol. It is added to Claude's instructions only while a session runs.
- During a session Claude can only read the knowledge graph and save the record. Shell commands, file edits
  and web access are blocked.
- Your record is a small wiki in `C:\Users\huxle\.cbt-self-help\`, on this computer only: `_index.md`,
  `profile.md`, `formulation.md`, and `sessions\session-NNN.md` with a session index. Pages carry
  knowledge graph page ids (`related`) and vocabulary ids (`concepts`). They are generated from
  `_data.json` after every change, so hand edits are overwritten.
- `topics\` is the person wiki: one page per theme (sleep, work stress, a core belief, what helps),
  written in prose by Claude and revised each session, with each claim citing its session. These pages
  are not regenerated, so your hand edits stay, and Claude treats them as authoritative.
- Formulations are coded with the knowledge graph's fixed vocabulary, so they open in
  `kg\formulation\index.html`.

Paths are set at the top of `hooks/register.ts`.
