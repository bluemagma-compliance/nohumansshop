import { CURSOR_HREF, VSCODE_HREF } from "./hero";

// Full manual install reference — one card per client. The server is a remote
// Streamable-HTTP endpoint; every path triggers OAuth/DCR on first call (no keys).
export default function Connect() {
  return (
    <section className="section" id="connect">
      <div className="wrap">
        <div className="section-h">
          <h2>Connect in seconds</h2>
          <span className="sub">remote MCP · OAuth · no API keys</span>
        </div>

        <div className="connect-grid">
          {/* Claude Code */}
          <div className="card client-card">
            <div className="card-h">Claude Code</div>
            <div className="card-b">
              <pre className="code">
                <span className="c">$</span> claude mcp add --transport http nohumans
                https://nohumans.shop/api/mcp
              </pre>
              <p className="note">
                Add <code>--scope user</code> to use it in every project. Then{" "}
                <code>claude mcp login nohumans</code> runs the OAuth flow from your
                shell (or just call a tool and approve in the <code>/mcp</code> panel).
              </p>
            </div>
          </div>

          {/* Claude Desktop / claude.ai */}
          <div className="card client-card">
            <div className="card-h">Claude Desktop &amp; claude.ai</div>
            <div className="card-b">
              <ol className="steps-mini">
                <li>
                  <span className="num">1</span> Settings → <b>Connectors</b> → <b>Add
                  custom connector</b>.
                </li>
                <li>
                  <span className="num">2</span> Name <b>noHumansShop</b>, URL{" "}
                  <code>https://nohumans.shop/api/mcp</code>.
                </li>
                <li>
                  <span className="num">3</span> <b>Add</b> → sign in via the OAuth
                  popup.
                </li>
              </ol>
              <p className="note">
                Team/Enterprise: an org owner enables custom connectors once under Org
                settings → Connectors.
              </p>
            </div>
          </div>

          {/* Cursor & VS Code */}
          <div className="card client-card">
            <div className="card-h">Cursor &amp; VS Code</div>
            <div className="card-b">
              <div className="cbtns">
                <a className="cbtn primary" href={CURSOR_HREF}>
                  + Add to Cursor
                </a>
                <a className="cbtn" href={VSCODE_HREF}>
                  + Install in VS Code
                </a>
              </div>
              <p className="microlab">…or add it to your mcp.json by hand</p>
              <pre className="code">
{`{
  `}<span className="k">{`"mcpServers"`}</span>{`: {
    `}<span className="k">{`"nohumans"`}</span>{`: { `}<span className="k">{`"url"`}</span>{`: `}<span className="s">{`"https://nohumans.shop/api/mcp"`}</span>{` }
  }
}`}
              </pre>
            </div>
          </div>

          {/* stdio-only clients */}
          <div className="card client-card">
            <div className="card-h">Any other client (Windsurf, Cline, Zed…)</div>
            <div className="card-b">
              <p className="note">
                Stdio-only clients reach the remote server through the{" "}
                <code>mcp-remote</code> bridge — it handles OAuth + token storage for
                you.
              </p>
              <pre className="code">
{`{
  `}<span className="k">{`"mcpServers"`}</span>{`: {
    `}<span className="k">{`"nohumans"`}</span>{`: {
      `}<span className="k">{`"command"`}</span>{`: `}<span className="s">{`"npx"`}</span>{`,
      `}<span className="k">{`"args"`}</span>{`: [`}<span className="s">{`"-y"`}</span>{`, `}<span className="s">{`"mcp-remote"`}</span>{`, `}<span className="s">{`"https://nohumans.shop/api/mcp"`}</span>{`]
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
