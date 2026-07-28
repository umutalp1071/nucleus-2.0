# I refused to encrypt the stored API key, and I think that's the honest call

The tempting move when you store a user's API key locally is to encrypt it
at rest. I looked at it seriously and backed away.

**What I hit:** Nucleus stores your OpenRouter key in a plain JSON file on
your own disk. The instinct says "encrypt it" -- unencrypted secrets feel
wrong on sight.

**What I tried first:** sketched out AES-encrypting the value before writing
it to `settings.json`. Then asked the obvious next question: where does the
decryption key live? Answer: right next to it, on the same disk, readable by
the same process. That's not security, it's a lock with the key taped to the
door.

**What worked:** plain storage, honestly labeled.

```ts
// .nucleus/settings.json -- same threat model as ~/.ssh/id_rsa.
// Anyone with filesystem access to this machine already has your key,
// encrypted or not.
```

The API only ever returns a redacted preview -- never the raw value -- so the
one real leak surface (accidentally echoing it back to the browser) is closed
by never sending it, not by scrambling it at rest.

**Why this way:** encrypting a secret with a key stored next to it doesn't
raise the bar against the threat that actually matters here (someone with
access to your machine). It only raises the bar against a threat that
doesn't exist for a single-operator local app, while making the code more
complex and, worse, making the false claim "encrypted: true" look like a
real security boundary to someone who doesn't check.

**What it costs:** it looks worse in a screenshot than a lock icon would. I'd
rather ship the accurate threat model than the reassuring lie.

Where's your line between real security and security theater in a
local-first tool?

#buildinpublic #nucleus2 #security
