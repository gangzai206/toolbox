// Navigation
var navItems = document.querySelectorAll(".nav-item");
var toolSections = document.querySelectorAll(".tool-section");
var toolTitle = document.getElementById("tool-title");
var titles = { compress: "图片压缩", qrcode: "二维码生成", json: "JSON 格式化", color: "颜色调色板", wordcount: "字数统计", base64conv: "Base64 编解码", uuidgen: "UUID 生成器", hashcalc: "哈希计算" };

navItems.forEach(function(item) {
  item.addEventListener("click", function() {
    var tool = item.dataset.tool;
    navItems.forEach(function(n) { n.classList.remove("active"); });
    item.classList.add("active");
    toolSections.forEach(function(s) { s.classList.remove("active"); });
    document.getElementById("tool-" + tool).classList.add("active");
    toolTitle.textContent = titles[tool];
  });
});

function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timeout);
  t._timeout = setTimeout(function() { t.classList.remove("show"); }, 2000);
}

// ===== Image Compression =====
(function() {
  var dropzone = document.getElementById("compress-dropzone");
  var fileInput = document.getElementById("compress-input");
  var qualitySlider = document.getElementById("compress-quality");
  var qualityLabel = document.getElementById("compress-q-label");
  var preview = document.getElementById("compress-preview");
  var actions = document.getElementById("compress-actions");
  var downloadBtn = document.getElementById("compress-download");
  var resetBtn = document.getElementById("compress-reset");
  var originalFile = null, compressedBlob = null, originalUrl = null;

  qualitySlider.addEventListener("input", function() {
    qualityLabel.textContent = qualitySlider.value + "%";
    if (originalFile) compressImage(originalFile);
  });

  dropzone.addEventListener("click", function() { fileInput.click(); });
  fileInput.addEventListener("change", function(e) {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  dropzone.addEventListener("dragover", function(e) { e.preventDefault(); dropzone.classList.add("drag-over"); });
  dropzone.addEventListener("dragleave", function() { dropzone.classList.remove("drag-over"); });
  dropzone.addEventListener("drop", function(e) {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (file.size > 20 * 1024 * 1024) { showToast("文件大小不能超过 20MB"); return; }
    originalFile = file;
    compressImage(file);
  }

  function compressImage(file) {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var quality = parseInt(qualitySlider.value) / 100;
      var mimeType = file.type === "image/png" ? "image/jpeg" : file.type || "image/jpeg";
      canvas.toBlob(function(blob) {
        compressedBlob = blob;
        renderPreview(file, blob, img.width, img.height);
      }, mimeType, quality);
    };
    img.src = originalUrl;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }

  function renderPreview(origFile, compBlob, w, h) {
    var ratio = origFile.size > 0 ? ((1 - compBlob.size / origFile.size) * 100).toFixed(1) : "0";
    preview.style.display = "grid";
    var origSrc = originalUrl;
    var compSrc = URL.createObjectURL(compBlob);
    preview.innerHTML =
      "<div class=\"img-preview-card\">" +
        "<div class=\"card-label\">原图 " + formatSize(origFile.size) + " " + w + "\u00d7" + h + "</div>" +
        "<img src=\"" + origSrc + "\" alt=\"原图\">" +
      "</div>" +
      "<div class=\"img-preview-card\">" +
        "<div class=\"card-label\">压缩后 " + formatSize(compBlob.size) + " " + w + "\u00d7" + h + "</div>" +
        "<img src=\"" + compSrc + "\" alt=\"压缩后\">" +
        "<div class=\"card-foot\">减小 " + ratio + "%</div>" +
      "</div>";
    actions.style.display = "flex";
  }

  downloadBtn.addEventListener("click", function() {
    if (!compressedBlob) return;
    var url = URL.createObjectURL(compressedBlob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "compressed_" + (originalFile.name || "image.jpg");
    a.click();
    URL.revokeObjectURL(url);
    showToast("下载完成");
  });

  resetBtn.addEventListener("click", function() {
    originalFile = null; compressedBlob = null;
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = null;
    preview.style.display = "none";
    actions.style.display = "none";
    fileInput.value = "";
  });
})();

// ===== QR Code =====
(function() {
  var qrInput = document.getElementById("qr-input");
  var qrGenerateBtn = document.getElementById("qr-generate");
  var qrResult = document.getElementById("qr-result");
  var qrDownloadBtn = document.getElementById("qr-download-btn");
  var qrCanvas = null;

  qrGenerateBtn.addEventListener("click", function() {
    var val = qrInput.value.trim();
    if (!val) { showToast("请输入文本或网址"); return; }
    qrResult.style.display = "block";
    qrResult.innerHTML = "";
    QRCode.toCanvas(val, { width: 256, margin: 2, color: { dark: "#000", light: "#fff" } }, function(err, canvas) {
      if (err) { showToast("生成失败: " + err.message); return; }
      qrCanvas = canvas;
      qrResult.appendChild(canvas);
      qrDownloadBtn.style.display = "inline-flex";
    });
  });

  qrDownloadBtn.addEventListener("click", function() {
    if (!qrCanvas) return;
    var a = document.createElement("a");
    a.href = qrCanvas.toDataURL("image/png");
    a.download = "qrcode.png";
    a.click();
    showToast("下载完成");
  });

  qrInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") qrGenerateBtn.click();
  });
})();

// ===== JSON Formatter =====
(function() {
  var jsonInput = document.getElementById("json-input");
  var jsonOutput = document.getElementById("json-output");
  var jsonStatus = document.getElementById("json-status");

  function formatJSON(compact) {
    var raw = jsonInput.value.trim();
    if (!raw) { showToast("请输入 JSON"); return; }
    try {
      var obj = JSON.parse(raw);
      jsonOutput.value = JSON.stringify(obj, null, compact ? 0 : 2);
      jsonStatus.className = "json-status success";
      jsonStatus.textContent = "有效的 JSON (" + (compact ? "已压缩" : "已格式化") + ")";
      jsonStatus.style.display = "block";
    } catch (e) {
      jsonOutput.value = "";
      jsonStatus.className = "json-status error";
      jsonStatus.textContent = "JSON 解析错误: " + e.message;
      jsonStatus.style.display = "block";
    }
  }

  document.getElementById("json-format").addEventListener("click", function() { formatJSON(false); });
  document.getElementById("json-compress").addEventListener("click", function() { formatJSON(true); });
  document.getElementById("json-validate").addEventListener("click", function() { formatJSON(false); });
  document.getElementById("json-clear").addEventListener("click", function() {
    jsonInput.value = "";
    jsonOutput.value = "";
    jsonStatus.style.display = "none";
  });
  document.getElementById("json-copy").addEventListener("click", function() {
    if (!jsonOutput.value) { showToast("没有可复制的内容"); return; }
    navigator.clipboard.writeText(jsonOutput.value).then(function() { showToast("已复制到剪贴板"); });
  });
})();

// ===== Color Palette =====
(function() {
  var picker = document.getElementById("color-picker");
  var hexInput = document.getElementById("color-hex");
  var generateBtn = document.getElementById("color-generate");
  var grid = document.getElementById("color-grid");

  function hexToHSL(hex) {
    var r = parseInt(hex.slice(1,3), 16) / 255;
    var g = parseInt(hex.slice(3,5), 16) / 255;
    var b = parseInt(hex.slice(5,7), 16) / 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    var f = function(n) {
      var k = (n + h / 30) % 12;
      var color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return "#" + f(0) + f(8) + f(4);
  }

  function generatePalette(hex) {
    var hsl = hexToHSL(hex);
    var palettes = [];
    for (var i = -2; i <= 2; i++) {
      var h = (hsl.h + i * 30 + 360) % 360;
      palettes.push({ hex: hslToHex(h, hsl.s, hsl.l), label: i === 0 ? "主色" : "近似" + (i > 0 ? "+" + i : i) });
    }
    for (var i = 1; i <= 3; i++) {
      palettes.push({ hex: hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - i * 12)), label: "暗色 " + i });
      palettes.push({ hex: hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + i * 12)), label: "亮色 " + i });
    }
    var compH = (hsl.h + 180) % 360;
    palettes.push({ hex: hslToHex(compH, hsl.s, hsl.l), label: "互补" });

    var seen = {};
    var unique = [];
    for (var p = 0; p < palettes.length; p++) {
      var key = palettes[p].hex.toLowerCase();
      if (!seen[key]) { seen[key] = true; unique.push(palettes[p]); }
    }

    grid.innerHTML = "";
    for (var u = 0; u < unique.length; u++) {
      var pal = unique[u];
      var r = parseInt(pal.hex.slice(1,3), 16);
      var g = parseInt(pal.hex.slice(3,5), 16);
      var b = parseInt(pal.hex.slice(5,7), 16);
      var isDark = (r + g + b) < 384;
      var swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.background = pal.hex;
      swatch.title = pal.hex + " " + pal.label;
      swatch.dataset.hex = pal.hex;
      swatch.innerHTML = "<span style=\"color:" + (isDark ? "#fff" : "#1a1a1a") + "\">" + pal.hex + "</span>";
      swatch.addEventListener("click", function() {
        var hexVal = this.dataset.hex;
        navigator.clipboard.writeText(hexVal).then(function() { showToast("已复制 " + hexVal); });
      });
      grid.appendChild(swatch);
    }
  }

  picker.addEventListener("input", function() {
    hexInput.value = picker.value;
    generatePalette(picker.value);
  });

  hexInput.addEventListener("input", function() {
    var val = hexInput.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      picker.value = val;
      generatePalette(val);
    }
  });

  generateBtn.addEventListener("click", function() {
    generatePalette(picker.value);
  });

  generatePalette("#2563eb");

// ===== Word Counter =====
(function() {
  var input = document.getElementById("wc-input");
  var resultDiv = document.getElementById("wc-result");
  document.getElementById("wc-count").addEventListener("click", function() {
    var text = input.value;
    var chars = text.length;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var lines = text ? text.split("\n").length : 0;
    var paras = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    document.getElementById("wc-chars").textContent = chars;
    document.getElementById("wc-words").textContent = words;
    document.getElementById("wc-lines").textContent = lines;
    document.getElementById("wc-paras").textContent = paras;
    resultDiv.style.display = "block";
  });
  document.getElementById("wc-clear").addEventListener("click", function() {
    input.value = "";
    resultDiv.style.display = "none";
  });
})();

// ===== Base64 =====
(function() {
  var input = document.getElementById("b64-input");
  var output = document.getElementById("b64-output");
  document.getElementById("b64-encode").addEventListener("click", function() {
    try {
      output.value = btoa(unescape(encodeURIComponent(input.value)));
    } catch(e) {
      output.value = "编码失败: " + e.message;
    }
  });
  document.getElementById("b64-decode").addEventListener("click", function() {
    try {
      output.value = decodeURIComponent(escape(atob(input.value)));
    } catch(e) {
      output.value = "解码失败: 请检查输入是否为有效的 Base64 字符串";
    }
  });
  document.getElementById("b64-clear").addEventListener("click", function() {
    input.value = "";
    output.value = "";
  });
  document.getElementById("b64-copy").addEventListener("click", function() {
    if (!output.value) { showToast("没有可复制的内容"); return; }
    navigator.clipboard.writeText(output.value).then(function() { showToast("已复制到剪贴板"); });
  });
})();

// ===== UUID Generator =====
(function() {
  var display = document.getElementById("uuid-display");
  var list = document.getElementById("uuid-list");
  var lastUuid = "";
  function generate(count) {
    var uuids = [];
    for (var i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    if (count === 1) {
      lastUuid = uuids[0];
      display.textContent = uuids[0];
      list.style.display = "none";
    } else {
      lastUuid = uuids.join("\n");
      list.innerHTML = uuids.map(function(u, i) { return (i+1) + ". " + u; }).join("<br>");
      list.style.display = "block";
      display.textContent = "已生成 " + count + " 个 UUID";
    }
  }
  document.getElementById("uuid-gen-one").addEventListener("click", function() { generate(1); });
  document.getElementById("uuid-gen-five").addEventListener("click", function() { generate(5); });
  document.getElementById("uuid-copy").addEventListener("click", function() {
    navigator.clipboard.writeText(lastUuid).then(function() { showToast("已复制到剪贴板"); });
  });
})();

// ===== Hash Calculator =====
(function() {
  var input = document.getElementById("hash-input");
  var output = document.getElementById("hash-output");
  function hash(algo) {
    var text = input.value;
    if (!text) { showToast("请输入文本"); return; }
    var encoder = new TextEncoder();
    var data = encoder.encode(text);
    crypto.subtle.digest(algo, data).then(function(hashBuffer) {
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      output.value = hashArray.map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
    }).catch(function(e) {
      output.value = "计算失败: " + e.message;
    });
  }
  document.getElementById("hash-sha256").addEventListener("click", function() { hash("SHA-256"); });
  document.getElementById("hash-sha512").addEventListener("click", function() { hash("SHA-512"); });
  document.getElementById("hash-sha1").addEventListener("click", function() { hash("SHA-1"); });
  document.getElementById("hash-md5").addEventListener("click", function() {
    output.value = "MD5 需要额外库支持，正在加载...";
    // Use a simple CDN-based MD5
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js";
    s.onload = function() {
      output.value = md5(input.value);
    };
    s.onerror = function() {
      output.value = "MD5 库加载失败，请使用 SHA-256 代替";
    };
    document.head.appendChild(s);
  });
  document.getElementById("hash-copy").addEventListener("click", function() {
    if (!output.value) { showToast("没有可复制的内容"); return; }
    navigator.clipboard.writeText(output.value).then(function() { showToast("已复制到剪贴板"); });
  });
})();

})();