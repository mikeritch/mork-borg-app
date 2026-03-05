(() => {
  "use strict";

  const key = "morkborg-reliquary.theme.v1";
  let theme = "dark";

  try {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") {
      theme = saved;
    }
  } catch (_error) {
    theme = "dark";
  }

  document.documentElement.setAttribute("data-theme", theme);
})();
