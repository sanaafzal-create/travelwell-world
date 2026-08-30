# TravelWell — transactional email templates

The brand, held in mail-client conditions. One base look; the copy block in the
card changes per template. **Everything load-bearing is inline** (tables +
inline styles), because email clients strip `<style>` unpredictably; the
`<style>` block carries progressive niceties only.

## Installing (Supabase Dashboard)

Auth → **Email Templates**, then paste the file's full HTML into the template
body:

| Supabase template | file | notes |
|---|---|---|
| **Magic Link** | `magic-link.html` | as-is — `{{ .ConfirmationURL }}` is the tap target |
| **Confirm signup** | `magic-link.html` | same file works; optionally change the `<h1>` to "Confirm your email and you're in." and the eyebrow to "One tap · you're new here" |

Set the **sender name** to `TravelWell` (one word — never "Travel Well") in
Auth → SMTP settings. Subject lines that match the voice:

- Magic Link: `Your sign-in link — one tap, no password`
- Confirm signup: `Confirm your email — one tap, no password`

## Brand rules this template holds (don't edit them out)

- **The wordmark is text**, never an image: `Travel` + pine `Well` +
  italic champagne `.world` at reduced size. No hosted asset to break or be
  blocked by an image-off client.
- **The slogan is the registered mark, character-exact**:
  `If It's Safer Informed Travel… TravelWell.™` — the ellipsis **and** the
  closing full stop are part of the mark; `Well` carries the pine accent on
  light grounds. It sits at the **top**, under the header — the MottoBand
  position every page uses. English-only in every locale.
- **Readability floors** (locked): body 17px weight 500 on Espresso; nothing a
  person reads under 16px; footer fine print at the 13px label floor, weight
  600; the button is 48px tall at 17px/700 with a real border. Phones get the
  *larger* body size (18px ≤620px), not a smaller one.
- **Voice**: plain and warm, no urgency, no FOMO, "No password, ever." The
  didn't-ask-for-this line states what is true and stops.
- **The raw URL prints in full** under the button — a client that blocks
  buttons must never block the sign-in.
- Colors are the site's tokens, hex-frozen for mail:
  Ivory `#F7F4EC` · card `#FFFFFF` · Espresso `#1C1B18` · Stone `#4F4D48` ·
  Pine `#2C6E68` / deep `#235A55` · Champagne `#C2A35B` · gold-deep text
  `#8a6425` · control edge `#89867E` · hairline `#E3DFD7` · dark band `#211D17`.

## Testing before it ships

Send yourself each template from the Supabase dashboard's "Send test email",
and read it in at least: iPhone Mail (light + dark — the template pins light),
Gmail web, and Outlook desktop (the button is VML-bulletproofed for it). The
fonts degrade to Georgia / system sans by design — the hierarchy must survive
that, and does.
