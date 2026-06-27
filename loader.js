(function () {
  var XOR_MASK = 167;
  var PBKDF2_ITERATIONS = 120000;
  var obfuscated = [246, 228, 204, 192, 197, 245, 238, 212, 206, 144, 208, 150, 195, 205, 205, 213, 247, 196, 159, 215, 235, 200, 138, 208, 214, 159, 245, 205, 244, 198, 147, 230];

  function revealPassphrase() {
    var out = "";
    for (var i = 0; i < obfuscated.length; i++) {
      out += String.fromCharCode(obfuscated[i] ^ XOR_MASK);
    }
    return out;
  }

  function decodeBase64(value) {
    var binary = atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function runDecrypted(code) {
    var script = document.createElement("script");
    script.textContent = code;
    document.body.appendChild(script);
  }

  async function boot() {
    var response = await fetch("app.enc", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("failed to load app.enc");
    }

    var payload = await response.json();
    var salt = decodeBase64(payload.salt);
    var iv = decodeBase64(payload.iv);
    var tag = decodeBase64(payload.tag);
    var data = decodeBase64(payload.data);
    var ciphertext = new Uint8Array(data.length + tag.length);
    ciphertext.set(data);
    ciphertext.set(tag, data.length);

    var passphrase = revealPassphrase();
    var keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    var key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    var decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    runDecrypted(new TextDecoder().decode(decrypted));
  }

  boot().catch(function () {
    /* fail silently */
  });
})();
