// version.js
const VERSION = '6'; // меняешь число при обновлении файлов

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img, source, video, script, link").forEach(el => {
        const attr = el.src ? 'src' : (el.href ? 'href' : null);
        if (attr && el[attr].includes("resources.edufyuzbekistan.com")) {
            // чтобы не дублировать параметр
            if (!el[attr].includes(`?v=${VERSION}`)) {
                el[attr] = `${el[attr]}?v=${VERSION}`;
            }
        }
    });
});
