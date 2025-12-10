document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#button').addEventListener('click', () => {
        browser.runtime.sendMessage({ command: "run-action" });
        window.close();
    });
});
